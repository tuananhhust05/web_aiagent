"""
Atlas meeting context API: company, deal, past events for calendar meeting detail panel.
Atlas Knowledge: Product Info document management (MongoDB AtlasProductInfo + Weaviate AtlasProductInfo).
"""
import os
import uuid
import traceback
import logging
import httpx
from fastapi import APIRouter, Depends, Query, HTTPException, UploadFile, File, BackgroundTasks, Path
from fastapi.responses import FileResponse
from typing import Optional, List, Any
from pydantic import BaseModel, Field
from datetime import datetime

from app.core.database import get_database, get_weaviate
from app.core.auth import get_current_active_user
from app.models.user import UserResponse
from app.models.rag_document import RAGDocumentStatus
from app.services.pdf_processor import process_file_to_chunks
from app.services.vectorization import vectorize_texts
from bson import ObjectId

logger = logging.getLogger(__name__)

# Whisper API URL for transcription
WHISPER_API_URL = os.getenv("WHISPER_API_URL", "http://207.180.227.97:8060/v1/audio/transcriptions")

try:
    from weaviate.classes.query import Filter
    WEAVIATE_FILTER_AVAILABLE = True
except ImportError:
    WEAVIATE_FILTER_AVAILABLE = False

router = APIRouter(prefix="/atlas", tags=["Atlas"])


class ContactSummary(BaseModel):
    id: str
    first_name: str
    last_name: str
    company: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    job_title: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None


class DealSummary(BaseModel):
    id: str
    name: str
    status: Optional[str] = None
    stage_name: Optional[str] = None
    next_step: Optional[str] = None
    amount: float = 0.0


class PastEventItem(BaseModel):
    id: str
    type: str  # email, meeting, call, note
    date: str
    subject: Optional[str] = None
    content: Optional[str] = None


class LastInteractionSnapshot(BaseModel):
    summary: Optional[str] = None
    open_points: Optional[str] = None
    agreed_next_step: Optional[str] = None


class MeetingPreparation(BaseModel):
    key_points: Optional[List[str]] = None
    risks_or_questions: Optional[List[str]] = None
    suggested_angle: Optional[str] = None


class CompanyDisplay(BaseModel):
    """Company data for detail panel. Single ranges for employees/revenue per spec."""
    name: Optional[str] = None
    employee_count_range: Optional[str] = None  # e.g. "50-100"
    revenue_range: Optional[str] = None  # e.g. "€1M-1.5M"
    business_description: Optional[str] = None
    country: Optional[str] = None
    region: Optional[str] = None
    city: Optional[str] = None
    locality: Optional[str] = None
    crm_missing_message: Optional[str] = None  # "Your CRM does not seem to have this information..."


class MeetingContextResponse(BaseModel):
    contact: Optional[ContactSummary] = None
    deal: Optional[DealSummary] = None
    company: Optional[CompanyDisplay] = None
    past_events: List[PastEventItem] = []
    last_interaction: Optional[LastInteractionSnapshot] = None
    meeting_preparation: Optional[MeetingPreparation] = None
    meeting_number_with_company: Optional[int] = None  # e.g. 2 for "2nd meeting"
    objective_of_meeting: Optional[str] = None


# Meeting participants (filled by user per calendar event)
class MeetingParticipantItem(BaseModel):
    id: Optional[str] = None
    name: str = Field(..., min_length=1, max_length=200)
    email: Optional[str] = None
    job_title: Optional[str] = None
    company: Optional[str] = None
    notes: Optional[str] = None


class CompanyInfoUser(BaseModel):
    """User-filled company info for this meeting."""
    industry: Optional[str] = None
    size_revenue: Optional[str] = None
    location: Optional[str] = None
    founded: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None


class MainContactUser(BaseModel):
    """User-filled main contact for this meeting."""
    name: Optional[str] = None
    email: Optional[str] = None
    job_title: Optional[str] = None


class MeetingParticipantsPayload(BaseModel):
    event_id: str = Field(..., description="Calendar event ID (e.g. Google event id)")
    participants: List[MeetingParticipantItem] = Field(default_factory=list)
    company_info: Optional[CompanyInfoUser] = None
    main_contact: Optional[MainContactUser] = None
    deal_stage: Optional[str] = None
    event_title: Optional[str] = None
    event_start: Optional[str] = None  # ISO datetime for history listing


class MeetingParticipantsResponse(BaseModel):
    event_id: str
    participants: List[MeetingParticipantItem]
    company_info: Optional[CompanyInfoUser] = None
    main_contact: Optional[MainContactUser] = None
    deal_stage: Optional[str] = None
    event_title: Optional[str] = None
    event_start: Optional[str] = None


class MeetingHistoryItem(BaseModel):
    event_id: str
    event_title: Optional[str] = None
    event_start: Optional[str] = None


class MeetingHistoryByEmailResponse(BaseModel):
    email: str
    meetings: List[MeetingHistoryItem]


