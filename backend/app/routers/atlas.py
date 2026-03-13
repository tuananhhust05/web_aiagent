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
# from app.services.serpapi_service import get_serpapi_service  # DEPRECATED: replaced by Tavily
from app.services.tavily_service import get_tavily_service
from app.services.company_data_pool import get_company_data_pool
from app.services.linkedin_enrichment_service import get_linkedin_enrichment_service
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


class CalendarEventAttendee(BaseModel):
    email: Optional[str] = None
    displayName: Optional[str] = None
    responseStatus: Optional[str] = None
    self_: Optional[bool] = Field(None, alias="self")

    class Config:
        populate_by_name = True


class CalendarEventSyncItem(BaseModel):
    id: str = Field(..., description="Calendar event ID")
    summary: Optional[str] = None
    start: Optional[str] = None  # ISO datetime or date
    end: Optional[str] = None
    attendees: Optional[List[CalendarEventAttendee]] = None


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

    # Meeting preparation: generate with AI based on context
    meeting_prep_data = await generate_meeting_preparation_with_ai(
        company_name=company_name or (contact_summary.company if contact_summary else "") or "",
        contact_name=f"{contact_summary.first_name} {contact_summary.last_name}".strip() if contact_summary else "",
        deal_stage=_stage_to_display(stage_name) or deal_summary.stage_name if deal_summary else "",
        past_events=past_events,
        last_interaction=last_interaction,
        company_info={
            "description": company_display.business_description if company_display else None,
            "industry": None,
            "size_revenue": None,
        } if company_display else None,
    )
    
    meeting_preparation = MeetingPreparation(
        key_points=meeting_prep_data.get("key_points") or None,
        risks_or_questions=meeting_prep_data.get("risks_or_questions") or None,
        suggested_angle=meeting_prep_data.get("suggested_angle") or None,
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
        
        # Extract external attendees (not self)
        attendees_data = []
        if ev.attendees:
            for att in ev.attendees:
                if att.self_:
                    continue
                attendees_data.append({
                    "email": att.email,
                    "displayName": att.displayName,
                    "responseStatus": att.responseStatus,
                })
        
        doc = {
            "user_id": user_id,
            "event_id": ev.id,
            "event_title": (ev.summary or "").strip() or None,
            "event_start": (ev.start or "").strip() or None,
            "event_end": (ev.end or "").strip() or None,
            "attendees": attendees_data,
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

QNA_ORIGIN_VALUES = ("manual", "ai_call_extracted", "ai_knowledge_derived")
QNA_CLASSIFICATION_VALUES = ("product", "service", "general")
QNA_STATUS_VALUES = ("draft", "approved", "archived")


class AtlasQnARecord(BaseModel):
    """Single Q&A record for Rolling Q&A Repository."""
    id: str
    question: str
    answer: str
    classification: Optional[str] = "general"
    topic: Optional[str] = None
    product_tag: Optional[str] = None
    service_tag: Optional[str] = None
    usage_count: int = 0
    last_used_at: Optional[datetime] = None
    status: Optional[str] = "draft"
    # Origin / grounding
    origin: Optional[str] = "manual"
    is_grounded: Optional[bool] = False
    grounding_confidence: Optional[float] = None
    ai_confidence: Optional[float] = None
    # Source linking
    source_call_id: Optional[str] = None
    source_meeting_id: Optional[str] = None
    source_meeting_title: Optional[str] = None
    source_doc_id: Optional[str] = None
    source_doc_name: Optional[str] = None
    # Performance
    growth_percent: Optional[float] = None
    friction_score: Optional[float] = None
    recurring_intensity: Optional[float] = None
    # Organization
    organization_id: Optional[str] = None
    created_by_user_id: Optional[str] = None
    created_by_user_name: Optional[str] = None
    approved_by_user_id: Optional[str] = None
    approved_by_user_name: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class AtlasQnACreate(BaseModel):
    question: str
    answer: str
    classification: Optional[str] = "general"
    topic: Optional[str] = None
    product_tag: Optional[str] = None
    service_tag: Optional[str] = None
    status: Optional[str] = "draft"
    origin: Optional[str] = "manual"
    is_grounded: Optional[bool] = False
    source_call_id: Optional[str] = None
    source_meeting_id: Optional[str] = None
    source_doc_id: Optional[str] = None
    source_doc_name: Optional[str] = None


class AtlasQnAUpdate(BaseModel):
    question: Optional[str] = None
    answer: Optional[str] = None
    classification: Optional[str] = None
    topic: Optional[str] = None
    product_tag: Optional[str] = None
    service_tag: Optional[str] = None
    status: Optional[str] = None
    is_grounded: Optional[bool] = None
    grounding_confidence: Optional[float] = None


class AtlasQnAListResponse(BaseModel):
    items: List[AtlasQnARecord] = Field(default_factory=list)
    total: int = 0
    page: int = 1
    limit: int = 50


@router.get("/qna", response_model=AtlasQnAListResponse)
async def list_atlas_qna(
    search: Optional[str] = Query(None, description="Search in question and answer text"),
    classification: Optional[str] = Query(None, description="Filter by classification"),
    status: Optional[str] = Query(None, description="Filter by status"),
    sort_by: Optional[str] = Query("updated_at", description="Sort field"),
    sort_order: Optional[str] = Query("desc", description="asc or desc"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_active_user),
):
    """List Q&A records for the current organization (Rolling Q&A Repository)."""
    db = get_database()
    coll = db.atlas_qna
    # Use user_id as org_id to match Q&A created by this user
    # (Q&A was created with user_id as org_id when company_id was not set)
    user_id = str(current_user.id)
    company_id = str(current_user.company_id) if current_user.company_id else None
    
    # Query for Q&A that belongs to this user OR their company
    if company_id:
        filter_query: Any = {"$or": [
            {"organization_id": user_id},
            {"organization_id": company_id}
        ]}
    else:
        filter_query: Any = {"organization_id": user_id}
    
    logger.info(f"[Q&A List] User {user_id} -> company_id={company_id}, filter={filter_query}")
    if search and search.strip():
        filter_query["$or"] = [
            {"question": {"$regex": search.strip(), "$options": "i"}},
            {"answer": {"$regex": search.strip(), "$options": "i"}},
        ]
    if classification and classification in QNA_CLASSIFICATION_VALUES:
        filter_query["classification"] = classification
    if status and status in QNA_STATUS_VALUES:
        filter_query["status"] = status
    total = await coll.count_documents(filter_query)
    logger.info(f"[Q&A List] Query: {filter_query}, Total found: {total}")
    skip = (page - 1) * limit
    sort_dir = -1 if sort_order == "desc" else 1
    sort_field = sort_by if sort_by in ("usage_count", "created_at", "last_used_at", "growth_percent") else "updated_at"
    cursor = coll.find(filter_query).sort(sort_field, sort_dir).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    items = []
    for d in docs:
        items.append(AtlasQnARecord(
            id=str(d["_id"]),
            question=d.get("question", ""),
            answer=d.get("answer", ""),
            classification=d.get("classification", "general"),
            topic=d.get("topic"),
            product_tag=d.get("product_tag"),
            service_tag=d.get("service_tag"),
            usage_count=int(d.get("usage_count") or 0),
            last_used_at=d.get("last_used_at"),
            status=d.get("status", "draft"),
            origin=d.get("origin", "manual"),
            is_grounded=d.get("is_grounded", False),
            grounding_confidence=d.get("grounding_confidence"),
            ai_confidence=d.get("ai_confidence"),
            source_call_id=d.get("source_call_id"),
            source_meeting_id=d.get("source_meeting_id"),
            source_meeting_title=d.get("source_meeting_title"),
            source_doc_id=d.get("source_doc_id"),
            source_doc_name=d.get("source_doc_name"),
            growth_percent=d.get("growth_percent"),
            friction_score=d.get("friction_score"),
            recurring_intensity=d.get("recurring_intensity"),
            organization_id=d.get("organization_id"),
            created_by_user_id=d.get("created_by_user_id"),
            created_by_user_name=d.get("created_by_user_name"),
            approved_by_user_id=d.get("approved_by_user_id"),
            approved_by_user_name=d.get("approved_by_user_name"),
            approved_at=d.get("approved_at"),
            created_at=d.get("created_at") or datetime.utcnow(),
            updated_at=d.get("updated_at") or datetime.utcnow(),
        ))
    return AtlasQnAListResponse(items=items, total=total, page=page, limit=limit)


@router.post("/qna", response_model=AtlasQnARecord)
async def create_atlas_qna(
    payload: AtlasQnACreate,
    current_user: UserResponse = Depends(get_current_active_user),
):
    """Create a new Q&A record (organization-scoped)."""
    db = get_database()
    coll = db.atlas_qna
    user_id = str(current_user.id)
    org_id = str(current_user.company_id) if current_user.company_id else user_id
    now = datetime.utcnow()
    doc = {
        "organization_id": org_id,
        "created_by_user_id": user_id,
        "created_by_user_name": f"{current_user.first_name} {current_user.last_name}".strip() or current_user.email,
        "question": (payload.question or "").strip(),
        "answer": (payload.answer or "").strip(),
        "classification": payload.classification or "general",
        "topic": (payload.topic or "").strip() or None,
        "product_tag": (payload.product_tag or "").strip() or None,
        "service_tag": (payload.service_tag or "").strip() or None,
        "status": payload.status or "draft",
        "origin": payload.origin or "manual",
        "is_grounded": payload.is_grounded or False,
        "source_call_id": payload.source_call_id or None,
        "source_meeting_id": payload.source_meeting_id or None,
        "source_doc_id": payload.source_doc_id or None,
        "source_doc_name": payload.source_doc_name or None,
        "usage_count": 0,
        "last_used_at": None,
        "growth_percent": None,
        "friction_score": None,
        "recurring_intensity": None,
        "approved_by_user_id": None,
        "approved_by_user_name": None,
        "approved_at": None,
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
        classification=doc.get("classification", "general"),
        topic=doc.get("topic"),
        product_tag=doc.get("product_tag"),
        service_tag=doc.get("service_tag"),
        usage_count=doc.get("usage_count", 0),
        last_used_at=doc.get("last_used_at"),
        status=doc.get("status", "draft"),
        origin=doc.get("origin", "manual"),
        is_grounded=doc.get("is_grounded", False),
        grounding_confidence=doc.get("grounding_confidence"),
        ai_confidence=doc.get("ai_confidence"),
        source_call_id=doc.get("source_call_id"),
        source_meeting_id=doc.get("source_meeting_id"),
        source_meeting_title=doc.get("source_meeting_title"),
        source_doc_id=doc.get("source_doc_id"),
        source_doc_name=doc.get("source_doc_name"),
        growth_percent=doc.get("growth_percent"),
        friction_score=doc.get("friction_score"),
        recurring_intensity=doc.get("recurring_intensity"),
        organization_id=doc.get("organization_id"),
        created_by_user_id=doc.get("created_by_user_id"),
        created_by_user_name=doc.get("created_by_user_name"),
        approved_by_user_id=doc.get("approved_by_user_id"),
        approved_by_user_name=doc.get("approved_by_user_name"),
        approved_at=doc.get("approved_at"),
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
    )


@router.get("/qna/stats", response_model=dict)
async def get_atlas_qna_stats(
    current_user: UserResponse = Depends(get_current_active_user),
):
    """Get Q&A statistics for the organization."""
    db = get_database()
    coll = db.atlas_qna
    user_id = str(current_user.id)
    company_id = str(current_user.company_id) if current_user.company_id else None
    
    # Match Q&A for this user OR their company
    if company_id:
        match_filter = {"$or": [{"organization_id": user_id}, {"organization_id": company_id}]}
    else:
        match_filter = {"organization_id": user_id}
    
    pipeline = [
        {"$match": match_filter},
        {"$facet": {
            "total": [{"$count": "count"}],
            "approved": [{"$match": {"status": "approved"}}, {"$count": "count"}],
            "draft": [{"$match": {"status": "draft"}}, {"$count": "count"}],
            "usage_sum": [{"$group": {"_id": None, "total": {"$sum": "$usage_count"}}}],
            "top_questions": [
                {"$sort": {"usage_count": -1}},
                {"$limit": 5},
                {"$project": {"_id": 0, "id": {"$toString": "$_id"}, "question": 1, "usage_count": 1, "growth_percent": 1}}
            ],
            "trending": [
                {"$match": {"growth_percent": {"$gt": 0}}},
                {"$sort": {"growth_percent": -1}},
                {"$limit": 5},
                {"$project": {"_id": 0, "id": {"$toString": "$_id"}, "question": 1, "usage_count": 1, "growth_percent": 1}}
            ],
            "by_classification": [
                {"$group": {"_id": "$classification", "count": {"$sum": 1}}}
            ],
            "friction_by_class": [
                {"$match": {"friction_score": {"$exists": True, "$ne": None}}},
                {"$group": {"_id": "$classification", "avg_friction": {"$avg": "$friction_score"}, "count": {"$sum": 1}}}
            ]
        }}
    ]
    
    result = await coll.aggregate(pipeline).to_list(length=1)
    data = result[0] if result else {}
    
    # Safe extraction with empty list handling
    def safe_get_count(arr, key="count"):
        return arr[0].get(key, 0) if arr else 0
    
    return {
        "total_questions": safe_get_count(data.get("total", [])),
        "approved_count": safe_get_count(data.get("approved", [])),
        "draft_count": safe_get_count(data.get("draft", [])),
        "total_usage": safe_get_count(data.get("usage_sum", []), "total"),
        "top_questions": data.get("top_questions", []),
        "trending_questions": data.get("trending", []),
        "classification_breakdown": {
            item.get("_id", "general"): item.get("count", 0)
            for item in data.get("by_classification", [])
        },
        "friction_breakdown": [
            {"classification": item.get("_id", "general"), "avg_friction": item.get("avg_friction", 0), "count": item.get("count", 0)}
            for item in data.get("friction_by_class", [])
        ],
        "recent_trend": [],
    }


@router.get("/qna/{qna_id}", response_model=AtlasQnARecord)
async def get_atlas_qna(
    qna_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
):
    """Get a single Q&A record by id."""
    db = get_database()
    coll = db.atlas_qna
    user_id = str(current_user.id)
    company_id = str(current_user.company_id) if current_user.company_id else None
    try:
        oid = ObjectId(qna_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Q&A id")
    
    # Query with user_id OR company_id
    if company_id:
        filter_query = {"_id": oid, "$or": [{"organization_id": user_id}, {"organization_id": company_id}]}
    else:
        filter_query = {"_id": oid, "organization_id": user_id}
    
    doc = await coll.find_one(filter_query)
    if not doc:
        raise HTTPException(status_code=404, detail="Q&A not found")
    return AtlasQnARecord(
        id=str(doc["_id"]),
        question=doc.get("question", ""),
        answer=doc.get("answer", ""),
        classification=doc.get("classification", "general"),
        topic=doc.get("topic"),
        product_tag=doc.get("product_tag"),
        service_tag=doc.get("service_tag"),
        usage_count=int(doc.get("usage_count") or 0),
        last_used_at=doc.get("last_used_at"),
        status=doc.get("status", "draft"),
        origin=doc.get("origin", "manual"),
        is_grounded=doc.get("is_grounded", False),
        grounding_confidence=doc.get("grounding_confidence"),
        ai_confidence=doc.get("ai_confidence"),
        source_call_id=doc.get("source_call_id"),
        source_meeting_id=doc.get("source_meeting_id"),
        source_meeting_title=doc.get("source_meeting_title"),
        source_doc_id=doc.get("source_doc_id"),
        source_doc_name=doc.get("source_doc_name"),
        growth_percent=doc.get("growth_percent"),
        friction_score=doc.get("friction_score"),
        recurring_intensity=doc.get("recurring_intensity"),
        organization_id=doc.get("organization_id"),
        created_by_user_id=doc.get("created_by_user_id"),
        created_by_user_name=doc.get("created_by_user_name"),
        approved_by_user_id=doc.get("approved_by_user_id"),
        approved_by_user_name=doc.get("approved_by_user_name"),
        approved_at=doc.get("approved_at"),
        created_at=doc.get("created_at") or datetime.utcnow(),
        updated_at=doc.get("updated_at") or datetime.utcnow(),
    )


@router.put("/qna/{qna_id}", response_model=AtlasQnARecord)
async def update_atlas_qna(
    qna_id: str,
    payload: AtlasQnAUpdate,
    current_user: UserResponse = Depends(get_current_active_user),
):
    """Update a Q&A record (owner only)."""
    db = get_database()
    coll = db.atlas_qna
    user_id = str(current_user.id)
    company_id = str(current_user.company_id) if current_user.company_id else None
    is_owner = current_user.workspace_role == "owner" or current_user.role == "company_admin"
    if not is_owner:
        raise HTTPException(status_code=403, detail="Only owner can edit Q&A")
    try:
        oid = ObjectId(qna_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Q&A id")
    
    # Query with user_id OR company_id
    if company_id:
        filter_query = {"_id": oid, "$or": [{"organization_id": user_id}, {"organization_id": company_id}]}
    else:
        filter_query = {"_id": oid, "organization_id": user_id}
    
    doc = await coll.find_one(filter_query)
    if not doc:
        raise HTTPException(status_code=404, detail="Q&A not found")
    update_data: Any = {"updated_at": datetime.utcnow()}
    if payload.question is not None:
        update_data["question"] = (payload.question or "").strip()
    if payload.answer is not None:
        update_data["answer"] = (payload.answer or "").strip()
    if payload.classification is not None:
        update_data["classification"] = payload.classification
    if payload.topic is not None:
        update_data["topic"] = (payload.topic or "").strip() or None
    if payload.product_tag is not None:
        update_data["product_tag"] = (payload.product_tag or "").strip() or None
    if payload.service_tag is not None:
        update_data["service_tag"] = (payload.service_tag or "").strip() or None
    if payload.status is not None:
        update_data["status"] = payload.status
    if payload.is_grounded is not None:
        update_data["is_grounded"] = payload.is_grounded
    if payload.grounding_confidence is not None:
        update_data["grounding_confidence"] = payload.grounding_confidence
    await coll.update_one({"_id": oid}, {"$set": update_data})
    updated = await coll.find_one({"_id": oid})
    return AtlasQnARecord(
        id=str(updated["_id"]),
        question=updated.get("question", ""),
        answer=updated.get("answer", ""),
        classification=updated.get("classification", "general"),
        topic=updated.get("topic"),
        product_tag=updated.get("product_tag"),
        service_tag=updated.get("service_tag"),
        usage_count=int(updated.get("usage_count") or 0),
        last_used_at=updated.get("last_used_at"),
        status=updated.get("status", "draft"),
        origin=updated.get("origin", "manual"),
        is_grounded=updated.get("is_grounded", False),
        grounding_confidence=updated.get("grounding_confidence"),
        ai_confidence=updated.get("ai_confidence"),
        source_call_id=updated.get("source_call_id"),
        source_meeting_id=updated.get("source_meeting_id"),
        source_meeting_title=updated.get("source_meeting_title"),
        source_doc_id=updated.get("source_doc_id"),
        source_doc_name=updated.get("source_doc_name"),
        growth_percent=updated.get("growth_percent"),
        friction_score=updated.get("friction_score"),
        recurring_intensity=updated.get("recurring_intensity"),
        organization_id=updated.get("organization_id"),
        created_by_user_id=updated.get("created_by_user_id"),
        created_by_user_name=updated.get("created_by_user_name"),
        approved_by_user_id=updated.get("approved_by_user_id"),
        approved_by_user_name=updated.get("approved_by_user_name"),
        approved_at=updated.get("approved_at"),
        created_at=updated.get("created_at") or datetime.utcnow(),
        updated_at=updated.get("updated_at") or datetime.utcnow(),
    )


@router.post("/qna/{qna_id}/approve", response_model=AtlasQnARecord)
async def approve_atlas_qna(
    qna_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
):
    """Approve a Q&A record (owner only)."""
    db = get_database()
    coll = db.atlas_qna
    user_id = str(current_user.id)
    company_id = str(current_user.company_id) if current_user.company_id else None
    is_owner = current_user.workspace_role == "owner" or current_user.role == "company_admin"
    if not is_owner:
        raise HTTPException(status_code=403, detail="Only owner can approve Q&A")
    try:
        oid = ObjectId(qna_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Q&A id")
    
    # Query with user_id OR company_id
    if company_id:
        filter_query = {"_id": oid, "$or": [{"organization_id": user_id}, {"organization_id": company_id}]}
    else:
        filter_query = {"_id": oid, "organization_id": user_id}
    
    doc = await coll.find_one(filter_query)
    if not doc:
        raise HTTPException(status_code=404, detail="Q&A not found")
    now = datetime.utcnow()
    await coll.update_one({"_id": oid}, {"$set": {
        "status": "approved",
        "approved_by_user_id": str(current_user.id),
        "approved_by_user_name": f"{current_user.first_name} {current_user.last_name}".strip() or current_user.email,
        "approved_at": now,
        "updated_at": now,
    }})
    updated = await coll.find_one({"_id": oid})
    return AtlasQnARecord(
        id=str(updated["_id"]),
        question=updated.get("question", ""),
        answer=updated.get("answer", ""),
        classification=updated.get("classification", "general"),
        topic=updated.get("topic"),
        product_tag=updated.get("product_tag"),
        service_tag=updated.get("service_tag"),
        usage_count=int(updated.get("usage_count") or 0),
        last_used_at=updated.get("last_used_at"),
        status=updated.get("status", "approved"),
        origin=updated.get("origin", "manual"),
        is_grounded=updated.get("is_grounded", False),
        grounding_confidence=updated.get("grounding_confidence"),
        ai_confidence=updated.get("ai_confidence"),
        source_call_id=updated.get("source_call_id"),
        source_meeting_id=updated.get("source_meeting_id"),
        source_meeting_title=updated.get("source_meeting_title"),
        source_doc_id=updated.get("source_doc_id"),
        source_doc_name=updated.get("source_doc_name"),
        growth_percent=updated.get("growth_percent"),
        friction_score=updated.get("friction_score"),
        recurring_intensity=updated.get("recurring_intensity"),
        organization_id=updated.get("organization_id"),
        created_by_user_id=updated.get("created_by_user_id"),
        created_by_user_name=updated.get("created_by_user_name"),
        approved_by_user_id=updated.get("approved_by_user_id"),
        approved_by_user_name=updated.get("approved_by_user_name"),
        approved_at=updated.get("approved_at"),
        created_at=updated.get("created_at") or datetime.utcnow(),
        updated_at=updated.get("updated_at") or datetime.utcnow(),
    )


@router.delete("/qna/{qna_id}")
async def delete_atlas_qna(
    qna_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
):
    """Delete a Q&A record (owner only)."""
    db = get_database()
    coll = db.atlas_qna
    user_id = str(current_user.id)
    company_id = str(current_user.company_id) if current_user.company_id else None
    is_owner = current_user.workspace_role == "owner" or current_user.role == "company_admin"
    if not is_owner:
        raise HTTPException(status_code=403, detail="Only owner can delete Q&A")
    try:
        oid = ObjectId(qna_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Q&A id")
    
    # Query with user_id OR company_id
    if company_id:
        filter_query = {"_id": oid, "$or": [{"organization_id": user_id}, {"organization_id": company_id}]}
    else:
        filter_query = {"_id": oid, "organization_id": user_id}
    
    result = await coll.delete_one(filter_query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Q&A not found")
    return {"ok": True, "message": "Q&A deleted"}


# ----- Q&A Engine: Extract Q&A from transcripts -----

class QnAExtractRequest(BaseModel):
    """Request to extract Q&A from a meeting/call transcript."""
    meeting_id: Optional[str] = None
    transcript: Optional[str] = None  # Direct transcript text


class QnAExtractResponse(BaseModel):
    """Response from Q&A extraction."""
    success: bool
    message: str
    extracted_count: int
    qna_ids: List[str] = Field(default_factory=list)


@router.post("/qna/extract", response_model=QnAExtractResponse)
async def extract_qna_from_source(
    payload: QnAExtractRequest,
    background_tasks: BackgroundTasks,
    current_user: UserResponse = Depends(get_current_active_user),
):
    """
    Extract Q&A from a meeting transcript or direct text.
    
    Flow:
    1. Get transcript (from meeting_id or direct text)
    2. AI extracts questions/objections
    3. Knowledge module grounds answers
    4. If no knowledge, AI generates fallback answer
    5. Store as draft Q&A (pending review)
    """
    from app.services.qna_engine import process_transcript_to_qna, extract_qna_from_meeting
    
    user_id = str(current_user.id)
    user_name = f"{current_user.first_name} {current_user.last_name}".strip() or current_user.email
    org_id = str(current_user.company_id) if current_user.company_id else user_id
    
    if payload.meeting_id:
        # Extract from meeting
        created_qnas = await extract_qna_from_meeting(
            meeting_id=payload.meeting_id,
            user_id=user_id,
            user_name=user_name,
        )
    elif payload.transcript:
        # Extract from direct text
        created_qnas = await process_transcript_to_qna(
            transcript=payload.transcript,
            organization_id=org_id,
            user_id=user_id,
            user_name=user_name,
        )
    else:
        raise HTTPException(status_code=400, detail="Either meeting_id or transcript required")
    
    qna_ids = [str(q.get("_id") or q.get("id")) for q in created_qnas if q]
    
    return QnAExtractResponse(
        success=True,
        message=f"Extracted {len(created_qnas)} Q&A from transcript",
        extracted_count=len(created_qnas),
        qna_ids=qna_ids,
    )


@router.post("/qna/{qna_id}/increment-usage", response_model=AtlasQnARecord)
async def increment_qna_usage(
    qna_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
):
    """Increment usage count for a Q&A (called when answer is used in Action Ready)."""
    db = get_database()
    coll = db.atlas_qna
    user_id = str(current_user.id)
    company_id = str(current_user.company_id) if current_user.company_id else None
    
    try:
        oid = ObjectId(qna_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Q&A id")
    
    # Query with user_id OR company_id
    if company_id:
        filter_query = {"_id": oid, "$or": [{"organization_id": user_id}, {"organization_id": company_id}]}
    else:
        filter_query = {"_id": oid, "organization_id": user_id}
    
    now = datetime.utcnow()
    result = await coll.update_one(
        filter_query,
        {"$inc": {"usage_count": 1}, "$set": {"last_used_at": now, "updated_at": now}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Q&A not found")
    
    doc = await coll.find_one({"_id": oid})
    return AtlasQnARecord(
        id=str(doc["_id"]),
        question=doc.get("question", ""),
        answer=doc.get("answer", ""),
        classification=doc.get("classification", "general"),
        topic=doc.get("topic"),
        product_tag=doc.get("product_tag"),
        service_tag=doc.get("service_tag"),
        usage_count=int(doc.get("usage_count") or 0),
        last_used_at=doc.get("last_used_at"),
        status=doc.get("status", "draft"),
        origin=doc.get("origin", "manual"),
        is_grounded=doc.get("is_grounded", False),
        grounding_confidence=doc.get("grounding_confidence"),
        ai_confidence=doc.get("ai_confidence"),
        source_call_id=doc.get("source_call_id"),
        source_meeting_id=doc.get("source_meeting_id"),
        source_meeting_title=doc.get("source_meeting_title"),
        source_doc_id=doc.get("source_doc_id"),
        source_doc_name=doc.get("source_doc_name"),
        growth_percent=doc.get("growth_percent"),
        friction_score=doc.get("friction_score"),
        recurring_intensity=doc.get("recurring_intensity"),
        organization_id=doc.get("organization_id"),
        created_by_user_id=doc.get("created_by_user_id"),
        created_by_user_name=doc.get("created_by_user_name"),
        approved_by_user_id=doc.get("approved_by_user_id"),
        approved_by_user_name=doc.get("approved_by_user_name"),
        approved_at=doc.get("approved_at"),
        created_at=doc.get("created_at") or datetime.utcnow(),
        updated_at=doc.get("updated_at") or datetime.utcnow(),
    )


@router.post("/qna/search-similar")
async def search_similar_qna(
    payload: dict,
    current_user: UserResponse = Depends(get_current_active_user),
):
    """
    Search for similar approved Q&A to answer a new question (for Action Ready).
    Returns top matches with similarity scores.
    """
    from app.services.qna_engine import search_knowledge_for_answer
    
    question = payload.get("question", "")
    if not question:
        raise HTTPException(status_code=400, detail="Question required")
    
    user_id = str(current_user.id)
    company_id = str(current_user.company_id) if current_user.company_id else None
    db = get_database()
    coll = db.atlas_qna
    
    # Build organization filter
    if company_id:
        org_filter = {"$or": [{"organization_id": user_id}, {"organization_id": company_id}]}
    else:
        org_filter = {"organization_id": user_id}
    
    # Simple text search for now (can enhance with vector similarity later)
    cursor = coll.find({
        **org_filter,
        "status": "approved",
        "$or": [
            {"question": {"$regex": question[:50], "$options": "i"}},
            {"answer": {"$regex": question[:50], "$options": "i"}},
        ]
    }).limit(5)
    
    matches = []
    async for doc in cursor:
        matches.append({
            "id": str(doc["_id"]),
            "question": doc.get("question", ""),
            "answer": doc.get("answer", ""),
            "classification": doc.get("classification", "general"),
            "is_grounded": doc.get("is_grounded", False),
            "usage_count": doc.get("usage_count", 0),
            "similarity": 0.8,  # Placeholder - can compute actual similarity
        })
    
    return {"matches": matches}


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


# ============================================================
# MEETING AUTO-ENRICH: Extract company info from attendee email
# ============================================================

# Legacy API URL (deprecated, now using Tavily - previously SerpAPI)
# COMPANY_SEARCH_API_URL = os.getenv("COMPANY_SEARCH_API_URL", "http://207.180.227.97:5001/search")

# Common email domains to skip (personal emails)
PERSONAL_EMAIL_DOMAINS = {
    "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "hotmail.com", 
    "outlook.com", "live.com", "msn.com", "icloud.com", "me.com", "mac.com",
    "aol.com", "protonmail.com", "zoho.com", "mail.com", "yandex.com",
    "gmx.com", "gmx.de", "web.de", "qq.com", "163.com", "126.com",
}


class CompanySearchRequest(BaseModel):
    company_name: str


class CompanySearchResponse(BaseModel):
    company: str
    result: str
    success: bool = True
    error: Optional[str] = None


class MeetingEnrichRequest(BaseModel):
    event_id: str
    force_refresh: bool = False


class MeetingEnrichResponse(BaseModel):
    event_id: str
    enriched: bool
    attendee_email: Optional[str] = None
    company_name: Optional[str] = None
    company_info: Optional[dict] = None
    main_contact: Optional[dict] = None
    error: Optional[str] = None
    already_enriched: bool = False


def extract_company_from_email(email: str) -> Optional[str]:
    """Extract company name from email domain, skipping personal emails."""
    if not email or "@" not in email:
        return None
    
    domain = email.split("@")[-1].lower().strip()
    
    # Skip personal email domains
    if domain in PERSONAL_EMAIL_DOMAINS:
        return None
    
    # Extract company name from domain (e.g., forskale.com -> forskale)
    company_part = domain.split(".")[0]
    
    # Skip if too short or looks like a subdomain
    if len(company_part) < 2:
        return None
    
    return company_part


@router.post("/company-search", response_model=CompanySearchResponse)
async def search_company_info(
    request: CompanySearchRequest,
    current_user: UserResponse = Depends(get_current_active_user),
):
    """
    Search company information using Tavily API.
    Replaced SerpAPI with Tavily for faster and cheaper search.
    """
    company_name = request.company_name.strip()
    if not company_name:
        raise HTTPException(status_code=400, detail="Company name is required")
    
    logger.info(f"[COMPANY-SEARCH] Searching for company: {company_name}")
    
    try:
        # Use Company Data Pool (caches Tavily results in MongoDB)
        pool = get_company_data_pool()
        data = await pool.get_company_info(company_name)
        
        logger.info(f"[COMPANY-SEARCH] Found info for {company_name}: {len(data.get('result', ''))} chars")
        
        return CompanySearchResponse(
            company=data.get("company", company_name),
            result=data.get("result", ""),
            success=True,
        )
            
    except Exception as e:
        logger.error(f"[COMPANY-SEARCH] Error: {str(e)}")
        return CompanySearchResponse(
            company=company_name,
            result="",
            success=False,
            error=str(e),
        )


async def generate_meeting_preparation_with_ai(
    company_name: str,
    contact_name: str,
    deal_stage: str,
    past_events: List[PastEventItem],
    last_interaction: Optional[LastInteractionSnapshot],
    company_info: Optional[dict] = None,
) -> dict:
    """Use AI to generate meeting preparation: key_points, risks_or_questions, suggested_angle."""
    from app.core.config import settings

    if not settings.GROQ_API_KEY:
        logger.warning("[AI-MEETING-PREP] Missing GROQ_API_KEY")
        return {}

    past_events_text = ""
    if past_events:
        for e in past_events[:10]:
            past_events_text += f"- {e.date} ({e.type}): {e.subject or e.content or 'No details'}\n"

    last_interaction_text = ""
    if last_interaction:
        if last_interaction.summary:
            last_interaction_text += f"Summary: {last_interaction.summary}\n"
        if last_interaction.agreed_next_step:
            last_interaction_text += f"Agreed next step: {last_interaction.agreed_next_step}\n"
        if last_interaction.open_points:
            last_interaction_text += f"Open points: {last_interaction.open_points}\n"

    company_info_text = ""
    if company_info:
        if company_info.get("description"):
            company_info_text += f"Description: {company_info['description']}\n"
        if company_info.get("industry"):
            company_info_text += f"Industry: {company_info['industry']}\n"
        if company_info.get("size_revenue"):
            company_info_text += f"Size/Revenue: {company_info['size_revenue']}\n"

    prompt = f"""You are a sales meeting preparation assistant. Analyze the following information about an upcoming meeting and provide preparation insights.

Company: {company_name or 'Unknown'}
Contact: {contact_name or 'Unknown'}
Deal Stage: {deal_stage or 'Unknown'}

Company Information:
{company_info_text or 'No company info available'}

Past Interactions:
{past_events_text or 'No past interactions'}

Last Interaction:
{last_interaction_text or 'No previous meeting data'}

Based on this context, provide a JSON response with:
1. key_points: array of 2-4 key talking points or preparation items for this meeting
2. risks_or_questions: array of 1-3 potential risks, objections, or open questions to address
3. suggested_angle: a single sentence suggesting the best approach/angle for this meeting

Return ONLY valid JSON:
{{"key_points": [...], "risks_or_questions": [...], "suggested_angle": "..."}}"""

    try:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [
                {"role": "system", "content": "You are a helpful sales preparation assistant. Return ONLY valid JSON. No markdown. No extra text."},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.4,
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()

        content = (((data or {}).get("choices") or [{}])[0].get("message") or {}).get("content") or ""
        content = content.strip()

        if content.startswith("```"):
            lines = content.split("\n")
            content = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])
        content = content.strip()

        import json
        try:
            result = json.loads(content)
            return {
                "key_points": result.get("key_points", []),
                "risks_or_questions": result.get("risks_or_questions", []),
                "suggested_angle": result.get("suggested_angle", ""),
            }
        except Exception:
            start = content.find("{")
            end = content.rfind("}")
            if start != -1 and end != -1 and end > start:
                result = json.loads(content[start:end + 1])
                return {
                    "key_points": result.get("key_points", []),
                    "risks_or_questions": result.get("risks_or_questions", []),
                    "suggested_angle": result.get("suggested_angle", ""),
                }
            raise

    except Exception as e:
        logger.error(f"[AI-MEETING-PREP] Error generating meeting preparation: {e}")
        return {}


async def extract_company_info_with_ai(company_name: str, search_result: str) -> dict:
    """Use Groq/Llama to extract structured company info from search result text."""
    from app.core.config import settings
    
    if not search_result:
        return {}
    
    if not settings.GROQ_API_KEY:
        logger.warning("[AI-EXTRACT] Missing GROQ_API_KEY")
        return {"description": search_result[:500]}
    
    prompt = f"""Extract company information from the following text about "{company_name}".
Return a JSON object with these fields (leave empty string if not found):
- industry: string (main industry/sector)
- size_revenue: string (employee count, revenue if mentioned)
- location: string (headquarters location)
- founded: string (year founded)
- website: string (company website)
- description: string (2-3 sentence company description)
- ceo_name: string (CEO or founder name if mentioned)
- key_people: array of strings (names and titles of key people)

Text:
{search_result}

Return ONLY valid JSON, no markdown or explanation."""

    try:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [
                {"role": "system", "content": "Return ONLY valid JSON. No markdown. No extra text."},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.2,
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
        
        content = (((data or {}).get("choices") or [{}])[0].get("message") or {}).get("content") or ""
        content = content.strip()
        
        # Clean up potential markdown
        if content.startswith("```"):
            lines = content.split("\n")
            content = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])
        content = content.strip()
        
        # Parse JSON
        import json
        try:
            return json.loads(content)
        except Exception:
            # Try extracting first {...} block
            start = content.find("{")
            end = content.rfind("}")
            if start != -1 and end != -1 and end > start:
                return json.loads(content[start:end + 1])
            raise
        
    except Exception as e:
        logger.error(f"[AI-EXTRACT] Error extracting company info: {e}")
        return {"description": search_result[:500]}


@router.post("/meeting-enrich", response_model=MeetingEnrichResponse)
async def enrich_meeting_from_attendee(
    request: MeetingEnrichRequest,
    current_user: UserResponse = Depends(get_current_active_user),
):
    """
    Auto-enrich meeting info from attendee email:
    1. Get first external attendee email from calendar_events_cache
    2. Check if already enriched (skip unless force_refresh)
    3. Extract company name from email domain
    4. Search company info via external API
    5. Use AI to extract structured info
    6. Save to calendar_event_participants collection
    """
    db = get_database()
    user_id = str(current_user.id)
    event_id = request.event_id
    
    logger.info(f"[MEETING-ENRICH] Enriching event {event_id} for user {user_id}, force={request.force_refresh}")
    
    # Check if already enriched
    existing = await db[PARTICIPANTS_COLLECTION].find_one({
        "user_id": user_id,
        "event_id": event_id,
    })
    
    if existing and existing.get("auto_enriched") and not request.force_refresh:
        logger.info(f"[MEETING-ENRICH] Event {event_id} already enriched, skipping")
        return MeetingEnrichResponse(
            event_id=event_id,
            enriched=False,
            already_enriched=True,
            company_info=existing.get("company_info"),
            main_contact=existing.get("main_contact"),
        )
    
    # Get event from cache to find attendees
    event_cache = await db[CALENDAR_EVENTS_CACHE].find_one({
        "user_id": user_id,
        "event_id": event_id,
    })
    
    if not event_cache:
        return MeetingEnrichResponse(
            event_id=event_id,
            enriched=False,
            error="Event not found in cache. Please refresh calendar first.",
        )
    
    attendees = event_cache.get("attendees") or []
    if not attendees:
        return MeetingEnrichResponse(
            event_id=event_id,
            enriched=False,
            error="No attendees found for this event.",
        )
    
    # Find first external attendee with business email
    attendee_email = None
    attendee_name = None
    for att in attendees:
        email = (att.get("email") or "").lower().strip()
        if not email:
            continue
        
        company_name = extract_company_from_email(email)
        if company_name:
            attendee_email = email
            attendee_name = att.get("displayName") or email.split("@")[0]
            break
    
    if not attendee_email:
        return MeetingEnrichResponse(
            event_id=event_id,
            enriched=False,
            error="No business email found among attendees (only personal emails like Gmail).",
        )
    
    company_name = extract_company_from_email(attendee_email)
    logger.info(f"[MEETING-ENRICH] Found attendee {attendee_email}, company: {company_name}")
    
    # Search company info using Company Data Pool (caches Tavily results)
    search_result = ""
    try:
        pool = get_company_data_pool()
        search_data = await pool.get_company_info(company_name)
        search_result = search_data.get("result", "")
    except Exception as e:
        logger.error(f"[MEETING-ENRICH] Company search error: {e}")
        search_result = ""
    
    # Search LinkedIn URL for attendee via Company Data Pool (caches Tavily results)
    linkedin_url = None
    try:
        pool = get_company_data_pool()
        linkedin_url = await pool.get_linkedin_url(attendee_email)
        if linkedin_url:
            logger.info(f"[MEETING-ENRICH] Found LinkedIn URL for {attendee_email}: {linkedin_url}")
    except Exception as e:
        logger.error(f"[MEETING-ENRICH] LinkedIn search error: {e}")
    
    # Extract structured info with AI
    company_info = {}
    if search_result:
        company_info = await extract_company_info_with_ai(company_name, search_result)
    
    # Build main contact from attendee
    main_contact = {
        "name": attendee_name,
        "email": attendee_email,
    }
    if linkedin_url:
        main_contact["linkedin_url"] = linkedin_url
    
    # Add key people info if available
    if company_info.get("key_people"):
        for person in company_info["key_people"]:
            if attendee_name and attendee_name.lower() in person.lower():
                # Extract job title from key_people entry
                main_contact["job_title"] = person.replace(attendee_name, "").strip(" -–,")
                break
    
    # Save to database
    now = datetime.utcnow()
    update_doc = {
        "user_id": user_id,
        "event_id": event_id,
        "event_title": event_cache.get("event_title"),
        "event_start": event_cache.get("event_start"),
        "company_info": company_info,
        "main_contact": main_contact,
        "auto_enriched": True,
        "enriched_at": now,
        "enriched_from_email": attendee_email,
        "updated_at": now,
    }
    
    await db[PARTICIPANTS_COLLECTION].update_one(
        {"user_id": user_id, "event_id": event_id},
        {"$set": update_doc},
        upsert=True,
    )
    
    logger.info(f"[MEETING-ENRICH] Successfully enriched event {event_id}")
    
    return MeetingEnrichResponse(
        event_id=event_id,
        enriched=True,
        attendee_email=attendee_email,
        company_name=company_name,
        company_info=company_info,
        main_contact=main_contact,
    )


# ---------------------------------------------------------------------------
# Participant LinkedIn enrichment  (Apify scrape → AI prospect intelligence)
# ---------------------------------------------------------------------------

ENRICHED_PROFILES_COLLECTION = "enriched_linkedin_profiles"
# Shared cache of raw LinkedIn profiles (by linkedin_url, not user-specific)
# Avoids re-scraping the same LinkedIn profile via Apify for different users
LINKEDIN_PROFILES_CACHE = "linkedin_profiles_cache"


class ParticipantEnrichRequest(BaseModel):
    event_id: str
    email: str
    name: Optional[str] = None
    linkedin_url: Optional[str] = None  # if user provided manually
    force: bool = False  # skip "already enriched" cache and re-enrich


class ParticipantEnrichResponse(BaseModel):
    email: str
    enriched: bool
    linkedin_url: Optional[str] = None
    profile_data: Optional[dict] = None
    error: Optional[str] = None
    already_enriched: bool = False


@router.post("/participant-enrich", response_model=ParticipantEnrichResponse)
async def enrich_participant_linkedin(
    request: ParticipantEnrichRequest,
    current_user: UserResponse = Depends(get_current_active_user),
):
    """
    Enrich a single participant via LinkedIn:
    1. If linkedin_url not provided, search it via Tavily ("linkedin {email}")
    2. If found (or provided), scrape profile via Apify
    3. Generate prospect intelligence with AI
    4. Save to enriched_linkedin_profiles collection
    """
    db = get_database()
    user_id = str(current_user.id)
    email = request.email.strip().lower()

    logger.info(f"[PARTICIPANT-ENRICH] Enriching {email} for event {request.event_id}")

    # Check if already enriched (skip when force=True)
    existing = await db[ENRICHED_PROFILES_COLLECTION].find_one({
        "user_id": user_id,
        "email": email,
    })
    if existing and existing.get("profile_data") and not request.force:
        logger.info(f"[PARTICIPANT-ENRICH] Already enriched: {email}")
        return ParticipantEnrichResponse(
            email=email,
            enriched=True,
            already_enriched=True,
            linkedin_url=existing.get("linkedin_url"),
            profile_data=existing.get("profile_data"),
        )

    if request.force:
        logger.info(f"[PARTICIPANT-ENRICH] Force re-enrich requested for {email}")

    # Step 1: Get LinkedIn URL
    # For force re-enrich, prefer the existing stored linkedin_url if no new one provided
    linkedin_url = request.linkedin_url
    if not linkedin_url and request.force and existing and existing.get("linkedin_url"):
        linkedin_url = existing["linkedin_url"]
        logger.info(f"[PARTICIPANT-ENRICH] Step 1: Using stored linkedin_url for re-enrich = {linkedin_url}")
    else:
        logger.info(f"[PARTICIPANT-ENRICH] Step 1: linkedin_url from request = {linkedin_url}")
    if not linkedin_url:
        try:
            # Use Company Data Pool (caches Tavily LinkedIn results)
            pool = get_company_data_pool()
            logger.info(f"[PARTICIPANT-ENRICH] Step 1: Searching LinkedIn URL via Data Pool for {email}")
            linkedin_url = await pool.get_linkedin_url(email)
            logger.info(f"[PARTICIPANT-ENRICH] Step 1: Data Pool result = {linkedin_url}")
        except Exception as e:
            logger.error(f"[PARTICIPANT-ENRICH] Step 1: LinkedIn URL search failed: {e}", exc_info=True)

    if not linkedin_url:
        logger.warning(f"[PARTICIPANT-ENRICH] Step 1: No LinkedIn URL found for {email}, returning no_linkedin_url")
        return ParticipantEnrichResponse(
            email=email,
            enriched=False,
            error="no_linkedin_url",
        )

    # Step 2: Scrape LinkedIn profile via Apify
    li_service = get_linkedin_enrichment_service()

    # Normalize linkedin_url for cache lookup
    cache_key_url = linkedin_url.strip().rstrip("/").lower()

    raw_profile = None

    if request.force:
        # Force re-enrich: clear shared cache and always call Apify fresh
        await db[LINKEDIN_PROFILES_CACHE].delete_one({"linkedin_url": cache_key_url})
        logger.info(f"[PARTICIPANT-ENRICH] Step 2: Force mode — cleared shared cache for {cache_key_url}, calling Apify fresh...")
    else:
        # Check shared cache first (not user-specific)
        cached_profile = await db[LINKEDIN_PROFILES_CACHE].find_one({"linkedin_url": cache_key_url})
        if cached_profile and cached_profile.get("raw_profile"):
            raw_profile = cached_profile["raw_profile"]
            logger.info(f"[PARTICIPANT-ENRICH] Step 2: ✅ Cache HIT for {linkedin_url} "
                        f"(name={raw_profile.get('fullName', 'unknown')})")

    if not raw_profile:
        logger.info(f"[PARTICIPANT-ENRICH] Step 2: Cache MISS for {linkedin_url}, calling Apify...")
        logger.info(f"[PARTICIPANT-ENRICH] Step 2: Apify configured={li_service.configured}, "
                    f"token={'***' + li_service.api_token[-6:] if li_service.api_token else 'EMPTY'}, "
                    f"actor_id={li_service.actor_id or 'EMPTY'}")
        if not li_service.configured:
            logger.error(f"[PARTICIPANT-ENRICH] Step 2: Apify not configured")
            return ParticipantEnrichResponse(
                email=email,
                enriched=False,
                linkedin_url=linkedin_url,
                error="Apify not configured (APIFY_API_TOKEN / APIFY_ACTOR_ID missing)",
            )

        raw_profile = await li_service.scrape_linkedin_profile(linkedin_url)
        if not raw_profile:
            logger.error(f"[PARTICIPANT-ENRICH] Step 2: Apify returned no profile data for {linkedin_url}")
            return ParticipantEnrichResponse(
                email=email,
                enriched=False,
                linkedin_url=linkedin_url,
                error="Failed to scrape LinkedIn profile. The profile may be private or the URL incorrect.",
            )
        logger.info(f"[PARTICIPANT-ENRICH] Step 2: Apify returned profile for {raw_profile.get('fullName', 'unknown')}, "
                    f"keys={list(raw_profile.keys())[:10]}")

        # Save to shared cache (no user_id, shared across all users)
        try:
            await db[LINKEDIN_PROFILES_CACHE].update_one(
                {"linkedin_url": cache_key_url},
                {
                    "$set": {
                        "linkedin_url": cache_key_url,
                        "original_url": linkedin_url,
                        "raw_profile": raw_profile,
                        "full_name": raw_profile.get("fullName", ""),
                        "scraped_at": datetime.utcnow(),
                    }
                },
                upsert=True,
            )
            logger.info(f"[PARTICIPANT-ENRICH] Step 2: Saved to shared cache: {cache_key_url}")
        except Exception as cache_err:
            logger.warning(f"[PARTICIPANT-ENRICH] Step 2: Failed to save to cache: {cache_err}")

    # Step 3: Extract key fields
    linkedin_data = li_service.extract_key_fields(raw_profile)
    logger.info(f"[PARTICIPANT-ENRICH] Step 3: Extracted fields: name={linkedin_data.get('fullName')}, "
                f"title={linkedin_data.get('jobTitle')}, company={linkedin_data.get('companyName')}, "
                f"skills_count={len(linkedin_data.get('skills', []))}")

    # Step 4: Get existing company info for richer AI context
    company_info = None
    event_doc = await db[PARTICIPANTS_COLLECTION].find_one({
        "user_id": user_id,
        "event_id": request.event_id,
    })
    if event_doc:
        company_info = event_doc.get("company_info")
    logger.info(f"[PARTICIPANT-ENRICH] Step 4: company_info available = {bool(company_info)}")

    # Step 5: Generate AI prospect intelligence
    logger.info(f"[PARTICIPANT-ENRICH] Step 5: Generating AI prospect intelligence...")
    profile_data = await li_service.generate_prospect_intelligence(linkedin_data, company_info)
    logger.info(f"[PARTICIPANT-ENRICH] Step 5: AI result keys={list(profile_data.keys()) if profile_data else 'None'}, "
                f"disc_type={profile_data.get('disc', {}).get('type', 'N/A') if profile_data else 'N/A'}")

    # Step 6: Save to database
    now = datetime.utcnow()
    logger.info(f"[PARTICIPANT-ENRICH] Step 6: Saving to DB collection={ENRICHED_PROFILES_COLLECTION}")
    await db[ENRICHED_PROFILES_COLLECTION].update_one(
        {"user_id": user_id, "email": email},
        {
            "$set": {
                "user_id": user_id,
                "email": email,
                "name": request.name or linkedin_data.get("fullName", ""),
                "event_id": request.event_id,
                "linkedin_url": linkedin_url,
                "linkedin_data": linkedin_data,
                "profile_data": profile_data,
                "enriched_at": now,
                "updated_at": now,
            }
        },
        upsert=True,
    )

    # Also update participant's linkedin_url in the event doc
    if event_doc:
        participants = event_doc.get("participants") or []
        updated = False
        for p in participants:
            if (p.get("email") or "").lower() == email:
                p["linkedin_url"] = linkedin_url
                updated = True
                break
        if updated:
            await db[PARTICIPANTS_COLLECTION].update_one(
                {"user_id": user_id, "event_id": request.event_id},
                {"$set": {"participants": participants, "updated_at": now}},
            )
            logger.info(f"[PARTICIPANT-ENRICH] Step 6: Updated linkedin_url in event participants")

    logger.info(f"[PARTICIPANT-ENRICH] ✅ Successfully enriched {email} | linkedin={linkedin_url}")

    return ParticipantEnrichResponse(
        email=email,
        enriched=True,
        linkedin_url=linkedin_url,
        profile_data=profile_data,
    )


@router.get("/participant-profile")
async def get_participant_profile(
    email: str = Query(..., description="Participant email"),
    current_user: UserResponse = Depends(get_current_active_user),
):
    """Get previously enriched LinkedIn profile for a participant.
    Returns 200 with profile_data=null if not yet enriched (avoids noisy 404s).
    """
    db = get_database()
    user_id = str(current_user.id)
    normalized_email = email.strip().lower()

    logger.info(f"[PARTICIPANT-PROFILE] Lookup: email={normalized_email}, user_id={user_id}, "
                f"collection={ENRICHED_PROFILES_COLLECTION}")

    doc = await db[ENRICHED_PROFILES_COLLECTION].find_one({
        "user_id": user_id,
        "email": normalized_email,
    })

    if not doc or not doc.get("profile_data"):
        logger.info(f"[PARTICIPANT-PROFILE] Not found / no profile_data for {normalized_email} "
                     f"(doc exists={doc is not None})")
        return {
            "email": normalized_email,
            "linkedin_url": None,
            "profile_data": None,
        }

    logger.info(f"[PARTICIPANT-PROFILE] ✅ Found enriched profile for {normalized_email}, "
                f"linkedin_url={doc.get('linkedin_url')}, "
                f"profile keys={list(doc['profile_data'].keys())[:5]}")

    return {
        "email": doc["email"],
        "linkedin_url": doc.get("linkedin_url"),
        "profile_data": doc["profile_data"],
    }


class UpdateParticipantLinkedInRequest(BaseModel):
    email: str
    linkedin_url: str


@router.patch("/participant-linkedin")
async def update_participant_linkedin(
    request: UpdateParticipantLinkedInRequest,
    current_user: UserResponse = Depends(get_current_active_user),
):
    """Update (or set) a participant's LinkedIn URL without triggering full enrichment."""
    db = get_database()
    user_id = str(current_user.id)
    normalized_email = request.email.strip().lower()
    linkedin_url = request.linkedin_url.strip()

    logger.info(f"[PARTICIPANT-LINKEDIN] Update: email={normalized_email}, linkedin_url={linkedin_url}, user_id={user_id}")

    # Upsert in enriched_linkedin_profiles collection
    await db[ENRICHED_PROFILES_COLLECTION].update_one(
        {"user_id": user_id, "email": normalized_email},
        {
            "$set": {
                "linkedin_url": linkedin_url,
                "updated_at": datetime.utcnow().isoformat(),
            },
            "$setOnInsert": {
                "user_id": user_id,
                "email": normalized_email,
                "created_at": datetime.utcnow().isoformat(),
            },
        },
        upsert=True,
    )

    # Also update in any calendar event docs that reference this participant
    await db["calendar_events"].update_many(
        {"user_id": user_id, "participants.email": {"$regex": f"^{normalized_email}$", "$options": "i"}},
        {"$set": {"participants.$.linkedin_url": linkedin_url}},
    )

    return {"email": normalized_email, "linkedin_url": linkedin_url, "updated": True}
