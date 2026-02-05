from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional, List, Any, Literal, Dict
from datetime import datetime, timedelta
from bson import ObjectId
from ..models.meeting import (
    MeetingCreate,
    MeetingUpdate,
    MeetingResponse,
    MeetingListResponse,
    MeetingPlatform,
    TranscriptLine,
)
from ..core.database import get_database
from ..core.auth import get_current_active_user
from ..models.user import UserResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
import math
import httpx
from pydantic import BaseModel, Field
from ..core.config import settings
import json
from ..services.ai_sales_copilot import analyze_call_against_playbook

router = APIRouter()


class MeetingTranscriptionResponse(BaseModel):
    meeting_id: str
    source: Literal["vexa", "cache", "none"] = "none"
    transcript_lines: List[TranscriptLine] = Field(default_factory=list)
    fetched_at: Optional[datetime] = None
    message: Optional[str] = None


class AtlasSummarySections(BaseModel):
    key_takeaways: List[str] = Field(default_factory=list)
    introduction_and_overview: List[str] = Field(default_factory=list)
    current_challenges: List[str] = Field(default_factory=list)
    product_fit_and_capabilities: List[str] = Field(default_factory=list)


class AtlasNextStepItem(BaseModel):
    assignee: str
    description: str
    time: Optional[str] = None


class AtlasQnAItem(BaseModel):
    question: str
    time: Optional[str] = None
    answer: str


class AtlasMeetingInsightsResponse(BaseModel):
    meeting_id: str
    source: Literal["llm", "cache", "none"] = "none"
    generated_at: Optional[datetime] = None
    summary: AtlasSummarySections = Field(default_factory=AtlasSummarySections)
    next_steps: List[AtlasNextStepItem] = Field(default_factory=list)
    questions_and_objections: List[AtlasQnAItem] = Field(default_factory=list)
    message: Optional[str] = None


class ObjectionQuestionItem(BaseModel):
    """Single question/objection instance used in aggregated objection insights."""

    meeting_id: str
    meeting_title: Optional[str] = None
    meeting_created_at: Optional[datetime] = None
    question: str
    time: Optional[str] = None
    answer: str


class ObjectionTopicInsights(BaseModel):
    """Aggregated stats for one objection topic across calls."""

    topic: str
    pct_calls: float
    calls_count: int
    questions_count: int
    questions: List[ObjectionQuestionItem] = Field(default_factory=list)


class ObjectionInsightsResponse(BaseModel):
    """Top-level response model for Objection Handling tab in Insights page."""

    analyzed_from: datetime
    analyzed_to: datetime
    total_calls: int
    topics: List[ObjectionTopicInsights] = Field(default_factory=list)
    generated_at: datetime


class TodoNextStepItem(BaseModel):
    """Single next-step task derived from meeting insights, used on Atlas /todo."""

    meeting_id: str
    meeting_title: Optional[str] = None
    meeting_created_at: Optional[datetime] = None
    assignee: str
    description: str
    time: Optional[str] = None
    status: Literal["open", "done"] = "open"
    due_at: Optional[datetime] = None  # Used for Follow-ups vs Overdue: overdue when due_at < now and status=open


class TodoInsightsResponse(BaseModel):
    """Aggregated To-Do items across meetings for a given time range (day/week)."""

    range_type: Literal["day", "week"]
    analyzed_from: datetime
    analyzed_to: datetime
    total_calls: int
    total_items: int
    items: List[TodoNextStepItem] = Field(default_factory=list)
    generated_at: datetime


class PlaybookRuleResult(BaseModel):
    """Single rule evaluation result for a meeting vs sales playbook."""

    rule_id: Optional[str] = None
    label: str
    description: Optional[str] = None
    passed: bool
    what_you_said: Optional[str] = None
    what_you_should_say: Optional[str] = None


# Fixed dimension keys for playbook dimension scores (0-100 each)
PLAYBOOK_DIMENSION_KEYS = (
    "Handled objections",
    "Personalized demo",
    "Intro Banter",
    "Set Agenda",
    "Demo told a story",
)


class MeetingPlaybookAnalysisResponse(BaseModel):
    """Response model for meeting playbook analysis used by Atlas Playbook tab."""

    meeting_id: str
    template_id: Optional[str] = None
    template_name: Optional[str] = None
    source: Literal["llm", "cache", "none"] = "none"
    generated_at: Optional[datetime] = None
    rules: List[PlaybookRuleResult] = Field(default_factory=list)
    overall_score: Optional[int] = None
    coaching_summary: Optional[str] = None
    dimension_scores: Optional[Dict[str, int]] = None  # e.g. {"Handled objections": 75, ...}
    message: Optional[str] = None


class PerformanceMetric(BaseModel):
    """Single performance metric for Feedback tab (e.g. Speech pace, Talk ratio)."""

    label: str
    status: str
    status_level: Literal["great", "ok", "poor"] = "ok"
    value: str
    has_link: bool = False
    link_url: Optional[str] = None


class FeedbackBullet(BaseModel):
    """Bullet point for AI Sales Coach feedback."""

    title: str
    details: Optional[str] = None


class SpeakingMetricsStored(BaseModel):
    """Computed from transcript for Feedback + Insights Speaking Skills."""

    speech_pace_wpm: Optional[float] = None
    talk_ratio_pct: Optional[float] = None
    longest_customer_monologue_sec: Optional[float] = None
    questions_asked: Optional[int] = None
    filler_words: Optional[int] = None


class MeetingFeedbackResponse(BaseModel):
    """Aggregated feedback for a meeting: metrics + AI coach bullets + call quality score."""

    meeting_id: str
    source: Literal["llm", "cache", "none"] = "none"
    generated_at: Optional[datetime] = None
    quality_score: Optional[int] = None  # 0–100 call quality percentage
    metrics: List[PerformanceMetric] = Field(default_factory=list)
    did_well: List[FeedbackBullet] = Field(default_factory=list)
    improve: List[FeedbackBullet] = Field(default_factory=list)
    speaking_metrics: Optional[SpeakingMetricsStored] = None
    message: Optional[str] = None


class PlaybookScoreDay(BaseModel):
    """Playbook score aggregate for one day (Insights page)."""

    date: str  # YYYY-MM-DD
    label: str  # e.g. "Feb 1"
    score_pct: Optional[float] = None  # average % for that day (0–100)
    count: int = 0  # number of meetings with playbook score
    dimension_scores: Optional[Dict[str, float]] = None  # avg per dimension: Handled objections, Personalized demo, Intro Banter, Set Agenda, Demo told a story


class PlaybookScoresInsightsResponse(BaseModel):
    """Playbook scores per day for the last N days."""

    days: List[PlaybookScoreDay] = Field(default_factory=list)


class SpeakingScoreDay(BaseModel):
    """Speaking metrics aggregate for one day (Insights > Speaking Skills)."""

    date: str
    label: str
    count: int = 0
    speech_pace_wpm: Optional[float] = None
    talk_ratio_pct: Optional[float] = None
    longest_customer_monologue_sec: Optional[float] = None
    questions_asked_avg: Optional[float] = None
    filler_words_avg: Optional[float] = None


class SpeakingScoresInsightsResponse(BaseModel):
    """Speaking metrics per day + overall averages for Insights > Speaking Skills."""

    days: List[SpeakingScoreDay] = Field(default_factory=list)
    averages: Dict[str, Any] = Field(default_factory=dict)  # speech_pace_wpm, talk_ratio_pct, ...


class MeetingComment(BaseModel):
    """Single comment on a meeting."""

    id: str
    meeting_id: str
    user_id: str
    author: str
    text: str
    created_at: datetime
    updated_at: datetime