class CalendarEventSyncItem(BaseModel):
    id: str = Field(..., description="Calendar event ID")
    summary: Optional[str] = None
    start: Optional[str] = None  # ISO datetime or date
    end: Optional[str] = None


class CalendarEventsSyncPayload(BaseModel):
    events: List[CalendarEventSyncItem] = Field(default_factory=list)


def _stage_to_display(stage: Optional[str]) -> Optional[str]:
    """Map pipeline stage to spec: Discovery / Demo / Negotiation / Closing."""
    if not stage:
        return None
        # Map common stage names to spec labels
    s = (stage or "").lower()
    if "discovery" in s or "lead" in s or "qualified" in s or "contact" in s:
        return "Discovery"
    if "demo" in s or "presentation" in s:
        return "Demo"
    if "negotiation" in s or "proposal" in s:
        return "Negotiation"
    if "clos" in s or "won" in s or "lost" in s:
        return "Closing"
    return stage


@router.get("/meeting-context", response_model=MeetingContextResponse)
async def get_meeting_context(
    q: str = Query(..., description="Company name or search term from meeting title"),
    current_user: UserResponse = Depends(get_current_active_user),
):
    """
    Get meeting context for calendar detail panel: contact, deal, company display,
    past events (from deal activities), last interaction snapshot, preparation placeholders.
    """
    db = get_database()
    user_id = str(current_user.id)

    # Search contacts by company or name/email (same as contacts list search)
    filter_contact = {"user_id": user_id}
    if q and q.strip():
        filter_contact["$or"] = [
            {"company": {"$regex": q.strip(), "$options": "i"}},
            {"first_name": {"$regex": q.strip(), "$options": "i"}},
            {"last_name": {"$regex": q.strip(), "$options": "i"}},
            {"email": {"$regex": q.strip(), "$options": "i"}},
        ]
    contact_doc = await db.contacts.find_one(filter_contact)
    contact_summary = None
    contact_id = None
    company_name = None

    if contact_doc:
        contact_id = str(contact_doc["_id"])
        company_name = contact_doc.get("company") or ""
        contact_summary = ContactSummary(
            id=contact_id,
            first_name=contact_doc.get("first_name", ""),
            last_name=contact_doc.get("last_name", ""),
            company=contact_doc.get("company"),
            email=contact_doc.get("email"),
            phone=contact_doc.get("phone"),
            job_title=contact_doc.get("job_title"),
            address=contact_doc.get("address"),
            city=contact_doc.get("city"),
            state=contact_doc.get("state"),
            country=contact_doc.get("country"),
        )

    # Get deal for this contact
    deal_doc = None
    if contact_id:
        deal_doc = await db.deals.find_one({
            "user_id": user_id,
            "contact_id": contact_id,
        }, sort=[("updated_at", -1)])
    if not deal_doc and contact_id:
        deal_doc = await db.deals.find_one({
            "user_id": user_id,
            "contact_id": contact_id,
        })

    deal_summary = None
    deal_id = None
    stage_name = None
    pipeline_map = {}

    if deal_doc:
        deal_id = str(deal_doc["_id"])
        if deal_doc.get("pipeline_id"):
            pipeline = await db.pipelines.find_one({
                "_id": ObjectId(deal_doc["pipeline_id"]),
                "user_id": user_id,
            })
            if pipeline:
                stages = {s.get("id", ""): s for s in pipeline.get("stages", [])}
                sid = deal_doc.get("stage_id") or deal_doc.get("status", "")
                stage_info = stages.get(sid) or next((s for s in pipeline.get("stages", []) if s.get("name", "").lower() == str(sid).lower()), None)
                stage_name = stage_info.get("name") if stage_info else deal_doc.get("status")
        deal_summary = DealSummary(
            id=deal_id,
            name=deal_doc.get("name", ""),
            status=deal_doc.get("status"),
            stage_name=stage_name or deal_doc.get("status"),
            next_step=deal_doc.get("next_step"),
            amount=float(deal_doc.get("amount") or 0),
        )

    # Past events from deal activities (type email, meeting; per spec no call for now)
    past_events: List[PastEventItem] = []
    last_meeting_summary = None
    last_meeting_open = None
    last_meeting_next = None

    if deal_id:
        activities_cursor = db.deal_activities.find(
            {"deal_id": deal_id}
        ).sort("completed_at", -1).limit(50)
        activities = await activities_cursor.to_list(length=50)
        for a in activities:
            atype = (a.get("activity_type") or "note").lower()
            # Spec: track emails and meetings (not calls for now)
            if atype not in ("email", "meeting"):
                continue
            completed = a.get("completed_at") or a.get("created_at")
            date_str = completed.isoformat()[:10] if isinstance(completed, datetime) else str(completed)[:10]
            past_events.append(PastEventItem(
                id=str(a.get("_id", "")),
                type=atype,
                date=date_str,
                subject=a.get("subject"),
                content=a.get("content"),
            ))
            # Last meeting snapshot: use most recent meeting activity
            if atype == "meeting" and last_meeting_summary is None:
                last_meeting_summary = (a.get("content") or a.get("subject") or "")[:300]
                last_meeting_open = None  # placeholder
                last_meeting_next = deal_doc.get("next_step") if deal_doc else None

    last_interaction = None
    if last_meeting_summary or last_meeting_next:
        last_interaction = LastInteractionSnapshot(
            summary=last_meeting_summary,
            open_points=last_meeting_open,
            agreed_next_step=last_meeting_next,
        )

    # Company display: from contact + placeholder for CRM-enhanced (employees, revenue)
    company_display = None
    if contact_summary or company_name:
        # Show CRM upgrade message when we have contact but no enhanced data (employees/revenue)
        has_enhanced = False  # Future: from CRM company record
        crm_msg = None if has_enhanced else "Your CRM does not seem to have this information. You can request the Business Intelligence upgrade from ForSkale by booking a meeting here."
        company_display = CompanyDisplay(
            name=company_name or (contact_summary.company if contact_summary else None),
            employee_count_range=None,
            revenue_range=None,
            business_description=None,
            country=contact_summary.country if contact_summary else None,
            region=contact_summary.state if contact_summary else None,
            city=contact_summary.city if contact_summary else None,
            locality=contact_summary.address if contact_summary else None,
            crm_missing_message=crm_msg,
        )

    # Meeting preparation placeholders (future: from AI or notes)
    meeting_preparation = MeetingPreparation(
        key_points=None,
        risks_or_questions=None,
        suggested_angle=None,
    )

    # Meeting number: count of meeting-type activities
    meeting_count = sum(1 for e in past_events if e.type == "meeting")
    meeting_number = meeting_count + 1 if meeting_count else 1  # "next" is this one

    return MeetingContextResponse(
        contact=contact_summary,
        deal=deal_summary,
        company=company_display,
        past_events=past_events[:20],
        last_interaction=last_interaction,
        meeting_preparation=meeting_preparation,
        meeting_number_with_company=meeting_number,
        objective_of_meeting=deal_summary.next_step if deal_summary else None,
    )


# --- Meeting participants (per calendar event) ---
PARTICIPANTS_COLLECTION = "calendar_event_participants"
# --- Calendar events cache (meetings loaded from calendar API; trùng id thì update) ---
CALENDAR_EVENTS_CACHE = "calendar_events_cache"


@router.get("/meeting-participants", response_model=MeetingParticipantsResponse)
async def get_meeting_participants(
    event_id: str = Query(..., description="Calendar event ID (e.g. Google event id)"),
    current_user: UserResponse = Depends(get_current_active_user),
):
    """Get participants and user-filled company/contact info for a calendar meeting (by event_id)."""
    db = get_database()
    user_id = str(current_user.id)
    doc = await db[PARTICIPANTS_COLLECTION].find_one({"user_id": user_id, "event_id": event_id})
    if not doc:
        return MeetingParticipantsResponse(event_id=event_id, participants=[])
    raw = doc.get("participants") or []
    participants = [
        MeetingParticipantItem(
            id=str(p.get("_id", "")),
            name=p.get("name", ""),
            email=p.get("email"),
            job_title=p.get("job_title"),
            company=p.get("company"),
            notes=p.get("notes"),
        )
        for p in raw
    ]
    ci = doc.get("company_info") or {}
    company_info = CompanyInfoUser(
        industry=ci.get("industry"),
        size_revenue=ci.get("size_revenue"),
        location=ci.get("location"),
        founded=ci.get("founded"),
        website=ci.get("website"),
        description=ci.get("description"),
    ) if ci else None
    mc = doc.get("main_contact") or {}
    main_contact = MainContactUser(
        name=mc.get("name"),
        email=mc.get("email"),
        job_title=mc.get("job_title"),
    ) if mc else None
    deal_stage = doc.get("deal_stage")
    event_title = doc.get("event_title")
    event_start = doc.get("event_start")
    return MeetingParticipantsResponse(
        event_id=event_id,
        participants=participants,
        company_info=company_info,
        main_contact=main_contact,
        deal_stage=deal_stage,
        event_title=event_title,
        event_start=event_start,
    )