@router.get("/{meeting_id}/comments", response_model=List[MeetingComment])
async def list_meeting_comments(
    meeting_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """List comments for a meeting (Feedback > Comments tab)."""
    try:
        oid = ObjectId(meeting_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid meeting id")

    meetings = db.meetings
    base = await meetings.find_one({"_id": oid, "user_id": current_user.id})
    if not base:
        raise HTTPException(status_code=404, detail="Meeting not found")

    comments_col = db.meeting_comments
    cursor = comments_col.find({"meeting_id": meeting_id}).sort("created_at", 1)
    docs = await cursor.to_list(length=200)
    out: List[MeetingComment] = []
    for d in docs:
        out.append(
            MeetingComment(
                id=str(d.get("_id")),
                meeting_id=d.get("meeting_id"),
                user_id=d.get("user_id"),
                author=d.get("author") or "",
                text=d.get("text") or "",
                created_at=d.get("created_at"),
                updated_at=d.get("updated_at"),
            )
        )
    return out


class MeetingCommentCreate(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)


class MeetingCommentUpdate(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)


@router.post("/{meeting_id}/comments", response_model=MeetingComment)
async def create_meeting_comment(
    meeting_id: str,
    payload: MeetingCommentCreate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Create a comment on a meeting."""
    try:
        oid = ObjectId(meeting_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid meeting id")

    meetings = db.meetings
    base = await meetings.find_one({"_id": oid, "user_id": current_user.id})
    if not base:
        raise HTTPException(status_code=404, detail="Meeting not found")

    comments_col = db.meeting_comments
    now = datetime.utcnow()
    doc = {
        "meeting_id": meeting_id,
        "user_id": current_user.id,
        "author": current_user.email or "You",
        "text": payload.text.strip(),
        "created_at": now,
        "updated_at": now,
    }
    res = await comments_col.insert_one(doc)
    return MeetingComment(
        id=str(res.inserted_id),
        meeting_id=meeting_id,
        user_id=current_user.id,
        author=doc["author"],
        text=doc["text"],
        created_at=now,
        updated_at=now,
    )


@router.put("/{meeting_id}/comments/{comment_id}", response_model=MeetingComment)
async def update_meeting_comment(
    meeting_id: str,
    comment_id: str,
    payload: MeetingCommentUpdate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Update a comment (only owner can edit)."""
    comments_col = db.meeting_comments
    try:
        cid = ObjectId(comment_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid comment id")

    existing = await comments_col.find_one(
        {"_id": cid, "meeting_id": meeting_id, "user_id": current_user.id}
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Comment not found")

    now = datetime.utcnow()
    text = payload.text.strip()
    await comments_col.update_one(
        {"_id": cid},
        {"$set": {"text": text, "updated_at": now}},
    )

    return MeetingComment(
        id=str(cid),
        meeting_id=meeting_id,
        user_id=current_user.id,
        author=existing.get("author") or (current_user.email or "You"),
        text=text,
        created_at=existing.get("created_at") or now,
        updated_at=now,
    )


@router.delete("/{meeting_id}/comments/{comment_id}")
async def delete_meeting_comment(
    meeting_id: str,
    comment_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Delete a comment (only owner can delete)."""
    comments_col = db.meeting_comments
    try:
        cid = ObjectId(comment_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid comment id")

    res = await comments_col.delete_one(
        {"_id": cid, "meeting_id": meeting_id, "user_id": current_user.id}
    )
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Comment not found")

    return {"message": "Deleted"}


def _sanitize_summary(summary: Any) -> dict:
    s = summary if isinstance(summary, dict) else {}

    def _list(key: str) -> List[str]:
        raw = s.get(key) if isinstance(s, dict) else None
        if not isinstance(raw, list):
            return []
        out: List[str] = []
        for x in raw:
            if x is None:
                continue
            out.append(str(x))
        return out

    return {
        "key_takeaways": _list("key_takeaways"),
        "introduction_and_overview": _list("introduction_and_overview"),
        "current_challenges": _list("current_challenges"),
        "product_fit_and_capabilities": _list("product_fit_and_capabilities"),
    }


def _sanitize_next_steps(items: Any) -> List[dict]:
    if not isinstance(items, list):
        return []
    out: List[dict] = []
    for it in items:
        if not isinstance(it, dict):
            continue
        assignee = it.get("assignee")
        desc = it.get("description")
        if not assignee or not desc:
            continue
        out.append(
            {
                "assignee": str(assignee),
                "description": str(desc),
                "time": (str(it.get("time")) if it.get("time") is not None else None),
            }
        )
    return out


def _sanitize_qna(items: Any) -> List[dict]:
    if not isinstance(items, list):
        return []
    out: List[dict] = []
    for it in items:
        if not isinstance(it, dict):
            continue
        q = it.get("question")
        if not q:
            continue
        a = it.get("answer")
        # Preserve existing topic if present, otherwise classify a topic for this question
        topic = it.get("topic")
        try:
            if not topic:
                topic = _classify_objection_topic(str(q))
        except NameError:
            # _classify_objection_topic defined later; if not available yet, fall back to None
            topic = None
        out.append(
            {
                "question": str(q),
                "time": (str(it.get("time")) if it.get("time") is not None else None),
                "answer": "" if a is None else str(a),
                "topic": topic,
            }
        )
    return out


def _build_transcript_text(lines: Any) -> str:
    """Convert stored transcript_lines into a prompt-friendly text."""
    if not lines:
        return ""
    parts: List[str] = []
    for l in lines:
        speaker = (l.get("speaker") if isinstance(l, dict) else getattr(l, "speaker", "")) or "Unknown"
        t = (l.get("time") if isinstance(l, dict) else getattr(l, "time", "")) or ""
        text = (l.get("text") if isinstance(l, dict) else getattr(l, "text", "")) or ""
        parts.append(f"[{t}] {speaker}: {text}")
    return "\n".join(parts)


def _compute_speaking_metrics(lines: Any) -> Dict[str, Any]:
    """
    Compute speaking metrics from transcript_lines for Feedback + Insights Speaking Skills.
    Returns: speech_pace_wpm, talk_ratio_pct, longest_customer_monologue_sec, questions_asked, filler_words.
    Rep = role Seller (case-insensitive) or first speaker. Duration per line estimated as words/2.5 sec (~150 wpm).
    """
    if not lines:
        return {
            "speech_pace_wpm": None,
            "talk_ratio_pct": None,
            "longest_customer_monologue_sec": None,
            "questions_asked": None,
            "filler_words": None,
        }
    FILLER_PATTERNS = ("um", "uh", "like", "you know", "actually", "basically")
    WPM_ESTIMATE = 150.0
    SEC_PER_WORD = 60.0 / WPM_ESTIMATE

    rep_name: Optional[str] = None
    for l in lines:
        role = (l.get("role") if isinstance(l, dict) else getattr(l, "role", None)) or ""
        speaker = (l.get("speaker") if isinstance(l, dict) else getattr(l, "speaker", "")) or ""
        if str(role).strip().lower() == "seller":
            rep_name = speaker.strip() or rep_name
            break
    if rep_name is None and lines:
        first = lines[0]
        rep_name = (first.get("speaker") if isinstance(first, dict) else getattr(first, "speaker", "")) or ""

    rep_words = 0
    rep_duration_sec = 0.0
    total_duration_sec = 0.0
    questions_asked = 0
    filler_count = 0
    current_customer_sec = 0.0
    longest_customer_monologue_sec = 0.0

    for l in lines:
        speaker = (l.get("speaker") if isinstance(l, dict) else getattr(l, "speaker", "")) or ""
        text = (l.get("text") if isinstance(l, dict) else getattr(l, "text", "")) or ""
        words = len(text.split())
        dur_sec = max(0.1, words * SEC_PER_WORD)
        total_duration_sec += dur_sec
        is_rep = (speaker.strip().lower() == rep_name.strip().lower()) if rep_name else False

        if is_rep:
            rep_words += words
            rep_duration_sec += dur_sec
            if "?" in text:
                questions_asked += 1
            current_customer_sec = 0.0
        else:
            current_customer_sec += dur_sec
            longest_customer_monologue_sec = max(longest_customer_monologue_sec, current_customer_sec)

        text_lower = text.lower()
        for p in FILLER_PATTERNS:
            filler_count += text_lower.count(p)

    speech_pace_wpm = round(rep_words * 60.0 / rep_duration_sec, 1) if rep_duration_sec > 0 else None
    talk_ratio_pct = round(100.0 * rep_duration_sec / total_duration_sec, 1) if total_duration_sec > 0 else None
    longest_customer_monologue_sec = round(longest_customer_monologue_sec, 1) if longest_customer_monologue_sec else None

    return {
        "speech_pace_wpm": speech_pace_wpm,
        "talk_ratio_pct": talk_ratio_pct,
        "longest_customer_monologue_sec": longest_customer_monologue_sec,
        "questions_asked": questions_asked,
        "filler_words": filler_count,
    }


async def _call_groq_json(prompt: str) -> Any:
    """Call Groq chat completions and parse JSON response safely."""
    if not settings.GROQ_API_KEY:
        raise RuntimeError("Missing GROQ_API_KEY")
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {settings.GROQ_API_KEY}", "Content-Type": "application/json"}
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": "Return ONLY valid JSON. No markdown. No extra text."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.2,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(url, headers=headers, json=payload)
        r.raise_for_status()
        data = r.json()
    content = (((data or {}).get("choices") or [{}])[0].get("message") or {}).get("content") or ""
    content = content.strip()
    # attempt direct json parse; else try extracting first {...} block
    try:
        return json.loads(content)
    except Exception:
        start = content.find("{")
        end = content.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(content[start : end + 1])
        raise


def _extract_google_meet_id(link: str) -> Optional[str]:
    try:
        from urllib.parse import urlparse

        u = urlparse(link)
        if "meet.google.com" in (u.netloc or ""):
            parts = [p for p in (u.path or "").split("/") if p]
            return parts[-1] if parts else None
    except Exception:
        pass
    import re

    m = re.search(r"meet\.google\.com/([a-z-]+)", link or "", re.IGNORECASE)
    return m.group(1) if m else None


def _extract_teams_meeting_id(link: str) -> Optional[str]:
    try:
        from urllib.parse import urlparse

        u = urlparse(link)
        if "teams.live.com" in (u.netloc or ""):
            parts = [p for p in (u.path or "").split("/") if p]
            return parts[-1] if parts else None
    except Exception:
        pass
    import re

    m = re.search(r"teams\.live\.com/meet/(\d+)", link or "", re.IGNORECASE)
    return m.group(1) if m else None


def _format_seconds(sec: Any) -> str:
    try:
        s = int(float(sec))
    except Exception:
        s = 0
    m = s // 60
    r = s % 60
    return f"{m:02d}:{r:02d}"

@router.get("", response_model=MeetingListResponse)
async def get_meetings(
    search: Optional[str] = Query(None),
    platform: Optional[MeetingPlatform] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get meetings with filtering and pagination"""
    try:
        collection = db.meetings
        
        # Build filter - only get meetings for current user
        filter_query = {"user_id": current_user.id}
        
        if search:
            filter_query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}}
            ]
        if platform:
            filter_query["platform"] = platform.value
        
        # Get total count
        total = await collection.count_documents(filter_query)
        total_pages = math.ceil(total / limit) if total > 0 else 0
        
        # Get records
        skip = (page - 1) * limit
        cursor = collection.find(filter_query).skip(skip).limit(limit).sort("created_at", -1)
        records = await cursor.to_list(length=limit)
        
        # Convert ObjectId to string for each record
        for record in records:
            if '_id' in record:
                record['id'] = str(record['_id'])
                del record['_id']
        
        return MeetingListResponse(
            meetings=records,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages
        )
    except Exception as e:
        print(f"Error in get_meetings: {e}")
        # Return empty response on error
        return MeetingListResponse(
            meetings=[],
            total=0,
            page=page,
            limit=limit,
            total_pages=0
        )


@router.get("/insights/playbook-scores", response_model=PlaybookScoresInsightsResponse)
async def get_playbook_scores_insights(
    days: int = Query(5, ge=1, le=31, description="Number of days (last N days including today)."),
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Get playbook score aggregates for the last N days (Insights page).
    Returns one row per day: date, label, average overall score %, meeting count,
    and average per dimension (Handled objections, Personalized demo, Intro Banter, Set Agenda, Demo told a story).
    """
    collection = db.meetings
    now = datetime.utcnow()
    end_date = now.date()
    start_date = end_date - timedelta(days=days - 1)
    start_dt = datetime(start_date.year, start_date.month, start_date.day, 0, 0, 0)
    end_dt = datetime(end_date.year, end_date.month, end_date.day, 23, 59, 59, 999999)

    cursor = collection.find(
        {
            "user_id": current_user.id,
            "created_at": {"$gte": start_dt, "$lte": end_dt},
            "playbook_analysis.overall_score": {"$exists": True, "$ne": None},
        },
        projection={
            "created_at": 1,
            "playbook_analysis.overall_score": 1,
            "playbook_analysis.dimension_scores": 1,
        },
    )
    docs = await cursor.to_list(length=1000)

    by_date: Dict[str, List[Dict[str, Any]]] = {}
    for doc in docs:
        created = doc.get("created_at")
        if not created:
            continue
        date_str = created.strftime("%Y-%m-%d") if hasattr(created, "strftime") else str(created)[:10]
        by_date.setdefault(date_str, []).append(doc)

    result: List[PlaybookScoreDay] = []
    for i in range(days):
        d = start_date + timedelta(days=i)
        date_str = d.strftime("%Y-%m-%d")
        label = d.strftime("%b ") + str(d.day)
        day_docs = by_date.get(date_str) or []

        if not day_docs:
            result.append(PlaybookScoreDay(date=date_str, label=label, score_pct=None, count=0, dimension_scores=None))
            continue

        scores = [doc.get("playbook_analysis") or {} for doc in day_docs]
        overalls = [s.get("overall_score") for s in scores if s.get("overall_score") is not None]
        avg_overall = round(sum(overalls) / len(overalls), 1) if overalls else None

        dimension_scores: Dict[str, float] = {}
        for key in PLAYBOOK_DIMENSION_KEYS:
            vals = []
            for s in scores:
                dims = s.get("dimension_scores") or {}
                if isinstance(dims, dict) and key in dims and dims[key] is not None:
                    try:
                        vals.append(int(dims[key]))
                    except (TypeError, ValueError):
                        pass
            if vals:
                dimension_scores[key] = round(sum(vals) / len(vals), 1)

        result.append(
            PlaybookScoreDay(
                date=date_str,
                label=label,
                score_pct=avg_overall,
                count=len(day_docs),
                dimension_scores=dimension_scores if dimension_scores else None,
            )
        )

    return PlaybookScoresInsightsResponse(days=result)


@router.get("/insights/speaking-scores", response_model=SpeakingScoresInsightsResponse)
async def get_speaking_scores_insights(
    days: int = Query(5, ge=1, le=31, description="Number of days (last N days including today)."),
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Get speaking metrics aggregates from feedback_coach.speaking_metrics for the last N days.
    Used by Insights > Speaking Skills: chart by day + averages for metrics cards.
    """
    collection = db.meetings
    now = datetime.utcnow()
    end_date = now.date()
    start_date = end_date - timedelta(days=days - 1)
    start_dt = datetime(start_date.year, start_date.month, start_date.day, 0, 0, 0)
    end_dt = datetime(end_date.year, end_date.month, end_date.day, 23, 59, 59, 999999)

    cursor = collection.find(
        {
            "user_id": current_user.id,
            "created_at": {"$gte": start_dt, "$lte": end_dt},
            "feedback_coach.speaking_metrics": {"$exists": True},
        },
        projection={"created_at": 1, "feedback_coach.speaking_metrics": 1},
    )
    docs = await cursor.to_list(length=1000)

    by_date: Dict[str, List[Dict[str, Any]]] = {}
    for doc in docs:
        created = doc.get("created_at")
        if not created:
            continue
        date_str = created.strftime("%Y-%m-%d") if hasattr(created, "strftime") else str(created)[:10]
        sm = (doc.get("feedback_coach") or {}).get("speaking_metrics") or {}
        if sm:
            by_date.setdefault(date_str, []).append(sm)

    result_days: List[SpeakingScoreDay] = []
    all_wpm: List[float] = []
    all_ratio: List[float] = []
    all_mono: List[float] = []
    all_questions: List[float] = []
    all_filler: List[float] = []

    for i in range(days):
        d = start_date + timedelta(days=i)
        date_str = d.strftime("%Y-%m-%d")
        label = d.strftime("%b ") + str(d.day)
        day_metrics = by_date.get(date_str) or []

        if not day_metrics:
            result_days.append(SpeakingScoreDay(date=date_str, label=label, count=0))
            continue

        wpm_vals = [m["speech_pace_wpm"] for m in day_metrics if m.get("speech_pace_wpm") is not None]
        ratio_vals = [m["talk_ratio_pct"] for m in day_metrics if m.get("talk_ratio_pct") is not None]
        mono_vals = [m["longest_customer_monologue_sec"] for m in day_metrics if m.get("longest_customer_monologue_sec") is not None]
        q_vals = [m["questions_asked"] for m in day_metrics if m.get("questions_asked") is not None]
        f_vals = [m["filler_words"] for m in day_metrics if m.get("filler_words") is not None]

        all_wpm.extend(wpm_vals)
        all_ratio.extend(ratio_vals)
        all_mono.extend(mono_vals)
        all_questions.extend(q_vals)
        all_filler.extend(f_vals)

        result_days.append(
            SpeakingScoreDay(
                date=date_str,
                label=label,
                count=len(day_metrics),
                speech_pace_wpm=round(sum(wpm_vals) / len(wpm_vals), 1) if wpm_vals else None,
                talk_ratio_pct=round(sum(ratio_vals) / len(ratio_vals), 1) if ratio_vals else None,
                longest_customer_monologue_sec=round(sum(mono_vals) / len(mono_vals), 1) if mono_vals else None,
                questions_asked_avg=round(sum(q_vals) / len(q_vals), 1) if q_vals else None,
                filler_words_avg=round(sum(f_vals) / len(f_vals), 1) if f_vals else None,
            )
        )

    n = len(all_wpm)
    averages: Dict[str, Any] = {}
    if all_wpm:
        averages["speech_pace_wpm"] = round(sum(all_wpm) / len(all_wpm), 1)
    if all_ratio:
        averages["talk_ratio_pct"] = round(sum(all_ratio) / len(all_ratio), 1)
    if all_mono:
        averages["longest_customer_monologue_sec"] = round(sum(all_mono) / len(all_mono), 1)
    if all_questions:
        averages["questions_asked_avg"] = round(sum(all_questions) / len(all_questions), 1)
    if all_filler:
        averages["filler_words_avg"] = round(sum(all_filler) / len(all_filler), 1)

    return SpeakingScoresInsightsResponse(days=result_days, averages=averages)


def _classify_objection_topic(question: str) -> str:
    """
    Very simple keyword-based classifier to group questions/objections into topics.
    Mirrors the topics used in the Atlas Objection Handling UI.
    """
    text = (question or "").lower()
    if not text.strip():
        return "Other questions"

    if any(k in text for k in ["price", "pricing", "cost", "budget", "roi", "return on investment", "discount"]):
        return "Pricing and ROI"
    if any(k in text for k in ["feature", "capabilit", "functionality", "roadmap", "integration", "api"]):
        return "Product features & capabilities"
    if any(k in text for k in ["competitor", "competition", "alternative", "other vendor", "why you", "differentiate"]):
        return "Competitive differentiation"
    if any(k in text for k in ["implement", "onboard", "rollout", "go live", "migration", "adoption", "training"]):
        return "Implementation & Onboarding"
    if any(k in text for k in ["contract", "legal", "security", "compliance", "data privacy", "sla"]):
        return "Legal, security & compliance"
    return "Other questions"


@router.post("/insights/objections/analyze", response_model=ObjectionInsightsResponse)
async def analyze_objection_insights(
    days: int = Query(5, ge=1, le=31, description="Number of days (last N days including today)."),
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Analyze questions & objections across all meetings in the last N days.

    - For each meeting, uses (or generates) `atlas_questions_and_objections`.
    - Groups questions by high-level topic.
    - Computes % of calls in which each topic appeared.
    - Persists a single aggregated snapshot per user; re-running replaces the snapshot.
    """
    meetings_coll = db.meetings
    insights_coll = db.objection_insights

    now = datetime.utcnow()
    end_date = now.date()
    start_date = end_date - timedelta(days=days - 1)
    start_dt = datetime(start_date.year, start_date.month, start_date.day, 0, 0, 0)
    end_dt = datetime(end_date.year, end_date.month, end_date.day, 23, 59, 59, 999999)

    cursor = meetings_coll.find(
        {
            "user_id": current_user.id,
            "created_at": {"$gte": start_dt, "$lte": end_dt},
        },
        projection={
            "_id": 1,
            "title": 1,
            "created_at": 1,
            "atlas_questions_and_objections": 1,
        },
    )
    docs = await cursor.to_list(length=1000)

    total_calls = len(docs)
    if total_calls == 0:
        # Clear any previous insights and return empty response
        await insights_coll.delete_many({"user_id": current_user.id})
        return ObjectionInsightsResponse(
            analyzed_from=start_dt,
            analyzed_to=end_dt,
            total_calls=0,
            topics=[],
            generated_at=now,
        )

    # Accumulators
    topic_meeting_ids: Dict[str, set] = {}
    topic_questions: Dict[str, List[ObjectionQuestionItem]] = {}
    # Per-meeting updated Q&A with assigned topics (to persist back into meetings collection)
    meeting_qna_updates: Dict[str, List[dict]] = {}

    for doc in docs:
        meeting_id = str(doc.get("_id"))
        meeting_title = doc.get("title") or ""
        meeting_created_at = doc.get("created_at")

        raw_qna = doc.get("atlas_questions_and_objections") or []
        qna_list = _sanitize_qna(raw_qna)
        # If there is no cached Q&A, try to generate it once via existing helper
        if not qna_list:
            try:
                insights = await get_atlas_meeting_insights(
                    meeting_id=meeting_id,
                    force_refresh=False,
                    current_user=current_user,
                    db=db,
                )
                qna_list = _sanitize_qna([q.model_dump() for q in insights.questions_and_objections])
            except Exception:
                qna_list = []

        if not qna_list:
            continue

        seen_topics_for_meeting = set()
        updated_qna_for_meeting: List[dict] = []
        for item in qna_list:
            q_text = item.get("question", "")
            a_text = item.get("answer", "")
            t_text = item.get("time")

            topic = _classify_objection_topic(q_text)

            # Build normalized + classified Q&A item (to persist back into meetings collection)
            classified_item = {
                "question": q_text,
                "time": t_text,
                "answer": a_text,
                "topic": topic,
            }
            updated_qna_for_meeting.append(classified_item)
            if topic not in topic_meeting_ids:
                topic_meeting_ids[topic] = set()
            if topic not in topic_questions:
                topic_questions[topic] = []

            topic_questions[topic].append(
                ObjectionQuestionItem(
                    meeting_id=meeting_id,
                    meeting_title=meeting_title,
                    meeting_created_at=meeting_created_at,
                    question=q_text or "",
                    time=t_text,
                    answer=a_text or "",
                )
            )
            if topic not in seen_topics_for_meeting:
                topic_meeting_ids[topic].add(meeting_id)
                seen_topics_for_meeting.add(topic)

        if updated_qna_for_meeting:
            meeting_qna_updates[meeting_id] = updated_qna_for_meeting

    topics: List[ObjectionTopicInsights] = []
    for topic, questions in topic_questions.items():
        calls_with_topic = len(topic_meeting_ids.get(topic, set()))
        pct_calls = round(100.0 * calls_with_topic / total_calls, 1) if total_calls > 0 else 0.0
        topics.append(
            ObjectionTopicInsights(
                topic=topic,
                pct_calls=pct_calls,
                calls_count=calls_with_topic,
                questions_count=len(questions),
                questions=questions,
            )
        )

    # Sort topics by percentage desc
    topics.sort(key=lambda t: t.pct_calls, reverse=True)

    # Persist per-meeting classified topics back into meetings collection
    if meeting_qna_updates:
        for mid, qna_items in meeting_qna_updates.items():
            try:
                await meetings_coll.update_one(
                    {"_id": ObjectId(mid), "user_id": current_user.id},
                    {"$set": {"atlas_questions_and_objections": qna_items}},
                )
            except Exception:
                # Best-effort; don't fail whole analysis if one meeting update fails
                continue

    # Persist snapshot: one document per user (overwrite any previous)
    await insights_coll.delete_many({"user_id": current_user.id})
    doc_to_insert = {
        "user_id": current_user.id,
        "analyzed_from": start_dt,
        "analyzed_to": end_dt,
        "total_calls": total_calls,
        "topics": [t.model_dump() for t in topics],
        "generated_at": now,
    }
    await insights_coll.insert_one(doc_to_insert)

    return ObjectionInsightsResponse(
        analyzed_from=start_dt,
        analyzed_to=end_dt,
        total_calls=total_calls,
        topics=topics,
        generated_at=now,
    )


@router.get("/insights/objections", response_model=ObjectionInsightsResponse)
async def get_objection_insights(
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Get the last saved objection insights snapshot for the current user.
    If none exists, returns an empty snapshot with total_calls = 0.
    """
    insights_coll = db.objection_insights
    doc = await insights_coll.find_one({"user_id": current_user.id}, sort=[("generated_at", -1)])
    now = datetime.utcnow()
    if not doc:
        return ObjectionInsightsResponse(
            analyzed_from=now,
            analyzed_to=now,
            total_calls=0,
            topics=[],
            generated_at=now,
        )

    topics_data = doc.get("topics") or []
    topics = [ObjectionTopicInsights(**t) for t in topics_data]
    return ObjectionInsightsResponse(
        analyzed_from=doc.get("analyzed_from") or now,
        analyzed_to=doc.get("analyzed_to") or now,
        total_calls=doc.get("total_calls") or 0,
        topics=topics,
        generated_at=doc.get("generated_at") or now,
    )


@router.post("/insights/todo/analyze", response_model=TodoInsightsResponse)
async def analyze_todo_insights(
    range_type: Literal["day", "week"] = Query("day", description="Analyze 'day' (today) or 'week' (last 7 days including today)."),
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Analyze meetings in the requested time window: use transcription of each meeting
    to produce next-step actions (via Atlas insights LLM). Aggregate into To-Do tasks.

    - Loads all meetings in the window (day = today, week = last 7 days).
    - For each meeting: uses atlas_next_steps if present; else calls get_atlas_meeting_insights
      (which uses transcript_lines + LLM to generate summary, next_steps, Q&A).
    - Each next step gets due_at = meeting date + 1 day (for Overdue tab).
    - Re-running Analyze: deletes the previous snapshot for this user + range_type, then saves the new one.
    """
    meetings_coll = db.meetings
    insights_coll = db.todo_insights

    days = 1 if range_type == "day" else 7
    now = datetime.utcnow()
    end_date = now.date()
    start_date = end_date - timedelta(days=days - 1)
    start_dt = datetime(start_date.year, start_date.month, start_date.day, 0, 0, 0)
    end_dt = datetime(end_date.year, end_date.month, end_date.day, 23, 59, 59, 999999)

    cursor = meetings_coll.find(
        {
            "user_id": current_user.id,
            "created_at": {"$gte": start_dt, "$lte": end_dt},
        },
        projection={
            "_id": 1,
            "title": 1,
            "created_at": 1,
            "atlas_next_steps": 1,
        },
    )
    docs = await cursor.to_list(length=1000)

    total_calls = len(docs)
    items: List[TodoNextStepItem] = []

    for doc in docs:
        meeting_id = str(doc.get("_id"))
        meeting_title = doc.get("title") or ""
        meeting_created_at = doc.get("created_at")

        raw_next = doc.get("atlas_next_steps") or []
        next_steps = _sanitize_next_steps(raw_next)

        # If there is no cached next steps, try to generate once via existing helper
        if not next_steps:
            try:
                insights = await get_atlas_meeting_insights(
                    meeting_id=meeting_id,
                    force_refresh=False,
                    current_user=current_user,
                    db=db,
                )
                next_steps = _sanitize_next_steps([ns.model_dump() for ns in insights.next_steps])
            except Exception:
                next_steps = []

        if not next_steps:
            continue

        # due_at = meeting date + 1 day (end of that day) so Overdue = open items with due_at < now
        meeting_date = meeting_created_at.date() if hasattr(meeting_created_at, "date") and meeting_created_at else end_date
        due_date = meeting_date + timedelta(days=1)
        due_dt = datetime(due_date.year, due_date.month, due_date.day, 23, 59, 59, 999999)

        for step in next_steps:
            assignee = (step.get("assignee") or "").strip() or "Rep"
            desc = (step.get("description") or "").strip()
            if not desc:
                continue
            time_str = step.get("time")
            items.append(
                TodoNextStepItem(
                    meeting_id=meeting_id,
                    meeting_title=meeting_title,
                    meeting_created_at=meeting_created_at,
                    assignee=assignee,
                    description=desc,
                    time=time_str,
                    status="open",
                    due_at=due_dt,
                )
            )

        # Persist sanitized next steps back into meeting document for reuse
        try:
            await meetings_coll.update_one(
                {"_id": doc.get("_id"), "user_id": current_user.id},
                {"$set": {"atlas_next_steps": next_steps}},
            )
        except Exception:
            pass

    # Sort tasks by meeting_created_at desc then by time (if present)
    items.sort(key=lambda it: (it.meeting_created_at or now, it.time or ""), reverse=True)

    # Persist snapshot: overwrite previous for this user + range_type
    await insights_coll.delete_many({"user_id": current_user.id, "range_type": range_type})
    snapshot = {
        "user_id": current_user.id,
        "range_type": range_type,
        "analyzed_from": start_dt,
        "analyzed_to": end_dt,
        "total_calls": total_calls,
        "total_items": len(items),
        "items": [i.model_dump() for i in items],
        "generated_at": now,
    }
    await insights_coll.insert_one(snapshot)

    return TodoInsightsResponse(
        range_type=range_type,
        analyzed_from=start_dt,
        analyzed_to=end_dt,
        total_calls=total_calls,
        total_items=len(items),
        items=items,
        generated_at=now,
    )


@router.get("/insights/todo", response_model=TodoInsightsResponse)
async def get_todo_insights(
    range_type: Literal["day", "week"] = Query("day", description="Snapshot to load: 'day' or 'week'."),
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Get the last saved To-Do insights snapshot for the given range_type.
    If none exists, returns an empty snapshot.
    """
    insights_coll = db.todo_insights
    now = datetime.utcnow()
    doc = await insights_coll.find_one(
        {"user_id": current_user.id, "range_type": range_type},
        sort=[("generated_at", -1)],
    )
    if not doc:
        return TodoInsightsResponse(
            range_type=range_type,
            analyzed_from=now,
            analyzed_to=now,
            total_calls=0,
            total_items=0,
            items=[],
            generated_at=now,
        )

    items = [TodoNextStepItem(**it) for it in (doc.get("items") or [])]
    return TodoInsightsResponse(
        range_type=doc.get("range_type", range_type),
        analyzed_from=doc.get("analyzed_from") or now,
        analyzed_to=doc.get("analyzed_to") or now,
        total_calls=doc.get("total_calls") or 0,
        total_items=doc.get("total_items") or len(items),
        items=items,
        generated_at=doc.get("generated_at") or now,
    )

@router.get("/{meeting_id}", response_model=MeetingResponse)
async def get_meeting(
    meeting_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get a specific meeting"""
    try:
        collection = db.meetings
        record = await collection.find_one({
            "_id": ObjectId(meeting_id),
            "user_id": current_user.id
        })
        
        if not record:
            raise HTTPException(status_code=404, detail="Meeting not found")
        
        # Convert ObjectId to string
        if '_id' in record:
            record['id'] = str(record['_id'])
            del record['_id']
        
        return record
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_meeting: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("", response_model=MeetingResponse)
async def create_meeting(
    meeting_data: MeetingCreate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create a new meeting"""
    try:
        collection = db.meetings
        
        # Convert to dict and add timestamps and user_id
        record_data = meeting_data.dict()
        record_data["user_id"] = current_user.id
        record_data["created_at"] = datetime.utcnow()
        record_data["updated_at"] = datetime.utcnow()
        
        result = await collection.insert_one(record_data)
        
        # Get the created record
        created_record = await collection.find_one({"_id": result.inserted_id})
        
        # Convert ObjectId to string
        if created_record and '_id' in created_record:
            created_record['id'] = str(created_record['_id'])
            del created_record['_id']
        
        return created_record
    except Exception as e:
        print(f"Error in create_meeting: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/{meeting_id}", response_model=MeetingResponse)
async def update_meeting(
    meeting_id: str,
    meeting_data: MeetingUpdate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update a meeting"""
    try:
        collection = db.meetings
        
        # Check if record exists and belongs to user
        existing_record = await collection.find_one({
            "_id": ObjectId(meeting_id),
            "user_id": current_user.id
        })
        if not existing_record:
            raise HTTPException(status_code=404, detail="Meeting not found")
        
        # Update record
        update_data = {k: v for k, v in meeting_data.dict().items() if v is not None}
        if update_data:
            update_data["updated_at"] = datetime.utcnow()
            await collection.update_one(
                {"_id": ObjectId(meeting_id)},
                {"$set": update_data}
            )
        
        # Get updated record
        updated_record = await collection.find_one({"_id": ObjectId(meeting_id)})
        
        # Convert ObjectId to string
        if updated_record and '_id' in updated_record:
            updated_record['id'] = str(updated_record['_id'])
            del updated_record['_id']
        
        return updated_record
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in update_meeting: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/{meeting_id}")
async def delete_meeting(
    meeting_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete a meeting"""
    try:
        collection = db.meetings
        
        # Check if record exists and belongs to user
        existing_record = await collection.find_one({
            "_id": ObjectId(meeting_id),
            "user_id": current_user.id
        })
        if not existing_record:
            raise HTTPException(status_code=404, detail="Meeting not found")
        
        result = await collection.delete_one({"_id": ObjectId(meeting_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Meeting not found")
        
        return {"message": "Meeting deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in delete_meeting: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{meeting_id}/transcription", response_model=MeetingTranscriptionResponse)
async def get_meeting_transcription(
    meeting_id: str,
    refresh_ttl_seconds: int = Query(600, ge=0, le=3600),
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Smart transcription fetch:
    - Prefer cached transcript_lines if fresh (within TTL)
    - Else try fetching from Vexa; on success, store to DB and return
    - On Vexa failure, fall back to cached transcript_lines
    """
    collection = db.meetings
    try:
        oid = ObjectId(meeting_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid meeting id")

    doc = await collection.find_one({"_id": oid, "user_id": current_user.id})
    if not doc:
        raise HTTPException(status_code=404, detail="Meeting not found")

    cached_lines = doc.get("transcript_lines") or []
    cached_fetched_at = doc.get("transcript_fetched_at")
    now = datetime.utcnow()

    # If cache is fresh enough, return without calling Vexa
    if cached_lines and cached_fetched_at and refresh_ttl_seconds > 0:
        try:
            age = (now - cached_fetched_at).total_seconds()
            if age <= refresh_ttl_seconds:
                return MeetingTranscriptionResponse(
                    meeting_id=meeting_id,
                    source="cache",
                    transcript_lines=cached_lines,
                    fetched_at=cached_fetched_at,
                    message="Returned cached transcription (fresh).",
                )
        except Exception:
            # If timestamp is malformed, ignore and try refresh
            pass

    platform = doc.get("platform")
    link = doc.get("link") or ""

    # If platform is missing, infer from link
    if not platform:
        if "meet.google.com" in link:
            platform = "google_meet"
        elif "teams.live.com" in link:
            platform = "teams"

    # Unsupported platforms: return cache (or none)
    if platform not in ("google_meet", "teams"):
        return MeetingTranscriptionResponse(
            meeting_id=meeting_id,
            source="cache" if cached_lines else "none",
            transcript_lines=cached_lines,
            fetched_at=cached_fetched_at,
            message="Unsupported meeting platform for transcription.",
        )

    native_id = None
    endpoint = None
    if platform == "google_meet":
        native_id = _extract_google_meet_id(link)
        endpoint = f"{settings.VEXA_API_BASE}/transcripts/google_meet/{native_id}" if native_id else None
    elif platform == "teams":
        native_id = _extract_teams_meeting_id(link)
        endpoint = f"{settings.VEXA_API_BASE}/transcripts/teams/{native_id}" if native_id else None

    if not native_id or not endpoint:
        # Can't extract meeting id; return cache
        return MeetingTranscriptionResponse(
            meeting_id=meeting_id,
            source="cache" if cached_lines else "none",
            transcript_lines=cached_lines,
            fetched_at=cached_fetched_at,
            message="Could not extract native meeting id from link.",
        )

    # Try calling Vexa; on failure, fall back to cache
    try:
        if not settings.VEXA_API_KEY:
            raise RuntimeError("Missing VEXA_API_KEY")

        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.get(endpoint, headers={"X-API-Key": settings.VEXA_API_KEY})
            r.raise_for_status()
            data = r.json()

        segments = (data or {}).get("segments") or []
        mapped: List[dict] = []
        for seg in segments:
            mapped.append(
                {
                    "speaker": seg.get("speaker") or "Unknown",
                    "role": None,
                    "time": _format_seconds(seg.get("start")),
                    "text": seg.get("text") or "",
                }
            )

        # If Vexa returns no segments, prefer returning cache if available
        if not mapped and cached_lines:
            return MeetingTranscriptionResponse(
                meeting_id=meeting_id,
                source="cache",
                transcript_lines=cached_lines,
                fetched_at=cached_fetched_at,
                message="Vexa returned empty segments; returned cached transcription.",
            )

        # Store to DB (both parsed lines and raw payload for debugging/auditing)
        await collection.update_one(
            {"_id": oid, "user_id": current_user.id},
            {
                "$set": {
                    "transcript_lines": mapped,
                    "transcript_fetched_at": now,
                    "transcript_source": "vexa",
                    "transcript_raw": data,
                    "updated_at": now,
                }
            },
        )

        # Return the stored (mapped) lines
        return MeetingTranscriptionResponse(
            meeting_id=meeting_id,
            source="vexa",
            transcript_lines=mapped,
            fetched_at=now,
            message="Fetched from Vexa and cached.",
        )
    except Exception as e:
        # Fall back to cache
        if cached_lines:
            return MeetingTranscriptionResponse(
                meeting_id=meeting_id,
                source="cache",
                transcript_lines=cached_lines,
                fetched_at=cached_fetched_at,
                message=f"Vexa fetch failed; returned cached transcription. ({type(e).__name__})",
            )
        return MeetingTranscriptionResponse(
            meeting_id=meeting_id,
            source="none",
            transcript_lines=[],
            fetched_at=None,
            message=f"Vexa fetch failed and no cached transcription found. ({type(e).__name__})",
        )


@router.get("/{meeting_id}/atlas-insights", response_model=AtlasMeetingInsightsResponse)
async def get_atlas_meeting_insights(
    meeting_id: str,
    force_refresh: bool = Query(False),
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Get (and generate if missing) Atlas call insights:
    - Summary sections (Key takeaways, discussion topics)
    - Next steps
    - Questions & objections (with suggested answers)

    Strategy:
    - If all fields already exist in DB and not force_refresh -> return cache
    - Else, if transcript exists -> call LLM to generate missing fields, store, then return
    - If LLM fails -> return whatever is cached
    """
    collection = db.meetings
    try:
        oid = ObjectId(meeting_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid meeting id")

    doc = await collection.find_one({"_id": oid, "user_id": current_user.id})
    if not doc:
        raise HTTPException(status_code=404, detail="Meeting not found")

    cached_summary = doc.get("atlas_summary") or None
    cached_next = doc.get("atlas_next_steps") or None
    cached_qna = doc.get("atlas_questions_and_objections") or None
    cached_generated_at = doc.get("atlas_insights_generated_at")

    has_all = bool(cached_summary) and bool(cached_next) and bool(cached_qna)
    if has_all and not force_refresh:
        return AtlasMeetingInsightsResponse(
            meeting_id=meeting_id,
            source="cache",
            generated_at=cached_generated_at,
            summary=_sanitize_summary(cached_summary),
            next_steps=_sanitize_next_steps(cached_next),
            questions_and_objections=_sanitize_qna(cached_qna),
            message="Returned cached insights.",
        )

    transcript_lines = doc.get("transcript_lines") or []
    transcript_text = _build_transcript_text(transcript_lines)
    if not transcript_text.strip():
        # No transcript to generate from -> return cache or none
        return AtlasMeetingInsightsResponse(
            meeting_id=meeting_id,
            source="cache" if (cached_summary or cached_next or cached_qna) else "none",
            generated_at=cached_generated_at,
            summary=_sanitize_summary(cached_summary),
            next_steps=_sanitize_next_steps(cached_next),
            questions_and_objections=_sanitize_qna(cached_qna),
            message="No transcript available to generate insights.",
        )

    # Build prompt asking for strict JSON structure
    prompt = f"""
You are an expert sales call analyst. Based ONLY on the transcript below, produce JSON with this exact schema:
{{
  "summary": {{
    "key_takeaways": [string, ...],
    "introduction_and_overview": [string, ...],
    "current_challenges": [string, ...],
    "product_fit_and_capabilities": [string, ...]
  }},
  "next_steps": [
    {{ "assignee": string, "description": string, "time": "MM:SS" | null }},
    ...
  ],
  "questions_and_objections": [
    {{ "question": string, "time": "MM:SS" | null, "answer": string }},
    ...
  ]
}}

Rules:
- Output ONLY valid JSON.
- Keep bullets concise (1 sentence).
- If a timestamp is unknown, use null.

Transcript:
{transcript_text}
""".strip()

    try:
        generated = await _call_groq_json(prompt)
        summary = _sanitize_summary((generated or {}).get("summary"))
        next_steps = _sanitize_next_steps((generated or {}).get("next_steps"))
        qna = _sanitize_qna((generated or {}).get("questions_and_objections"))

        now = datetime.utcnow()
        update_doc = {"atlas_insights_generated_at": now, "updated_at": now}

        # Only overwrite parts that are missing (unless force_refresh)
        if force_refresh or not cached_summary:
            update_doc["atlas_summary"] = summary
        if force_refresh or not cached_next:
            update_doc["atlas_next_steps"] = next_steps
        if force_refresh or not cached_qna:
            update_doc["atlas_questions_and_objections"] = qna

        await collection.update_one({"_id": oid, "user_id": current_user.id}, {"$set": update_doc})

        # Return merged view (use cache if we didn't overwrite)
        final_summary = _sanitize_summary(update_doc.get("atlas_summary") or cached_summary)
        final_next = _sanitize_next_steps(update_doc.get("atlas_next_steps") or cached_next)
        final_qna = _sanitize_qna(update_doc.get("atlas_questions_and_objections") or cached_qna)

        return AtlasMeetingInsightsResponse(
            meeting_id=meeting_id,
            source="llm",
            generated_at=now,
            summary=final_summary,
            next_steps=final_next,
            questions_and_objections=final_qna,
            message="Generated insights via LLM and cached.",
        )
    except Exception as e:
        # fallback to whatever cache exists
        return AtlasMeetingInsightsResponse(
            meeting_id=meeting_id,
            source="cache" if (cached_summary or cached_next or cached_qna) else "none",
            generated_at=cached_generated_at,
            summary=_sanitize_summary(cached_summary),
            next_steps=_sanitize_next_steps(cached_next),
            questions_and_objections=_sanitize_qna(cached_qna),
            message=f"LLM generation failed; returned cached insights. ({type(e).__name__})",
        )


@router.get(
    "/{meeting_id}/feedback",
    response_model=MeetingFeedbackResponse,
)
async def get_meeting_feedback(
    meeting_id: str,
    force_refresh: bool = Query(
        False,
        description="If true, regenerate feedback even if cached.",
    ),
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Get (and generate if missing) Feedback tab data for a meeting:
    - Performance metrics (speech pace, talk ratio, questions, etc.)
    - AI Sales Coach feedback (what you did well / where you can improve)

    Strategy:
    - If metrics & feedback already exist and not force_refresh -> return cache
    - Else, if transcript exists -> call LLM to generate, store, then return
    - If LLM fails -> return whatever is cached (or none)
    """
    collection = db.meetings
    try:
        oid = ObjectId(meeting_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid meeting id")

    doc = await collection.find_one({"_id": oid, "user_id": current_user.id})
    if not doc:
        raise HTTPException(status_code=404, detail="Meeting not found")

    cached_feedback = doc.get("feedback_coach") or {}
    cached_metrics = cached_feedback.get("metrics") or []
    cached_did_well = cached_feedback.get("did_well") or []
    cached_improve = cached_feedback.get("improve") or []
    cached_generated_at = cached_feedback.get("generated_at")
    cached_quality_score = cached_feedback.get("quality_score")

    cached_speaking = cached_feedback.get("speaking_metrics") or {}

    def _speaking_from_cache() -> Optional[SpeakingMetricsStored]:
        if not cached_speaking:
            return None
        try:
            return SpeakingMetricsStored(**cached_speaking)
        except Exception:
            return None

    has_all = bool(cached_metrics) and (cached_did_well or cached_improve)
    if has_all and not force_refresh:
        return MeetingFeedbackResponse(
            meeting_id=meeting_id,
            source="cache",
            generated_at=cached_generated_at,
            quality_score=cached_quality_score if isinstance(cached_quality_score, int) else None,
            metrics=[PerformanceMetric(**m) for m in cached_metrics],
            did_well=[FeedbackBullet(**b) for b in cached_did_well],
            improve=[FeedbackBullet(**b) for b in cached_improve],
            speaking_metrics=_speaking_from_cache(),
            message="Returned cached feedback.",
        )

    transcript_lines = doc.get("transcript_lines") or []
    transcript_text = _build_transcript_text(transcript_lines)
    if not transcript_text.strip():
        return MeetingFeedbackResponse(
            meeting_id=meeting_id,
            source="cache" if has_all else "none",
            generated_at=cached_generated_at,
            quality_score=cached_quality_score if isinstance(cached_quality_score, int) else None,
            metrics=[PerformanceMetric(**m) for m in cached_metrics] if cached_metrics else [],
            did_well=[FeedbackBullet(**b) for b in cached_did_well] if cached_did_well else [],
            improve=[FeedbackBullet(**b) for b in cached_improve] if cached_improve else [],
            speaking_metrics=_speaking_from_cache(),
            message="No transcript available to generate feedback.",
        )

    # Build prompt asking for strict JSON structure
    prompt = f"""
You are an AI sales coach. Based ONLY on the call transcript below, produce JSON with this exact schema:
{{
  "quality_score": 75,
  "metrics": [
    {{
      "label": "Speech pace",
      "status": "Great!" | "Okay" | "Needs work",
      "status_level": "great" | "ok" | "poor",
      "value": "120 words per minute",
      "has_link": false,
      "link_url": null
    }}
  ],
  "did_well": [
    {{
      "title": "Building rapport and demonstrating personal interest",
      "details": "Short explanation (1-2 sentences) of what the seller did well here."
    }}
  ],
  "improve": [
    {{
      "title": "Improve objection handling",
      "details": "Short, specific coaching suggestion (1-2 sentences)."
    }}
  ]
}}

Rules:
- Output ONLY valid JSON.
- quality_score: integer 0–100 representing overall call quality (rapport, clarity, objection handling, closing, etc.). Be consistent with metrics and did_well/improve.
- 4–6 metrics is enough.
- 2–4 bullets for "did_well" and 2–4 for "improve".
- Be specific and actionable but concise.

Transcript:
{transcript_text}
""".strip()

    try:
        generated = await _call_groq_json(prompt)
        raw_quality = (generated or {}).get("quality_score")
        raw_metrics = (generated or {}).get("metrics") or []
        raw_did_well = (generated or {}).get("did_well") or []
        raw_improve = (generated or {}).get("improve") or []

        quality_score: Optional[int] = None
        if isinstance(raw_quality, int) and 0 <= raw_quality <= 100:
            quality_score = raw_quality
        elif isinstance(raw_quality, (float, str)):
            try:
                v = int(float(raw_quality))
                if 0 <= v <= 100:
                    quality_score = v
            except (ValueError, TypeError):
                pass

        metrics: List[PerformanceMetric] = []
        for m in raw_metrics:
            try:
                metrics.append(PerformanceMetric(**m))
            except Exception:
                continue

        did_well: List[FeedbackBullet] = []
        for b in raw_did_well:
            try:
                did_well.append(FeedbackBullet(**b))
            except Exception:
                continue

        improve: List[FeedbackBullet] = []
        for b in raw_improve:
            try:
                improve.append(FeedbackBullet(**b))
            except Exception:
                continue

        now = datetime.utcnow()
        speaking_metrics = _compute_speaking_metrics(transcript_lines)
        feedback_doc = {
            "quality_score": quality_score,
            "metrics": [m.model_dump() for m in metrics],
            "did_well": [b.model_dump() for b in did_well],
            "improve": [b.model_dump() for b in improve],
            "speaking_metrics": speaking_metrics,
            "generated_at": now,
        }

        await collection.update_one(
            {"_id": oid, "user_id": current_user.id},
            {"$set": {"feedback_coach": feedback_doc, "updated_at": now}},
        )

        sm = SpeakingMetricsStored(**speaking_metrics) if speaking_metrics else None
        return MeetingFeedbackResponse(
            meeting_id=meeting_id,
            source="llm",
            generated_at=now,
            quality_score=quality_score,
            metrics=metrics,
            did_well=did_well,
            improve=improve,
            speaking_metrics=sm,
            message="Generated feedback via LLM and cached.",
        )
    except Exception as e:
        return MeetingFeedbackResponse(
            meeting_id=meeting_id,
            source="cache" if has_all else "none",
            generated_at=cached_generated_at,
            quality_score=cached_quality_score if isinstance(cached_quality_score, int) else None,
            metrics=[PerformanceMetric(**m) for m in cached_metrics] if cached_metrics else [],
            did_well=[FeedbackBullet(**b) for b in cached_did_well] if cached_did_well else [],
            improve=[FeedbackBullet(**b) for b in cached_improve] if cached_improve else [],
            speaking_metrics=_speaking_from_cache(),
            message=f"LLM generation failed; returned cached feedback. ({type(e).__name__})",
        )

@router.get(
    "/{meeting_id}/playbook-analysis",
    response_model=MeetingPlaybookAnalysisResponse,
)
async def get_meeting_playbook_analysis(
    meeting_id: str,
    force_refresh: bool = Query(
        False,
        description="If true, ignore cached analysis and re-run AI against playbook rules.",
    ),
    template_id: Optional[str] = Query(
        None,
        description="Optional explicit playbook template id. If not provided, use the user's default template (or auto-generate).",
    ),
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Analyze a meeting transcript against the Sales Playbook template for this user.

    Used by Atlas Main Playbook tab:
    - If cached analysis exists and force_refresh is false, return it (source = cache)
    - Otherwise, ensure a playbook template exists (auto-generate default if needed),
      call the AI sales copilot, store result on the meeting, and return it (source = llm).
    """
    collection = db.meetings
    try:
        oid = ObjectId(meeting_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid meeting id")

    doc = await collection.find_one({"_id": oid, "user_id": current_user.id})
    if not doc:
        raise HTTPException(status_code=404, detail="Meeting not found")

    transcript_lines = doc.get("transcript_lines") or []
    transcript_text = _build_transcript_text(transcript_lines)
    if not transcript_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Meeting has no transcript to analyze",
        )

    # 1) Return cached analysis if available and not forcing refresh
    existing = doc.get("playbook_analysis")
    if existing and not force_refresh:
        rules = [
            PlaybookRuleResult(
                rule_id=r.get("rule_id"),
                label=r.get("label") or "",
                description=r.get("description"),
                passed=bool(r.get("passed")),
                what_you_said=r.get("what_you_said") or None,
                what_you_should_say=r.get("what_you_should_say") or None,
            )
            for r in (existing.get("rules") or [])
        ]
        return MeetingPlaybookAnalysisResponse(
            meeting_id=meeting_id,
            template_id=existing.get("template_id"),
            template_name=existing.get("template_name"),
            source="cache",
            generated_at=existing.get("generated_at"),
            rules=rules,
            overall_score=existing.get("overall_score"),
            coaching_summary=existing.get("coaching_summary"),
            dimension_scores=existing.get("dimension_scores"),
            message=existing.get("message"),
        )

    # 2) Find or auto-create a sales playbook template for this user
    playbooks = db.playbook_templates

    tpl = None
    if template_id:
        # Use explicit template chosen in UI
        try:
            tpl_oid = ObjectId(template_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid playbook template id")
        tpl = await playbooks.find_one({"_id": tpl_oid, "user_id": current_user.id})
        if not tpl:
            raise HTTPException(status_code=404, detail="Playbook template not found")
    else:
        # Fallback to default template, then any template, else auto-generate
        tpl = await playbooks.find_one(
            {"user_id": current_user.id, "is_default": True}
        )
        if not tpl:
            tpl = await playbooks.find_one({"user_id": current_user.id})

        if not tpl:
            # Auto-generate a simple default playbook if user has none yet
            now = datetime.utcnow()
            default_rules = [
                {
                    "id": "intro",
                    "label": "Engaged in introductory banter",
                    "description": "Did you start the meeting with a warm, human introduction and light small talk?",
                },
                {
                    "id": "agenda",
                    "label": "Set a clear agenda",
                    "description": "Did you clearly state the purpose of the call and align on an agenda with the prospect?",
                },
                {
                    "id": "objections",
                    "label": "Handled objections effectively",
                    "description": "Did you actively listen to and address the prospect's objections with confident, relevant responses?",
                },
                {
                    "id": "next_steps",
                    "label": "Booked the next meeting / agreed clear next steps",
                    "description": "Did you close by agreeing on concrete next steps, ideally with a time/date for a follow-up?",
                },
            ]
            doc_tpl = {
                "user_id": current_user.id,
                "name": "Standard Sales Playbook",
                "rules": default_rules,
                "is_default": True,
                "created_at": now,
                "updated_at": now,
            }
            res = await playbooks.insert_one(doc_tpl)
            tpl = {**doc_tpl, "_id": res.inserted_id}

    template_id = str(tpl["_id"])
    template_name = tpl.get("name") or "Sales Playbook"
    rules_input = tpl.get("rules") or []

    # 3) Call AI sales copilot to analyze transcript vs playbook rules
    ai_result = await analyze_call_against_playbook(
        transcript=transcript_text,
        playbook_name=template_name,
        rules=rules_input,
    )

    if not ai_result:
        return MeetingPlaybookAnalysisResponse(
            meeting_id=meeting_id,
            template_id=template_id,
            template_name=template_name,
            source="none",
            rules=[],
            overall_score=None,
            coaching_summary=None,
            message="Playbook analysis failed. Please try again later.",
        )

    ai_rules = ai_result.get("rules") or []
    rules_out: List[PlaybookRuleResult] = []
    for r in ai_rules:
        label = r.get("label") or ""
        description = r.get("description")
        rules_out.append(
            PlaybookRuleResult(
                rule_id=r.get("rule_id"),
                label=label,
                description=description,
                passed=bool(r.get("passed")),
                what_you_said=(r.get("what_you_said") or "").strip() or None,
                what_you_should_say=(r.get("what_you_should_say") or "").strip() or None,
            )
        )

    raw_dim = ai_result.get("dimension_scores") or {}
    dimension_scores: Dict[str, int] = {}
    for key in PLAYBOOK_DIMENSION_KEYS:
        val = raw_dim.get(key)
        if val is not None:
            try:
                v = int(val)
                dimension_scores[key] = max(0, min(100, v))
            except (TypeError, ValueError):
                pass

    generated_at = datetime.utcnow()
    analysis_doc = {
        "template_id": template_id,
        "template_name": template_name,
        "generated_at": generated_at,
        "rules": [
            {
                "rule_id": r.rule_id,
                "label": r.label,
                "description": r.description,
                "passed": r.passed,
                "what_you_said": r.what_you_said,
                "what_you_should_say": r.what_you_should_say,
            }
            for r in rules_out
        ],
        "overall_score": ai_result.get("overall_score"),
        "coaching_summary": ai_result.get("coaching_summary"),
        "dimension_scores": dimension_scores if dimension_scores else None,
    }

    # 4) Persist analysis on meeting document for future reuse
    await collection.update_one(
        {"_id": oid, "user_id": current_user.id},
        {
            "$set": {
                "playbook_analysis": analysis_doc,
                "updated_at": datetime.utcnow(),
            }
        },
    )

    return MeetingPlaybookAnalysisResponse(
        meeting_id=meeting_id,
        template_id=template_id,
        template_name=template_name,
        source="llm",
        generated_at=generated_at,
        rules=rules_out,
        overall_score=ai_result.get("overall_score"),
        coaching_summary=ai_result.get("coaching_summary"),
        dimension_scores=dimension_scores if dimension_scores else None,
        message=None,
    )