@router.put("/meeting-participants", response_model=MeetingParticipantsResponse)
async def save_meeting_participants(
    payload: MeetingParticipantsPayload,
    current_user: UserResponse = Depends(get_current_active_user),
):
    """Save participants and user-filled company/contact for a calendar meeting (by event_id). Creates or replaces."""
    db = get_database()
    user_id = str(current_user.id)
    event_id = payload.event_id
    now = datetime.utcnow()
    participants_docs = []
    for p in payload.participants:
        participants_docs.append({
            "name": (p.name or "").strip(),
            "email": (p.email or "").strip() or None,
            "job_title": (p.job_title or "").strip() or None,
            "company": (p.company or "").strip() or None,
            "notes": (p.notes or "").strip() or None,
        })
    company_info_doc = None
    if payload.company_info:
        company_info_doc = {
            "industry": (payload.company_info.industry or "").strip() or None,
            "size_revenue": (payload.company_info.size_revenue or "").strip() or None,
            "location": (payload.company_info.location or "").strip() or None,
            "founded": (payload.company_info.founded or "").strip() or None,
            "website": (payload.company_info.website or "").strip() or None,
            "description": (payload.company_info.description or "").strip() or None,
        }
    main_contact_doc = None
    if payload.main_contact:
        main_contact_doc = {
            "name": (payload.main_contact.name or "").strip() or None,
            "email": (payload.main_contact.email or "").strip() or None,
            "job_title": (payload.main_contact.job_title or "").strip() or None,
        }
    filter_doc = {"user_id": user_id, "event_id": event_id}
    set_doc = {
        "participants": participants_docs,
        "updated_at": now,
    }
    if company_info_doc is not None:
        set_doc["company_info"] = company_info_doc
    if main_contact_doc is not None:
        set_doc["main_contact"] = main_contact_doc
    if payload.deal_stage is not None:
        set_doc["deal_stage"] = (payload.deal_stage or "").strip() or None
    if payload.event_title is not None:
        set_doc["event_title"] = (payload.event_title or "").strip() or None
    if payload.event_start is not None:
        set_doc["event_start"] = (payload.event_start or "").strip() or None
    await db[PARTICIPANTS_COLLECTION].update_one(filter_doc, {"$set": set_doc}, upsert=True)
    return MeetingParticipantsResponse(
        event_id=event_id,
        participants=[MeetingParticipantItem(name=p.get("name", ""), email=p.get("email"), job_title=p.get("job_title"), company=p.get("company"), notes=p.get("notes")) for p in participants_docs],
        company_info=payload.company_info,
        main_contact=payload.main_contact,
        deal_stage=payload.deal_stage,
        event_title=payload.event_title,
        event_start=payload.event_start,
    )


@router.post("/calendar-events/sync")
async def sync_calendar_events(
    payload: CalendarEventsSyncPayload,
    current_user: UserResponse = Depends(get_current_active_user),
):
    """Save calendar events when loading; trùng event_id thì update, không tạo bản ghi mới."""
    db = get_database()
    user_id = str(current_user.id)
    now = datetime.utcnow()
    for ev in payload.events or []:
        if not ev.id:
            continue
        doc = {
            "user_id": user_id,
            "event_id": ev.id,
            "event_title": (ev.summary or "").strip() or None,
            "event_start": (ev.start or "").strip() or None,
            "event_end": (ev.end or "").strip() or None,
            "updated_at": now,
        }
        await db[CALENDAR_EVENTS_CACHE].update_one(
            {"user_id": user_id, "event_id": ev.id},
            {"$set": doc},
            upsert=True,
        )
    return {"synced": len(payload.events or [])}


@router.get("/meeting-history-by-email", response_model=MeetingHistoryByEmailResponse)
async def get_meeting_history_by_email(
    email: str = Query(..., description="Contact email to find past meetings"),
    current_user: UserResponse = Depends(get_current_active_user),
):
    """Get past meetings where this email was main_contact or a participant. Map event_id to saved calendar event data."""
    db = get_database()
    user_id = str(current_user.id)
    email_clean = (email or "").strip().lower()
    if not email_clean:
        return MeetingHistoryByEmailResponse(email=email or "", meetings=[])
    # Find docs where main_contact.email matches or any participant email matches
    cursor = db[PARTICIPANTS_COLLECTION].find({"user_id": user_id})
    meetings: List[MeetingHistoryItem] = []
    seen_ids = set()
    async for doc in cursor:
        eid = doc.get("event_id", "")
        if eid in seen_ids:
            continue
        mc = doc.get("main_contact") or {}
        main_email = (mc.get("email") or "").strip().lower()
        if main_email == email_clean:
            seen_ids.add(eid)
            meetings.append(MeetingHistoryItem(
                event_id=eid,
                event_title=doc.get("event_title"),
                event_start=doc.get("event_start"),
            ))
            continue
        for p in doc.get("participants") or []:
            pe = (p.get("email") or "").strip().lower()
            if pe == email_clean:
                seen_ids.add(eid)
                meetings.append(MeetingHistoryItem(
                    event_id=eid,
                    event_title=doc.get("event_title"),
                    event_start=doc.get("event_start"),
                ))
                break
    # Map event_id -> saved calendar event data (từ calendar_events_cache)
    event_ids = [m.event_id for m in meetings if m.event_id]
    cache_map = {}
    if event_ids:
        cursor_cache = db[CALENDAR_EVENTS_CACHE].find({"user_id": user_id, "event_id": {"$in": event_ids}})
        async for c in cursor_cache:
            cache_map[c["event_id"]] = {
                "event_title": c.get("event_title"),
                "event_start": c.get("event_start"),
            }
    # Override meeting title/start from cache when available
    def _title(m):
        if m.event_id in cache_map and cache_map[m.event_id].get("event_title"):
            return cache_map[m.event_id]["event_title"]
        return m.event_title

    def _start(m):
        if m.event_id in cache_map and cache_map[m.event_id].get("event_start"):
            return cache_map[m.event_id]["event_start"]
        return m.event_start

    meetings = [MeetingHistoryItem(event_id=m.event_id, event_title=_title(m), event_start=_start(m)) for m in meetings]
    # Sort by event_start desc (most recent first); put None at end
    def _sort_key(m: MeetingHistoryItem):
        s = m.event_start or ""
        return (0, s) if s else (1, "")

    meetings.sort(key=_sort_key, reverse=True)
    return MeetingHistoryByEmailResponse(email=email, meetings=meetings[:50])


# --- Rolling Q&A Repository (Atlas Q&A CRUD) ---

class AtlasQnARecord(BaseModel):
    """Single Q&A record for Rolling Q&A Repository."""
    id: str
    question: str
    answer: str
    topic: Optional[str] = None
    usage_count: int = 0
    last_used_at: Optional[datetime] = None
    status: Optional[str] = None  # e.g. "verified", "needs_review"
    created_at: datetime
    updated_at: datetime


class AtlasQnACreate(BaseModel):
    question: str
    answer: str
    topic: Optional[str] = None
    status: Optional[str] = None


class AtlasQnAUpdate(BaseModel):
    question: Optional[str] = None
    answer: Optional[str] = None
    topic: Optional[str] = None
    status: Optional[str] = None


class AtlasQnAListResponse(BaseModel):
    items: List[AtlasQnARecord] = Field(default_factory=list)
    total: int = 0
    page: int = 1
    limit: int = 50


@router.get("/qna", response_model=AtlasQnAListResponse)
async def list_atlas_qna(
    search: Optional[str] = Query(None, description="Search in question and answer text"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_active_user),
):
    """List Q&A records for the current user (Rolling Q&A Repository)."""
    db = get_database()
    coll = db.atlas_qna
    user_id = str(current_user.id)
    filter_query: Any = {"user_id": user_id}
    if search and search.strip():
        filter_query["$or"] = [
            {"question": {"$regex": search.strip(), "$options": "i"}},
            {"answer": {"$regex": search.strip(), "$options": "i"}},
        ]
    total = await coll.count_documents(filter_query)
    skip = (page - 1) * limit
    cursor = coll.find(filter_query).sort("updated_at", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    items = []
    for d in docs:
        items.append(AtlasQnARecord(
            id=str(d["_id"]),
            question=d.get("question", ""),
            answer=d.get("answer", ""),
            topic=d.get("topic"),
            usage_count=int(d.get("usage_count") or 0),
            last_used_at=d.get("last_used_at"),
            status=d.get("status"),
            created_at=d.get("created_at") or datetime.utcnow(),
            updated_at=d.get("updated_at") or datetime.utcnow(),
        ))
    return AtlasQnAListResponse(items=items, total=total, page=page, limit=limit)


@router.post("/qna", response_model=AtlasQnARecord)
async def create_atlas_qna(
    payload: AtlasQnACreate,
    current_user: UserResponse = Depends(get_current_active_user),
):
    """Create a new Q&A record."""
    db = get_database()
    coll = db.atlas_qna
    user_id = str(current_user.id)
    now = datetime.utcnow()
    doc = {
        "user_id": user_id,
        "question": (payload.question or "").strip(),
        "answer": (payload.answer or "").strip(),
        "topic": (payload.topic or "").strip() or None,
        "status": (payload.status or "").strip() or None,
        "usage_count": 0,
        "last_used_at": None,
        "created_at": now,
        "updated_at": now,
    }
    if not doc["question"]:
        raise HTTPException(status_code=400, detail="Question is required")
    result = await coll.insert_one(doc)
    doc["_id"] = result.inserted_id
    return AtlasQnARecord(
        id=str(doc["_id"]),
        question=doc["question"],
        answer=doc["answer"],
        topic=doc.get("topic"),
        usage_count=doc.get("usage_count", 0),
        last_used_at=doc.get("last_used_at"),
        status=doc.get("status"),
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
    )


@router.get("/qna/{qna_id}", response_model=AtlasQnARecord)
async def get_atlas_qna(
    qna_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
):
    """Get a single Q&A record by id."""
    db = get_database()
    coll = db.atlas_qna
    user_id = str(current_user.id)
    try:
        oid = ObjectId(qna_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Q&A id")
    doc = await coll.find_one({"_id": oid, "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Q&A not found")
    return AtlasQnARecord(
        id=str(doc["_id"]),
        question=doc.get("question", ""),
        answer=doc.get("answer", ""),
        topic=doc.get("topic"),
        usage_count=int(doc.get("usage_count") or 0),
        last_used_at=doc.get("last_used_at"),
        status=doc.get("status"),
        created_at=doc.get("created_at") or datetime.utcnow(),
        updated_at=doc.get("updated_at") or datetime.utcnow(),
    )


@router.put("/qna/{qna_id}", response_model=AtlasQnARecord)
async def update_atlas_qna(
    qna_id: str,
    payload: AtlasQnAUpdate,
    current_user: UserResponse = Depends(get_current_active_user),
):
    """Update a Q&A record."""
    db = get_database()
    coll = db.atlas_qna
    user_id = str(current_user.id)
    try:
        oid = ObjectId(qna_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Q&A id")
    doc = await coll.find_one({"_id": oid, "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Q&A not found")
    update_data: Any = {"updated_at": datetime.utcnow()}
    if payload.question is not None:
        update_data["question"] = (payload.question or "").strip()
    if payload.answer is not None:
        update_data["answer"] = (payload.answer or "").strip()
    if payload.topic is not None:
        update_data["topic"] = (payload.topic or "").strip() or None
    if payload.status is not None:
        update_data["status"] = (payload.status or "").strip() or None
    await coll.update_one({"_id": oid, "user_id": user_id}, {"$set": update_data})
    updated = await coll.find_one({"_id": oid, "user_id": user_id})
    return AtlasQnARecord(
        id=str(updated["_id"]),
        question=updated.get("question", ""),
        answer=updated.get("answer", ""),
        topic=updated.get("topic"),
        usage_count=int(updated.get("usage_count") or 0),
        last_used_at=updated.get("last_used_at"),
        status=updated.get("status"),
        created_at=updated.get("created_at") or datetime.utcnow(),
        updated_at=updated.get("updated_at") or datetime.utcnow(),
    )


@router.delete("/qna/{qna_id}")
async def delete_atlas_qna(
    qna_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
):
    """Delete a Q&A record."""
    db = get_database()
    coll = db.atlas_qna
    user_id = str(current_user.id)
    try:
        oid = ObjectId(qna_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Q&A id")
    result = await coll.delete_one({"_id": oid, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Q&A not found")
    return {"ok": True, "message": "Q&A deleted"}


# ----- Atlas Knowledge: documents per category (MongoDB + Weaviate, same schema for all) -----
# category path param -> mongo collection name, weaviate class name, upload subdir
ATLAS_KNOWLEDGE_CONFIG = {
    "product-info": {"mongo": "AtlasProductInfo", "weaviate": "AtlasProductInfo", "dir": "atlas_product_info"},
    "pricing-plan": {"mongo": "AtlasPricingPlan", "weaviate": "AtlasPricingPlan", "dir": "atlas_pricing_plan"},
    "objection-handling": {"mongo": "AtlasObjectionHandling", "weaviate": "AtlasObjectionHandling", "dir": "atlas_objection_handling"},
    "competitive-intel": {"mongo": "AtlasCompetitiveIntel", "weaviate": "AtlasCompetitiveIntel", "dir": "atlas_competitive_intel"},
    "customer-faqs": {"mongo": "AtlasCustomerFaqs", "weaviate": "AtlasCustomerFaqs", "dir": "atlas_customer_faqs"},
    "company-policies": {"mongo": "AtlasCompanyPolicies", "weaviate": "AtlasCompanyPolicies", "dir": "atlas_company_policies"},
}
_uploads_root = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
for cfg in ATLAS_KNOWLEDGE_CONFIG.values():
    os.makedirs(os.path.join(_uploads_root, cfg["dir"]), exist_ok=True)


async def _process_atlas_knowledge_background(category: str, doc_id: str, file_path: str, user_id: str):
    """Background: extract PDF chunks, vectorize, insert into Weaviate; update MongoDB."""
    if category not in ATLAS_KNOWLEDGE_CONFIG:
        return
    cfg = ATLAS_KNOWLEDGE_CONFIG[category]
    mongo_coll = cfg["mongo"]
    weaviate_class = cfg["weaviate"]
    db = get_database()
    coll = db[mongo_coll]
    logger.info(f"🔄 [ATLAS {weaviate_class}] Starting background processing for document {doc_id}")
    try:
        chunks = process_file_to_chunks(file_path, max_tokens=512)
        logger.info(f"✅ [ATLAS {weaviate_class}] Created {len(chunks)} chunks")
        if not chunks:
            raise Exception("No chunks extracted from PDF")
        chunk_texts = [c[0] for c in chunks]
        vectors = vectorize_texts(chunk_texts)
        weaviate_client = get_weaviate()
        if not weaviate_client:
            raise Exception("Weaviate client not available")
        collection = weaviate_client.collections.get(weaviate_class)
        data_objects = [
            {"user_id": user_id, "doc_id": doc_id, "content": chunk_texts[i], "chunk_index": chunks[i][1]}
            for i in range(len(chunks))
        ]
        with collection.batch.dynamic() as batch:
            for idx, data_obj in enumerate(data_objects):
                batch.add_object(properties=data_obj, vector=vectors[idx])
        await coll.update_one(
            {"_id": doc_id},
            {"$set": {"status": RAGDocumentStatus.PROCESSED, "total_chunks": len(chunks), "processed_at": datetime.utcnow()}},
        )
        logger.info(f"✅ [ATLAS {weaviate_class}] Document {doc_id} processed, {len(chunks)} chunks")
    except Exception as e:
        logger.error(f"❌ [ATLAS {weaviate_class}] Error processing {doc_id}: {e}")
        traceback.print_exc()
        await coll.update_one(
            {"_id": doc_id},
            {"$set": {"status": RAGDocumentStatus.FAILED, "error_message": str(e), "processed_at": datetime.utcnow()}},
        )


@router.post("/knowledge/{category}/documents")
async def upload_atlas_knowledge_document(
    category: str,
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: UserResponse = Depends(get_current_active_user),
):
    """Upload a PDF for an Atlas Knowledge category. category: product-info | pricing-plan | objection-handling | competitive-intel | customer-faqs | company-policies."""
    if category not in ATLAS_KNOWLEDGE_CONFIG:
        raise HTTPException(status_code=400, detail=f"Unknown category: {category}")
    cfg = ATLAS_KNOWLEDGE_CONFIG[category]
    try:
        file_extension = (file.filename or "").lower().split(".")[-1]
        if file_extension not in ("pdf", "docx"):
            raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")
        file_bytes = await file.read()
        file_size = len(file_bytes)
        unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
        file_path = os.path.abspath(os.path.join(_uploads_root, cfg["dir"], unique_filename))
        with open(file_path, "wb") as f:
            f.write(file_bytes)
        db = get_database()
        coll = db[cfg["mongo"]]
        doc_id = str(ObjectId())
        document_doc = {
            "_id": doc_id,
            "filename": unique_filename,
            "original_filename": file.filename,
            "file_path": file_path,
            "file_size": file_size,
            "user_id": current_user.id,
            "status": RAGDocumentStatus.PROCESSING,
            "total_chunks": 0,
            "error_message": None,
            "uploaded_at": datetime.utcnow(),
            "processed_at": None,
        }
        await coll.insert_one(document_doc)
        background_tasks.add_task(_process_atlas_knowledge_background, category, doc_id, file_path, str(current_user.id))
        return {
            "id": doc_id,
            "filename": file.filename,
            "status": RAGDocumentStatus.PROCESSING,
            "total_chunks": 0,
            "message": "Document uploaded. Processing in background.",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ [ATLAS {category}] Upload error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/knowledge/{category}/documents")
async def get_atlas_knowledge_documents(
    category: str,
    current_user: UserResponse = Depends(get_current_active_user),
):
    """List Atlas Knowledge documents for the given category and current user."""
    if category not in ATLAS_KNOWLEDGE_CONFIG:
        raise HTTPException(status_code=400, detail=f"Unknown category: {category}")
    cfg = ATLAS_KNOWLEDGE_CONFIG[category]
    db = get_database()
    coll = db[cfg["mongo"]]
    cursor = coll.find({"user_id": current_user.id}).sort("uploaded_at", -1)
    documents = await cursor.to_list(length=None)
    result = []
    for doc in documents:
        fn = doc.get("filename") or doc.get("original_filename") or ""
        ext = fn.lower().split(".")[-1] if "." in fn else "pdf"
        result.append({
            "id": str(doc["_id"]),
            "name": doc.get("original_filename", doc.get("filename", "")),
            "size": doc.get("file_size", 0),
            "uploadedAt": doc.get("uploaded_at", datetime.utcnow()).isoformat(),
            "status": doc.get("status", RAGDocumentStatus.PROCESSING),
            "type": "docx" if ext == "docx" else "pdf",
            "pages": 0,
            "total_chunks": doc.get("total_chunks", 0),
            "error_message": doc.get("error_message"),
        })
    return result


@router.get("/knowledge/{category}/documents/{document_id}/download")
async def download_atlas_knowledge_document(
    category: str,
    document_id: str = Path(..., description="Document ID"),
    current_user: UserResponse = Depends(get_current_active_user),
):
    """Download an Atlas Knowledge document file."""
    if category not in ATLAS_KNOWLEDGE_CONFIG:
        raise HTTPException(status_code=400, detail=f"Unknown category: {category}")
    cfg = ATLAS_KNOWLEDGE_CONFIG[category]
    db = get_database()
    coll = db[cfg["mongo"]]
    doc = await coll.find_one({"_id": document_id, "user_id": current_user.id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    file_path = doc.get("file_path")
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on server")
    fn = doc.get("original_filename") or doc.get("filename") or "document.pdf"
    ext = fn.lower().split(".")[-1] if "." in fn else "pdf"
    media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document" if ext == "docx" else "application/pdf"
    return FileResponse(path=file_path, filename=fn, media_type=media_type)


@router.delete("/knowledge/{category}/documents/{document_id}")
async def delete_atlas_knowledge_document(
    category: str,
    document_id: str = Path(..., description="Document ID to delete"),
    current_user: UserResponse = Depends(get_current_active_user),
):
    """Delete an Atlas Knowledge document from Weaviate and MongoDB."""
    if category not in ATLAS_KNOWLEDGE_CONFIG:
        raise HTTPException(status_code=400, detail=f"Unknown category: {category}")
    cfg = ATLAS_KNOWLEDGE_CONFIG[category]
    db = get_database()
    coll = db[cfg["mongo"]]
    doc = await coll.find_one({"_id": document_id, "user_id": current_user.id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    chunks_deleted = 0
    try:
        weaviate_client = get_weaviate()
        if weaviate_client:
            collection = weaviate_client.collections.get(cfg["weaviate"])
            if WEAVIATE_FILTER_AVAILABLE:
                result = collection.query.fetch_objects(
                    where=Filter.by_property("doc_id").equal(document_id), limit=10000
                )
                chunks_deleted = len(result.objects) if result.objects else 0
                if chunks_deleted > 0:
                    collection.data.delete_many(where=Filter.by_property("doc_id").equal(document_id))
            else:
                offset = 0
                batch_size = 1000
                while True:
                    results = collection.query.fetch_objects(
                        where={"path": ["doc_id"], "operator": "Equal", "valueString": document_id},
                        limit=batch_size,
                        offset=offset,
                    )
                    if not results.objects:
                        break
                    for obj in results.objects:
                        try:
                            collection.data.delete_by_id(obj.uuid)
                            chunks_deleted += 1
                        except Exception:
                            pass
                    if len(results.objects) < batch_size:
                        break
                    offset += batch_size
    except Exception as e:
        logger.warning(f"⚠️ [ATLAS {category}] Weaviate delete error: {e}")
    file_path = doc.get("file_path")
    if file_path and os.path.exists(file_path):
        try:
            os.unlink(file_path)
        except Exception:
            pass
    await coll.delete_one({"_id": document_id})
    return {"message": "Document deleted successfully", "id": document_id, "chunks_deleted": chunks_deleted}


class TranscriptionResponse(BaseModel):
    """Response from transcription API."""
    text: str


# Map file extensions to proper content types for Whisper API
AUDIO_CONTENT_TYPES = {
    "webm": "audio/webm",
    "wav": "audio/wav",
    "mp3": "audio/mpeg",
    "m4a": "audio/mp4",
    "ogg": "audio/ogg",
    "flac": "audio/flac",
}


@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    file: UploadFile = File(..., description="Audio file to transcribe"),
    language: str = Query("en", description="Language code for transcription"),
    current_user: UserResponse = Depends(get_current_active_user),
):
    """
    Proxy endpoint for audio transcription using Whisper API.
    Accepts audio file and returns transcribed text.
    """
    filename = file.filename or "audio.wav"
    logger.info(f"[TRANSCRIBE] User {current_user.id} requesting transcription for file: {filename}, content_type: {file.content_type}")
    
    # Read file content
    file_content = await file.read()
    
    if not file_content:
        raise HTTPException(status_code=400, detail="Empty file uploaded")
    
    logger.info(f"[TRANSCRIBE] File size: {len(file_content)} bytes")
    
    # Determine proper content type from filename extension
    ext = filename.lower().split(".")[-1] if "." in filename else "wav"
    content_type = AUDIO_CONTENT_TYPES.get(ext, file.content_type or "application/octet-stream")
    
    logger.info(f"[TRANSCRIBE] Using content_type: {content_type} for extension: {ext}")
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            # Build multipart data manually to match exact format expected by Whisper API
            # The key must be 'file' and we send the raw file bytes
            files_payload = {
                "file": (filename, file_content, content_type),
            }
            
            # Some Whisper APIs expect 'model' parameter
            data_payload = {
                "language": language,
            }
            
            logger.info(f"[TRANSCRIBE] Sending request to Whisper API: {WHISPER_API_URL}")
            
            response = await client.post(
                WHISPER_API_URL,
                files=files_payload,
                data=data_payload,
            )
            
            logger.info(f"[TRANSCRIBE] Whisper API response status: {response.status_code}")
            
            if response.status_code != 200:
                error_detail = response.text
                logger.error(f"[TRANSCRIBE] Whisper API error: {response.status_code} - {error_detail}")
                
                # If webm is not supported, suggest converting on frontend
                if "Format not recognised" in error_detail and ext == "webm":
                    raise HTTPException(
                        status_code=400,
                        detail="WebM format not supported by transcription service. Please ensure audio is converted to WAV format."
                    )
                
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Transcription service error: {error_detail}"
                )
            
            result = response.json()
            text = result.get("text", "")
            
            logger.info(f"[TRANSCRIBE] Successfully transcribed {len(text)} characters for user {current_user.id}")
            
            return TranscriptionResponse(text=text)
            
    except HTTPException:
        raise
    except httpx.TimeoutException:
        logger.error("[TRANSCRIBE] Whisper API timeout")
        raise HTTPException(status_code=504, detail="Transcription service timeout")
    except httpx.RequestError as e:
        logger.error(f"[TRANSCRIBE] Request error: {str(e)}")
        raise HTTPException(status_code=502, detail=f"Failed to connect to transcription service: {str(e)}")
    except Exception as e:
        logger.error(f"[TRANSCRIBE] Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
