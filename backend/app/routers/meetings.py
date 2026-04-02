import asyncio
import re
from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import Response
from typing import Optional, List, Any, Literal, Dict
from datetime import datetime, timedelta
from bson import ObjectId
import logging
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

logger = logging.getLogger(__name__)

router = APIRouter()

TRANSCRIPT_VEXA_SKIP_REFRESH_MEETING_MAX_AGE = timedelta(hours=24)


def _meeting_created_at_naive_utc(doc: dict) -> Optional[datetime]:
    created = doc.get("created_at")
    if created is None or not isinstance(created, datetime):
        return None
    if created.tzinfo is not None:
        return created.replace(tzinfo=None)
    return created


def _skip_vexa_transcript_refresh(doc: dict, now: datetime, cached_lines: List) -> bool:
    if not cached_lines:
        return False
    created = _meeting_created_at_naive_utc(doc)
    if created is None:
        return False
    return (now - created) >= TRANSCRIPT_VEXA_SKIP_REFRESH_MEETING_MAX_AGE


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
    checked: Optional[bool] = False


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
    user_actual_answer: Optional[str] = None
    suggested_answer: Optional[str] = None
    match_score: Optional[int] = None
    key_points_covered: List[str] = Field(default_factory=list)
    learning_opportunities: List[str] = Field(default_factory=list)


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
    detail: Optional[str] = None
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
                "checked": bool(it.get("checked", False)),
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


def _groq_429_sleep_seconds(response: httpx.Response) -> float:
    wait = 4.0
    ra = response.headers.get("Retry-After")
    if ra:
        try:
            wait = max(wait, min(90.0, float(ra)))
        except ValueError:
            pass
    try:
        body = response.json()
        msg = str((body.get("error") or {}).get("message") or "")
        m = re.search(r"try again in ([\d.]+)\s*s", msg, re.IGNORECASE)
        if m:
            wait = max(wait, min(90.0, float(m.group(1)) + 0.5))
    except Exception:
        pass
    return wait


async def _call_groq_json(prompt: str) -> Any:
    """Call Groq chat completions and parse JSON response safely."""
    if not settings.GROQ_API_KEY:
        raise RuntimeError("Missing GROQ_API_KEY")
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {settings.GROQ_API_KEY}", "Content-Type": "application/json"}
    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {"role": "system", "content": "Return ONLY valid JSON. No markdown. No extra text."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.2,
    }
    max_attempts = 8
    data: Any = None
    async with httpx.AsyncClient(timeout=120.0) as client:
        for attempt in range(max_attempts):
            r = await client.post(url, headers=headers, json=payload)
            if r.status_code == 429:
                sleep_s = _groq_429_sleep_seconds(r)
                if attempt >= max_attempts - 1:
                    r.raise_for_status()
                logger.warning(
                    "Groq rate limit (429), retry in %.1fs (%s/%s)",
                    sleep_s,
                    attempt + 1,
                    max_attempts,
                )
                await asyncio.sleep(sleep_s)
                continue
            r.raise_for_status()
            data = r.json()
            break
    if data is None:
        raise RuntimeError("Groq request exhausted retries")
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


async def _fetch_and_cache_transcript(
    doc: dict,
    collection: Any,
    user_id: str,
) -> List[dict]:
    """
    Best-effort fetch of transcript_lines for a meeting document.
    Priority:
      1. Fresh cache in DB (< 1 hour old)
      2. Vexa API (google_meet or teams)
      3. Stale cache in DB
    Returns list of transcript line dicts. Never raises.
    """
    cached_lines: List[dict] = doc.get("transcript_lines") or []
    cached_fetched_at = doc.get("transcript_fetched_at")
    meeting_id_str = str(doc.get("_id", ""))
    now = datetime.utcnow()

    if cached_lines and cached_fetched_at:
        try:
            age = (now - cached_fetched_at).total_seconds()
            if age <= 3600:
                return cached_lines
        except Exception:
            pass

    platform = doc.get("platform")
    link = doc.get("link") or ""

    if not platform:
        if "meet.google.com" in link:
            platform = "google_meet"
        elif "teams.live.com" in link or "teams.microsoft.com" in link:
            platform = "teams"

    if platform not in ("google_meet", "teams"):
        return cached_lines

    native_id = None
    endpoint = None
    if platform == "google_meet":
        native_id = _extract_google_meet_id(link)
        if native_id:
            endpoint = f"{settings.VEXA_API_BASE.rstrip('/')}/transcripts/google_meet/{native_id}"
    elif platform == "teams":
        native_id = _extract_teams_meeting_id(link)
        if native_id:
            endpoint = f"{settings.VEXA_API_BASE.rstrip('/')}/transcripts/teams/{native_id}"

    if not native_id or not endpoint or not settings.VEXA_API_KEY:
        return cached_lines

    if _skip_vexa_transcript_refresh(doc, now, cached_lines):
        return cached_lines

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.get(endpoint, headers={"X-API-Key": settings.VEXA_API_KEY})
            r.raise_for_status()
            data = r.json()

        segments = (data or {}).get("segments") or []
        mapped: List[dict] = [
            {
                "speaker": seg.get("speaker") or "Unknown",
                "role": None,
                "time": _format_seconds(seg.get("start")),
                "text": seg.get("text") or "",
            }
            for seg in segments
        ]

        if mapped:
            try:
                last_time = mapped[-1].get("time") or "" if mapped else ""
                duration_seconds: Optional[int] = None
                if last_time:
                    try:
                        parts = last_time.split(":")
                        if len(parts) == 2:
                            duration_seconds = int(parts[0]) * 60 + int(parts[1])
                        elif len(parts) == 3:
                            duration_seconds = int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
                    except Exception:
                        pass
                update_fields: dict = {
                    "transcript_lines": mapped,
                    "transcript_fetched_at": now,
                    "transcript_source": "vexa",
                    "updated_at": now,
                }
                if duration_seconds:
                    update_fields["duration_seconds"] = duration_seconds
                await collection.update_one(
                    {"_id": doc["_id"], "user_id": user_id},
                    {"$set": update_fields},
                )
            except Exception:
                pass
            return mapped

        return cached_lines
    except Exception:
        return cached_lines


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
        
        # Get records - exclude heavy fields, keep analysis metadata
        skip = (page - 1) * limit
        projection = {"transcript_lines": 0}
        cursor = collection.find(filter_query, projection).skip(skip).limit(limit).sort("created_at", -1)
        records = await cursor.to_list(length=limit)

        # Back-fill duration_seconds for meetings that don't have it yet
        ids_missing_duration = [
            r["_id"] for r in records
            if not r.get("duration_seconds") and r.get("_id")
        ]
        if ids_missing_duration:
            raw_cursor = collection.find(
                {"_id": {"$in": ids_missing_duration}},
                {"_id": 1, "transcript_lines": 1},
            )
            raw_docs = await raw_cursor.to_list(length=len(ids_missing_duration))
            duration_map: dict = {}
            bulk_updates = []
            for raw in raw_docs:
                lines = raw.get("transcript_lines") or []
                if not lines:
                    continue
                last_time = lines[-1].get("time") or "" if lines else ""
                secs = 0
                if last_time:
                    try:
                        parts = last_time.split(":")
                        if len(parts) == 2:
                            secs = int(parts[0]) * 60 + int(parts[1])
                        elif len(parts) == 3:
                            secs = int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
                    except Exception:
                        pass
                if secs > 0:
                    duration_map[raw["_id"]] = secs
                    bulk_updates.append(
                        {"_id": raw["_id"], "duration_seconds": secs}
                    )
            for upd in bulk_updates:
                try:
                    await collection.update_one(
                        {"_id": upd["_id"]},
                        {"$set": {"duration_seconds": upd["duration_seconds"]}},
                    )
                except Exception:
                    pass
            for record in records:
                if not record.get("duration_seconds") and record.get("_id") in duration_map:
                    record["duration_seconds"] = duration_map[record["_id"]]
        
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


@router.get("/by-link", response_model=MeetingResponse)
async def get_meeting_by_link(
    link: str = Query(..., description="Meeting link to find"),
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Get a meeting by its link (for current user). Tries exact link then platform+native_meeting_id. Returns 404 if not found."""
    collection = db.meetings
    link_stripped = link.strip()
    record = await collection.find_one({"user_id": current_user.id, "link": link_stripped})
    if not record:
        for platform, extract in [("google_meet", _extract_google_meet_id), ("teams", _extract_teams_meeting_id)]:
            native_id = extract(link_stripped)
            if native_id:
                record = await collection.find_one({
                    "user_id": current_user.id,
                    "platform": platform,
                    "native_meeting_id": native_id,
                })
                if record:
                    break
    if not record:
        raise HTTPException(status_code=404, detail="Meeting not found")
    if "_id" in record:
        record["id"] = str(record["_id"])
        del record["_id"]
    return record


@router.get("/insights/playbook-scores", response_model=PlaybookScoresInsightsResponse)
async def get_playbook_scores_insights(
    days: int = Query(5, ge=1, le=31, description="Number of days in the window."),
    offset_days: int = Query(0, ge=0, description="Shift window back by N days (0 = current period)."),
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Get playbook score aggregates for a window of N days ending `offset_days` ago.
    offset_days=0 → current period; offset_days=N → previous period of same length.
    """
    collection = db.meetings
    now = datetime.utcnow()
    end_date = (now - timedelta(days=offset_days)).date()
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
    days: int = Query(5, ge=1, le=31, description="Number of days in the window."),
    offset_days: int = Query(0, ge=0, description="Shift window back by N days (0 = current period)."),
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Get speaking metrics aggregates for a window of N days ending `offset_days` ago.
    offset_days=0 → current period; offset_days=N → previous period of same length.
    """
    collection = db.meetings
    now = datetime.utcnow()
    end_date = (now - timedelta(days=offset_days)).date()
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


def _extract_seller_answer_from_transcript(transcript_lines: List[dict], question_time: Optional[str]) -> Optional[str]:
    """
    Find the seller's answer that follows a question at `question_time` in the transcript.

    Strategy:
    1. Find the line at or near `question_time` to identify the questioner's speaker name.
    2. Collect the next consecutive turns from a *different* speaker (the rep answering).
    3. If no timestamp match, fall back to gathering the first non-empty turns after the question.
    Falls back to None if not found.
    """
    if not transcript_lines:
        return None

    lines = transcript_lines
    found_idx: Optional[int] = None

    if question_time:
        for i, line in enumerate(lines):
            t = (line.get("time") or "") if isinstance(line, dict) else getattr(line, "time", "")
            if t == question_time:
                found_idx = i
                break

        if found_idx is None:
            def _time_to_sec(t: str) -> int:
                try:
                    parts = t.split(":")
                    if len(parts) == 2:
                        return int(parts[0]) * 60 + int(parts[1])
                    return int(parts[0])
                except Exception:
                    return -1

            q_sec = _time_to_sec(question_time)
            if q_sec >= 0:
                best_diff = 9999
                for i, line in enumerate(lines):
                    t = (line.get("time") or "") if isinstance(line, dict) else getattr(line, "time", "")
                    diff = abs(_time_to_sec(t) - q_sec)
                    if diff < best_diff:
                        best_diff = diff
                        found_idx = i
                if best_diff > 10:
                    found_idx = None

    if found_idx is None:
        return None

    questioner_speaker = ""
    q_line = lines[found_idx]
    questioner_speaker = (q_line.get("speaker") or "") if isinstance(q_line, dict) else getattr(q_line, "speaker", "")

    seller_parts: List[str] = []
    answerer_speaker: Optional[str] = None
    for line in lines[found_idx + 1:]:
        role = ((line.get("role") or "") if isinstance(line, dict) else getattr(line, "role", "")).lower()
        speaker = (line.get("speaker") or "") if isinstance(line, dict) else getattr(line, "speaker", "")
        text = (line.get("text") or "") if isinstance(line, dict) else getattr(line, "text", "")

        is_known_seller = role in ("seller", "sales", "rep", "host") or "seller" in speaker.lower()
        is_different_speaker = speaker and speaker != questioner_speaker

        if not is_known_seller and not is_different_speaker:
            if seller_parts:
                break
            continue

        if answerer_speaker is None:
            answerer_speaker = speaker
        elif speaker != answerer_speaker:
            break

        if text.strip():
            seller_parts.append(text.strip())
        if len(seller_parts) >= 4:
            break

    return " ".join(seller_parts) if seller_parts else None


async def _score_objection_answer(
    question: str,
    user_answer: str,
    suggested_answer: str,
    playbook_rules: Optional[List[str]] = None,
) -> dict:
    """
    Call Groq LLM to evaluate how well the user's answer aligns with the suggested answer
    and, if provided, the active playbook rules.
    Returns: { match_score: int, key_points_covered: list[str], learning_opportunities: list[str] }
    """
    playbook_section = ""
    if playbook_rules:
        rules_text = "\n".join(f"- {r}" for r in playbook_rules)
        playbook_section = f"""
Active sales playbook rules (also evaluate alignment against these):
{rules_text}
"""
    prompt = f"""You are a sales coaching AI. Evaluate how well a sales rep answered a prospect's question compared to the ideal suggested answer.{playbook_section}

Prospect question: {question}

Sales rep's actual answer: {user_answer}

Ideal suggested answer: {suggested_answer}

Return a JSON object with:
- "match_score": integer 0-100 (how well the actual answer aligns with the suggested answer AND playbook rules)
- "key_points_covered": array of short strings (what the rep covered well, max 4 items)
- "learning_opportunities": array of short strings (specific improvements, max 3 items)

Be concise. Key points and learning opportunities should be 5-10 words each."""
    try:
        result = await _call_groq_json(prompt)
        return {
            "match_score": int(result.get("match_score") or 70),
            "key_points_covered": [str(x) for x in (result.get("key_points_covered") or [])],
            "learning_opportunities": [str(x) for x in (result.get("learning_opportunities") or [])],
        }
    except Exception:
        return {"match_score": 70, "key_points_covered": [], "learning_opportunities": []}


_FILLER_PHRASES = {
    "hello", "hi", "hey", "okay", "ok", "yes", "no", "thank you", "thanks",
    "can you hear me", "are you there", "testing", "test", "is this on",
    "good morning", "good afternoon", "good evening", "sorry", "excuse me",
    "um", "uh", "hmm", "right", "sure", "alright", "bye", "goodbye",
}


def _is_filler_question(text: str) -> bool:
    """Return True if the question is a greeting/filler and should be skipped."""
    normalized = (text or "").lower().strip().rstrip("?!.,")
    if not normalized:
        return True
    if normalized in _FILLER_PHRASES:
        return True
    words = normalized.split()
    if len(words) <= 3 and all(w in _FILLER_PHRASES or len(w) <= 2 for w in words):
        return True
    return False


async def _generate_suggested_answer(question: str) -> str:
    """Use LLM to generate a suggested answer when no QnA bank match exists."""
    prompt = f"""You are a professional sales rep. A prospect just asked: "{question}"

Write a concise, helpful suggested answer (1-3 sentences) that a sales rep should give.
Return ONLY the answer text, no JSON, no labels."""
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}", "Content-Type": "application/json"},
                json={
                    "model": "llama-3.1-8b-instant",
                    "messages": [
                        {"role": "system", "content": "You are a helpful sales rep. Answer concisely."},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.3,
                },
            )
            r.raise_for_status()
            data = r.json()
        return (((data or {}).get("choices") or [{}])[0].get("message") or {}).get("content") or ""
    except Exception:
        return ""


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
    - Extracts the seller's actual answer from transcript_lines.
    - Looks up suggested answer from atlas_qna bank by semantic keyword match.
    - Calls LLM to score match_score, key_points_covered, learning_opportunities.
    - Groups by topic, computes % of calls per topic.
    - Persists snapshot and returns.
    """
    meetings_coll = db.meetings
    insights_coll = db.objection_insights
    qna_coll = db.atlas_qna

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
            "transcript_lines": 1,
            "transcript_fetched_at": 1,
            "platform": 1,
            "link": 1,
        },
    )
    docs = await cursor.to_list(length=1000)

    total_calls = len(docs)
    if total_calls == 0:
        await insights_coll.delete_many({"user_id": current_user.id})
        return ObjectionInsightsResponse(
            analyzed_from=start_dt,
            analyzed_to=end_dt,
            total_calls=0,
            topics=[],
            generated_at=now,
        )

    # Load QnA bank for this user (question -> answer lookup)
    qna_bank_cursor = qna_coll.find(
        {"user_id": current_user.id, "answer": {"$exists": True, "$ne": ""}},
        projection={"question": 1, "answer": 1},
    )
    qna_bank_docs = await qna_bank_cursor.to_list(length=2000)
    qna_bank: List[dict] = [{"question": d.get("question", ""), "answer": d.get("answer", "")} for d in qna_bank_docs]

    # Load active/default playbook rules for this user
    playbook_rules: List[str] = []
    try:
        pb_doc = await db.playbook_templates.find_one(
            {"user_id": current_user.id, "is_default": True, "active": True},
            projection={"rules": 1, "prompt": 1},
        )
        if not pb_doc:
            pb_doc = await db.playbook_templates.find_one(
                {"user_id": current_user.id, "active": True},
                projection={"rules": 1, "prompt": 1},
                sort=[("created_at", -1)],
            )
        if pb_doc:
            for rule in (pb_doc.get("rules") or []):
                label = rule.get("label") or ""
                desc = rule.get("description") or ""
                if label:
                    playbook_rules.append(f"{label}: {desc}".strip(": ") if desc else label)
            if pb_doc.get("prompt"):
                playbook_rules.insert(0, pb_doc["prompt"])
    except Exception:
        pass

    def _find_suggested_answer(question: str) -> Optional[str]:
        """Simple keyword overlap lookup in qna_bank."""
        if not qna_bank or not question:
            return None
        q_words = set(question.lower().split())
        best_score = 0
        best_answer = None
        for entry in qna_bank:
            entry_q_words = set((entry["question"] or "").lower().split())
            overlap = len(q_words & entry_q_words)
            if overlap > best_score:
                best_score = overlap
                best_answer = entry["answer"]
        return best_answer if best_score >= 2 else None

    topic_meeting_ids: Dict[str, set] = {}
    topic_questions_map: Dict[str, List[ObjectionQuestionItem]] = {}
    meeting_qna_updates: Dict[str, List[dict]] = {}

    for doc in docs:
        meeting_id = str(doc.get("_id"))
        meeting_title = doc.get("title") or ""
        meeting_created_at = doc.get("created_at")

        transcript_lines: List[dict] = await _fetch_and_cache_transcript(
            doc=doc,
            collection=meetings_coll,
            user_id=current_user.id,
        )

        raw_qna = doc.get("atlas_questions_and_objections") or []
        qna_list = _sanitize_qna(raw_qna)
        if not qna_list:
            try:
                insights = await get_atlas_meeting_insights(
                    meeting_id=meeting_id,
                    force_refresh=bool(transcript_lines),
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
            a_text = (item.get("answer") or "").strip()
            t_text = item.get("time")
            topic = _classify_objection_topic(q_text)

            if _is_filler_question(q_text):
                continue

            user_actual_answer = _extract_seller_answer_from_transcript(transcript_lines, t_text)

            suggested_answer: Optional[str] = _find_suggested_answer(q_text)
            if not suggested_answer and len(a_text) > 5:
                suggested_answer = a_text
            if not suggested_answer:
                suggested_answer = await _generate_suggested_answer(q_text) or None

            scoring: dict = {"match_score": None, "key_points_covered": [], "learning_opportunities": []}
            if suggested_answer:
                answer_for_scoring = user_actual_answer or (a_text if len(a_text) > 5 else None)
                if not answer_for_scoring:
                    scoring = {
                        "match_score": 0,
                        "key_points_covered": [],
                        "learning_opportunities": [f"No answer was recorded for this question. Suggested: {suggested_answer[:120]}"],
                    }
                else:
                    scoring = await _score_objection_answer(
                        q_text, answer_for_scoring, suggested_answer, playbook_rules or None
                    )

            classified_item = {
                "question": q_text,
                "time": t_text,
                "answer": a_text,
                "topic": topic,
                "user_actual_answer": user_actual_answer,
                "suggested_answer": suggested_answer,
                "match_score": scoring.get("match_score"),
                "key_points_covered": scoring.get("key_points_covered", []),
                "learning_opportunities": scoring.get("learning_opportunities", []),
            }
            updated_qna_for_meeting.append(classified_item)

            if topic not in topic_meeting_ids:
                topic_meeting_ids[topic] = set()
            if topic not in topic_questions_map:
                topic_questions_map[topic] = []

            topic_questions_map[topic].append(
                ObjectionQuestionItem(
                    meeting_id=meeting_id,
                    meeting_title=meeting_title,
                    meeting_created_at=meeting_created_at,
                    question=q_text or "",
                    time=t_text,
                    answer=a_text or "",
                    user_actual_answer=user_actual_answer,
                    suggested_answer=suggested_answer,
                    match_score=scoring.get("match_score"),
                    key_points_covered=scoring.get("key_points_covered", []),
                    learning_opportunities=scoring.get("learning_opportunities", []),
                )
            )
            if topic not in seen_topics_for_meeting:
                topic_meeting_ids[topic].add(meeting_id)
                seen_topics_for_meeting.add(topic)

        if updated_qna_for_meeting:
            meeting_qna_updates[meeting_id] = updated_qna_for_meeting

    topics: List[ObjectionTopicInsights] = []
    for topic, questions in topic_questions_map.items():
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

    topics.sort(key=lambda t: t.pct_calls, reverse=True)

    if meeting_qna_updates:
        for mid, qna_items in meeting_qna_updates.items():
            try:
                await meetings_coll.update_one(
                    {"_id": ObjectId(mid), "user_id": current_user.id},
                    {"$set": {"atlas_questions_and_objections": qna_items}},
                )
            except Exception:
                continue

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

    logger.info(f"[TODO] Analyzing for user {current_user.id}, range_type={range_type}, days={days}")
    logger.info(f"[TODO] Query range: {start_dt} to {end_dt}")
    logger.info(f"[TODO] Found {len(docs)} meetings in range")

    total_calls = len(docs)
    items: List[TodoNextStepItem] = []

    for doc in docs:
        meeting_id = str(doc.get("_id"))
        meeting_title = doc.get("title") or ""
        meeting_created_at = doc.get("created_at")
        
        logger.info(f"[TODO] Processing meeting: {meeting_id}, title='{meeting_title}', created_at={meeting_created_at}")

        raw_next = doc.get("atlas_next_steps") or []
        next_steps = _sanitize_next_steps(raw_next)
        logger.info(f"[TODO] Meeting {meeting_id}: has {len(next_steps)} cached next_steps")

        # If there is no cached next steps, try to generate once via existing helper
        if not next_steps:
            try:
                logger.info(f"[TODO] Meeting {meeting_id}: No cached next_steps, calling get_atlas_meeting_insights...")
                insights = await get_atlas_meeting_insights(
                    meeting_id=meeting_id,
                    force_refresh=False,
                    current_user=current_user,
                    db=db,
                )
                next_steps = _sanitize_next_steps([ns.model_dump() for ns in insights.next_steps])
                logger.info(f"[TODO] Meeting {meeting_id}: Generated {len(next_steps)} next_steps from insights")
            except Exception as e:
                logger.warning(f"[TODO] Meeting {meeting_id}: Failed to generate insights: {str(e)}")
                next_steps = []

        if not next_steps:
            logger.info(f"[TODO] Meeting {meeting_id}: Skipping - no next_steps available")
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


class TodoItemUpdateRequest(BaseModel):
    """Request body for updating a todo item status."""
    meeting_id: str
    description: str
    time: Optional[str] = None
    status: Literal["open", "done"]


@router.patch("/insights/todo/item")
async def update_todo_item_status(
    request: TodoItemUpdateRequest,
    range_type: Literal["day", "week"] = Query("week", description="Which snapshot to update: 'day' or 'week'."),
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Update the status of a specific todo item (mark as done/open).
    Identifies item by meeting_id + description + time combination.
    """
    insights_coll = db.todo_insights
    
    # Find the latest snapshot for this user and range_type
    doc = await insights_coll.find_one(
        {"user_id": current_user.id, "range_type": range_type},
        sort=[("generated_at", -1)],
    )
    
    if not doc:
        raise HTTPException(status_code=404, detail="No todo insights found for this range")
    
    items = doc.get("items") or []
    updated = False
    
    for item in items:
        # Match by meeting_id, description, and optionally time
        if (item.get("meeting_id") == request.meeting_id and 
            item.get("description") == request.description and
            (request.time is None or item.get("time") == request.time)):
            item["status"] = request.status
            updated = True
            break
    
    if not updated:
        raise HTTPException(status_code=404, detail="Todo item not found")
    
    # Update the document in database
    await insights_coll.update_one(
        {"_id": doc["_id"]},
        {"$set": {"items": items}}
    )
    
    logger.info(f"[TODO] Updated item status to '{request.status}' for user {current_user.id}")
    
    return {"success": True, "status": request.status}


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

def _native_meeting_id_from_link(link: str, platform: str) -> Optional[str]:
    """Extract canonical meeting ID from link for deduplication."""
    if not link or not platform:
        return None
    if platform == "google_meet":
        return _extract_google_meet_id(link)
    if platform == "teams":
        return _extract_teams_meeting_id(link)
    return None


@router.post("", response_model=MeetingResponse)
async def create_meeting(
    meeting_data: MeetingCreate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create a new meeting. One record per (user_id, platform, native_meeting_id)."""
    try:
        collection = db.meetings
        user_id = current_user.id
        link = (meeting_data.link or "").strip()
        platform = meeting_data.platform.value if hasattr(meeting_data.platform, "value") else meeting_data.platform
        native_id = _native_meeting_id_from_link(link, platform)

        # Dedupe: allow only one meeting per user + same meeting (by link or platform+native_meeting_id)
        existing = None
        if link:
            existing = await collection.find_one({"user_id": user_id, "link": link})
        if not existing and native_id:
            existing = await collection.find_one({
                "user_id": user_id,
                "platform": platform,
                "native_meeting_id": native_id,
            })
        if existing:
            if "_id" in existing:
                existing["id"] = str(existing["_id"])
                del existing["_id"]
            return existing

        record_data = meeting_data.dict()
        record_data["user_id"] = user_id
        record_data["created_at"] = datetime.utcnow()
        record_data["updated_at"] = datetime.utcnow()
        if native_id:
            record_data["native_meeting_id"] = native_id

        result = await collection.insert_one(record_data)
        created_record = await collection.find_one({"_id": result.inserted_id})
        if created_record and "_id" in created_record:
            created_record["id"] = str(created_record["_id"])
            del created_record["_id"]
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

@router.patch("/{meeting_id}/media-urls", response_model=MeetingResponse)
async def update_meeting_media_urls(
    meeting_id: str,
    video_url: Optional[str] = None,
    audio_url: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Update media (video/audio) URLs for a meeting."""
    try:
        collection = db.meetings
        oid = ObjectId(meeting_id)

        existing = await collection.find_one({
            "_id": oid,
            "user_id": current_user.id,
        })
        if not existing:
            raise HTTPException(status_code=404, detail="Meeting not found")

        update_fields: dict = {}
        if video_url is not None:
            update_fields["video_url"] = video_url
        if audio_url is not None:
            update_fields["audio_url"] = audio_url

        if not update_fields:
            raise HTTPException(
                status_code=400,
                detail="At least one of video_url or audio_url must be provided",
            )

        update_fields["updated_at"] = datetime.utcnow()
        await collection.update_one({"_id": oid}, {"$set": update_fields})

        updated = await collection.find_one({"_id": oid})
        if updated and "_id" in updated:
            updated["id"] = str(updated["_id"])
            del updated["_id"]
        return updated
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in update_meeting_media_urls: {e}")
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
    - If meeting is >= 24h old and transcript_lines already exist, return cache (no Vexa)
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

    if _skip_vexa_transcript_refresh(doc, now, cached_lines):
        return MeetingTranscriptionResponse(
            meeting_id=meeting_id,
            source="cache",
            transcript_lines=cached_lines,
            fetched_at=cached_fetched_at,
            message="Meeting is older than 24h with stored transcript; skipped Vexa refresh.",
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
      "detail": "Optimal pace for clarity and engagement",
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
- For each metric, include a "detail" field with a brief explanation (5-10 words) of why the metric value is good, okay, or needs improvement, e.g. "Optimal pace for clarity and engagement" or "Good balance between speaking and listening".
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
    import time as _time
    _t0 = _time.time()
    logger.info(
        f"[Playbook] Starting analysis for meeting={meeting_id}, "
        f"template={template_id} ({template_name}), "
        f"rules={len(rules_input)}, transcript={len(transcript_text)} chars, "
        f"user={current_user.id}"
    )

    ai_result = await analyze_call_against_playbook(
        transcript=transcript_text,
        playbook_name=template_name,
        rules=rules_input,
    )
    _elapsed = round(_time.time() - _t0, 2)

    if not ai_result:
        logger.warning(
            f"[Playbook] Analysis returned None after {_elapsed}s — "
            f"meeting={meeting_id}, template={template_id}, "
            f"user={current_user.id}, transcript={len(transcript_text)} chars"
        )
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

    passed_count = sum(1 for r in rules_out if r.passed)
    logger.info(
        f"[Playbook] Analysis complete in {_elapsed}s — "
        f"meeting={meeting_id}, score={ai_result.get('overall_score')}, "
        f"rules passed={passed_count}/{len(rules_out)}, "
        f"dimensions={dimension_scores or 'none'}"
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


class ReanalyzeMeetingResponse(BaseModel):
    """Response from full meeting reanalysis."""
    meeting_id: str
    insights_regenerated: bool = False
    feedback_regenerated: bool = False
    playbook_regenerated: bool = False
    evaluation_regenerated: bool = False
    smart_summary_regenerated: bool = False
    strategy_regenerated: bool = False
    qna_extracted_count: int = 0
    qna_ids: List[str] = Field(default_factory=list)
    message: str


@router.post("/{meeting_id}/reanalyze", response_model=ReanalyzeMeetingResponse)
async def reanalyze_meeting(
    meeting_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Full re-analysis of a meeting:
    1. Regenerate Atlas Insights (summary, next steps, Q&A) with force_refresh=True
    2. Regenerate Feedback (metrics, coaching) with force_refresh=True
    3. Regenerate Playbook analysis with force_refresh=True
    4. Regenerate Evaluation (outcome, Call Summary, actions) with force_refresh=True
    5. Regenerate Smart Summary with force_refresh=True
    6. Regenerate Next Meeting Strategy (uses fresh evaluation + smart summary)
    7. Extract Q&A from transcript and store in Q&A Engine

    This is triggered by the regenerate control in the meeting detail UI.
    """
    from app.services.qna_engine import extract_qna_from_meeting
    
    collection = db.meetings
    try:
        oid = ObjectId(meeting_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid meeting id format")
    
    doc = await collection.find_one({"_id": oid, "user_id": current_user.id})
    if not doc:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    results = {
        "insights_regenerated": False,
        "feedback_regenerated": False,
        "playbook_regenerated": False,
        "evaluation_regenerated": False,
        "smart_summary_regenerated": False,
        "strategy_regenerated": False,
        "qna_extracted_count": 0,
        "qna_ids": [],
    }

    await _fetch_and_cache_transcript(
        doc=doc,
        collection=collection,
        user_id=current_user.id,
    )
    
    # 1. Regenerate Atlas Insights
    try:
        insights = await get_atlas_meeting_insights(
            meeting_id=meeting_id,
            force_refresh=True,
            current_user=current_user,
            db=db,
        )
        if insights.source in ["llm", "cache"]:
            results["insights_regenerated"] = True
            logger.info(f"[REANALYZE] Meeting {meeting_id}: Insights regenerated")
    except Exception as e:
        logger.warning(f"[REANALYZE] Meeting {meeting_id}: Failed to regenerate insights: {e}")
    
    # 2. Regenerate Feedback
    try:
        feedback = await get_meeting_feedback(
            meeting_id=meeting_id,
            force_refresh=True,
            current_user=current_user,
            db=db,
        )
        if feedback.source in ["llm", "cache"]:
            results["feedback_regenerated"] = True
            logger.info(f"[REANALYZE] Meeting {meeting_id}: Feedback regenerated")
    except Exception as e:
        logger.warning(f"[REANALYZE] Meeting {meeting_id}: Failed to regenerate feedback: {e}")
    
    # 3. Regenerate Playbook Analysis
    try:
        playbook = await get_meeting_playbook_analysis(
            meeting_id=meeting_id,
            force_refresh=True,
            template_id=None,
            current_user=current_user,
            db=db,
        )
        if playbook.source in ["llm", "cache"]:
            results["playbook_regenerated"] = True
            logger.info(f"[REANALYZE] Meeting {meeting_id}: Playbook analysis regenerated")
    except Exception as e:
        logger.warning(f"[REANALYZE] Meeting {meeting_id}: Failed to regenerate playbook: {e}")

    await asyncio.sleep(2.0)

    # 4. Regenerate Evaluation (Call Summary lives in atlas_evaluation.outcome)
    try:
        ev = await get_meeting_evaluation(
            meeting_id=meeting_id,
            force_refresh=True,
            current_user=current_user,
            db=db,
        )
        if ev.source == "llm":
            results["evaluation_regenerated"] = True
            logger.info(f"[REANALYZE] Meeting {meeting_id}: Evaluation regenerated")
    except Exception as e:
        logger.warning(f"[REANALYZE] Meeting {meeting_id}: Failed to regenerate evaluation: {e}")

    # 5. Regenerate Smart Summary
    try:
        sm = await get_meeting_smart_summary(
            meeting_id=meeting_id,
            force_refresh=True,
            current_user=current_user,
            db=db,
        )
        if sm.source in ["llm", "cache"]:
            results["smart_summary_regenerated"] = True
            logger.info(f"[REANALYZE] Meeting {meeting_id}: Smart summary regenerated")
    except Exception as e:
        logger.warning(f"[REANALYZE] Meeting {meeting_id}: Failed to regenerate smart summary: {e}")

    # 6. Regenerate Next Meeting Strategy (reads fresh evaluation + smart summary from DB)
    try:
        st = await get_next_meeting_strategy(
            meeting_id=meeting_id,
            force_refresh=True,
            current_user=current_user,
            db=db,
        )
        if st.source in ["llm", "cache"]:
            results["strategy_regenerated"] = True
            logger.info(f"[REANALYZE] Meeting {meeting_id}: Next meeting strategy regenerated")
    except Exception as e:
        logger.warning(f"[REANALYZE] Meeting {meeting_id}: Failed to regenerate strategy: {e}")
    
    # 7. Extract Q&A from transcript to Q&A Engine
    try:
        user_name = f"{current_user.first_name} {current_user.last_name}".strip() or current_user.email or "Unknown"
        created_qnas = await extract_qna_from_meeting(
            meeting_id=meeting_id,
            user_id=current_user.id,
            user_name=user_name,
        )
        results["qna_extracted_count"] = len(created_qnas)
        results["qna_ids"] = [str(q.get("_id") or q.get("id")) for q in created_qnas if q]
        logger.info(f"[REANALYZE] Meeting {meeting_id}: Extracted {len(created_qnas)} Q&A")
    except Exception as e:
        logger.warning(f"[REANALYZE] Meeting {meeting_id}: Failed to extract Q&A: {e}")
    
    # Build message
    parts = []
    if results["insights_regenerated"]:
        parts.append("insights")
    if results["feedback_regenerated"]:
        parts.append("feedback")
    if results["playbook_regenerated"]:
        parts.append("playbook")
    if results["evaluation_regenerated"]:
        parts.append("evaluation")
    if results["smart_summary_regenerated"]:
        parts.append("smart summary")
    if results["strategy_regenerated"]:
        parts.append("strategy")
    if results["qna_extracted_count"] > 0:
        parts.append(f"{results['qna_extracted_count']} Q&A")
    
    message = f"Re-analyzed: {', '.join(parts)}" if parts else "No data regenerated"
    
    return ReanalyzeMeetingResponse(
        meeting_id=meeting_id,
        insights_regenerated=results["insights_regenerated"],
        feedback_regenerated=results["feedback_regenerated"],
        playbook_regenerated=results["playbook_regenerated"],
        evaluation_regenerated=results["evaluation_regenerated"],
        smart_summary_regenerated=results["smart_summary_regenerated"],
        strategy_regenerated=results["strategy_regenerated"],
        qna_extracted_count=results["qna_extracted_count"],
        qna_ids=results["qna_ids"],
        message=message,
    )


@router.post("/{meeting_id}/next-steps/{index}/toggle")
async def toggle_next_step(
    meeting_id: str,
    index: int,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Toggle the checked state of a specific next-step item in atlas_insights.
    """
    collection = db.meetings
    try:
        oid = ObjectId(meeting_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid meeting id")

    doc = await collection.find_one({"_id": oid, "user_id": current_user.id})
    if not doc:
        raise HTTPException(status_code=404, detail="Meeting not found")

    next_steps = doc.get("atlas_next_steps") or []
    if index < 0 or index >= len(next_steps):
        raise HTTPException(status_code=400, detail="Next step index out of range")

    current_checked = bool(next_steps[index].get("checked", False))
    new_checked = not current_checked

    await collection.update_one(
        {"_id": oid, "user_id": current_user.id},
        {"$set": {f"atlas_next_steps.{index}.checked": new_checked, "updated_at": datetime.utcnow()}},
    )

    return {"success": True, "checked": new_checked}


@router.get("/{meeting_id}/playbook-report")
async def download_playbook_report(
    meeting_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Download the cached playbook analysis as a structured JSON report file.
    """
    collection = db.meetings
    try:
        oid = ObjectId(meeting_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid meeting id")

    doc = await collection.find_one({"_id": oid, "user_id": current_user.id})
    if not doc:
        raise HTTPException(status_code=404, detail="Meeting not found")

    playbook_analysis = doc.get("playbook_analysis")
    if not playbook_analysis:
        raise HTTPException(status_code=404, detail="No playbook analysis found. Run analysis first.")

    report = {
        "report_title": "Playbook Analysis Report",
        "meeting_title": doc.get("title") or doc.get("meeting_title") or "Untitled Meeting",
        "generated_at": datetime.utcnow().isoformat(),
        "template_name": playbook_analysis.get("template_name"),
        "overall_score": playbook_analysis.get("overall_score"),
        "coaching_summary": playbook_analysis.get("coaching_summary"),
        "rules": [
            {
                "label": r.get("label", ""),
                "passed": bool(r.get("passed")),
                "what_you_said": r.get("what_you_said"),
                "what_you_should_say": r.get("what_you_should_say"),
            }
            for r in (playbook_analysis.get("rules") or [])
        ],
        "dimension_scores": playbook_analysis.get("dimension_scores"),
    }

    report_json = json.dumps(report, indent=2, ensure_ascii=False)
    return Response(
        content=report_json,
        media_type="application/json",
        headers={
            "Content-Disposition": f'attachment; filename="playbook-report-{meeting_id}.json"'
        },
    )


# ──────────────────────────────────────────────────────────────────────────────
# Meeting Evaluation endpoint
# ──────────────────────────────────────────────────────────────────────────────

class EvaluationKeyMoment(BaseModel):
    timestamp: str
    type: Literal["positive", "negative", "neutral"]
    description: str


class EvaluationDealProgression(BaseModel):
    from_stage: str = Field(alias="from")
    to_stage: str = Field(alias="to")
    likelihood: Literal["high", "medium", "low"]

    class Config:
        populate_by_name = True


class EvaluationOutcome(BaseModel):
    status: Literal["successful", "neutral", "needs-attention"]
    summary: str
    deal_progression: EvaluationDealProgression
    key_moments: List[EvaluationKeyMoment] = Field(default_factory=list)


class StrategicInsight(BaseModel):
    category: Literal["pain-point", "budget", "decision-maker", "timeline", "competition"]
    insight: str
    confidence: int
    icon: str


class RecommendedAction(BaseModel):
    id: str
    priority: int
    title: str
    description: str
    timing: Literal["immediate", "within-24h", "this-week", "this-month"]
    action_type: Literal["follow-up", "send-material", "schedule-meeting"]
    status: Literal["pending", "completed", "dismissed"] = "pending"


class MeetingEvaluationResponse(BaseModel):
    meeting_id: str
    source: Literal["llm", "cache", "none"] = "none"
    generated_at: Optional[datetime] = None
    playbook_score_pct: Optional[int] = None
    outcome: Optional[EvaluationOutcome] = None
    strategic_insights: List[StrategicInsight] = Field(default_factory=list)
    recommended_actions: List[RecommendedAction] = Field(default_factory=list)
    message: Optional[str] = None


@router.get("/{meeting_id}/evaluation", response_model=MeetingEvaluationResponse)
async def get_meeting_evaluation(
    meeting_id: str,
    force_refresh: bool = Query(False),
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Get AI-powered call evaluation for Atlas Insights / Evaluation tab.
    Produces: call outcome status, deal progression, key moments,
    strategic insights and recommended actions.
    Caches result on the meeting document under 'atlas_evaluation'.
    """
    collection = db.meetings
    try:
        oid = ObjectId(meeting_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid meeting id")

    doc = await collection.find_one({"_id": oid, "user_id": current_user.id})
    if not doc:
        raise HTTPException(status_code=404, detail="Meeting not found")

    cached = doc.get("atlas_evaluation") or {}
    if cached and not force_refresh:
        return MeetingEvaluationResponse(
            meeting_id=meeting_id,
            source="cache",
            generated_at=cached.get("generated_at"),
            playbook_score_pct=cached.get("playbook_score_pct"),
            outcome=EvaluationOutcome(**cached["outcome"]) if cached.get("outcome") else None,
            strategic_insights=[StrategicInsight(**s) for s in (cached.get("strategic_insights") or [])],
            recommended_actions=[RecommendedAction(**a) for a in (cached.get("recommended_actions") or [])],
            message="Returned cached evaluation.",
        )

    transcript_lines = doc.get("transcript_lines") or []
    transcript_text = _build_transcript_text(transcript_lines)
    if not transcript_text.strip():
        transcript_lines = await _fetch_and_cache_transcript(
            doc=doc,
            collection=collection,
            user_id=current_user.id,
        )
        transcript_text = _build_transcript_text(transcript_lines)
    if not transcript_text.strip():
        return MeetingEvaluationResponse(
            meeting_id=meeting_id,
            source="none",
            message="No transcript available to generate evaluation.",
        )

    title = doc.get("title") or doc.get("meeting_title") or "Meeting"
    playbook_score_pct = (doc.get("playbook_analysis") or {}).get("overall_score")

    prompt = f"""You are an expert AI sales coach. Analyze the call transcript below and return a JSON evaluation.

Meeting: {title}

Return JSON with this EXACT structure:
{{
  "outcome": {{
    "status": "successful" | "neutral" | "needs-attention",
    "summary": "2-3 sentence summary of the call outcome addressed to the seller using 'you'",
    "deal_progression": {{
      "from": "intro" | "discovery" | "demo" | "proposal" | "negotiation" | "closed-won" | "closed-lost",
      "to": "intro" | "discovery" | "demo" | "proposal" | "negotiation" | "closed-won" | "closed-lost",
      "likelihood": "high" | "medium" | "low"
    }},
    "key_moments": [
      {{"timestamp": "MM:SS", "type": "positive" | "negative" | "neutral", "description": "One sentence about what happened"}}
    ]
  }},
  "strategic_insights": [
    {{
      "category": "pain-point" | "budget" | "decision-maker" | "timeline" | "competition",
      "insight": "One sentence insight addressed to the seller using 'you'",
      "confidence": 85,
      "icon": "✓" | "💰" | "👤" | "⏱️" | "⚠️"
    }}
  ],
  "recommended_actions": [
    {{
      "id": "action-001",
      "priority": 1,
      "title": "Short action title",
      "description": "One sentence explaining why and how to execute this action",
      "timing": "immediate" | "within-24h" | "this-week" | "this-month",
      "action_type": "follow-up" | "send-material" | "schedule-meeting"
    }}
  ]
}}

Rules:
- Output ONLY valid JSON.
- key_moments: 3-5 moments with timestamps from the transcript.
- strategic_insights: 3-5 insights covering different categories.
- recommended_actions: 2-4 actions ordered by priority (1 = most urgent).
- confidence values: integer 0-100.
- Use timestamps in MM:SS format matching the transcript.

Transcript:
{transcript_text}
""".strip()

    try:
        generated = await _call_groq_json(prompt)
        raw_outcome = generated.get("outcome") or {}
        raw_insights = generated.get("strategic_insights") or []
        raw_actions = generated.get("recommended_actions") or []

        outcome = None
        if raw_outcome:
            try:
                dp_raw = raw_outcome.get("deal_progression") or {}
                dp = EvaluationDealProgression(**{"from": dp_raw.get("from", "intro"), "to": dp_raw.get("to", "discovery"), "likelihood": dp_raw.get("likelihood", "medium")})
                moments = []
                for m in (raw_outcome.get("key_moments") or []):
                    try:
                        moments.append(EvaluationKeyMoment(**m))
                    except Exception:
                        pass
                outcome = EvaluationOutcome(
                    status=raw_outcome.get("status", "neutral"),
                    summary=raw_outcome.get("summary", ""),
                    deal_progression=dp,
                    key_moments=moments,
                )
            except Exception as e:
                logger.warning(f"[Evaluation] Could not parse outcome: {e}")

        strategic_insights = []
        for s in raw_insights:
            try:
                strategic_insights.append(StrategicInsight(**s))
            except Exception:
                pass

        recommended_actions = []
        for i, a in enumerate(raw_actions):
            try:
                if "id" not in a:
                    a["id"] = f"action-{i+1:03d}"
                if "action_type" not in a and "action_type" not in a:
                    a["action_type"] = "follow-up"
                recommended_actions.append(RecommendedAction(**a))
            except Exception:
                pass

        now = datetime.utcnow()
        store = {
            "generated_at": now,
            "playbook_score_pct": playbook_score_pct,
            "outcome": outcome.model_dump(by_alias=True) if outcome else None,
            "strategic_insights": [s.model_dump() for s in strategic_insights],
            "recommended_actions": [a.model_dump() for a in recommended_actions],
        }
        await collection.update_one(
            {"_id": oid, "user_id": current_user.id},
            {"$set": {"atlas_evaluation": store, "updated_at": now}},
        )

        return MeetingEvaluationResponse(
            meeting_id=meeting_id,
            source="llm",
            generated_at=now,
            playbook_score_pct=playbook_score_pct,
            outcome=outcome,
            strategic_insights=strategic_insights,
            recommended_actions=recommended_actions,
            message="Generated evaluation via LLM and cached.",
        )
    except Exception as e:
        logger.error(f"[Evaluation] LLM generation failed: {e}")
        return MeetingEvaluationResponse(
            meeting_id=meeting_id,
            source="none",
            message=f"LLM generation failed: {str(e)}",
        )


# ──────────────────────────────────────────────────────────────────────────────
# Smart Summary endpoint (cross-meeting intelligence)
# ──────────────────────────────────────────────────────────────────────────────

class DealHealthMetric(BaseModel):
    value: int
    trend: Literal["up", "down", "stable"]


class SmartSummaryDealHealth(BaseModel):
    engagement: DealHealthMetric
    momentum: DealHealthMetric
    risk_level: str
    risk_trend: Literal["up", "down", "stable"]
    win_probability: DealHealthMetric


class DealEvolutionMeeting(BaseModel):
    id: str
    date: str
    type: str
    outcome: str
    is_current: bool


class ThenVsNowItem(BaseModel):
    topic: str
    then_date: str
    then_status: str
    then_sentiment: Literal["positive", "negative", "neutral"]
    now_status: str
    now_sentiment: Literal["positive", "negative", "neutral"]
    impact: str
    indicator: Literal["green", "amber", "red", "blue"]


class ChangeAlert(BaseModel):
    id: str
    severity: Literal["critical", "warning", "info", "positive"]
    title: str
    category: str
    previous_state: str
    previous_date: str
    current_state: str
    impact_analysis: str
    recommended_actions: List[str] = Field(default_factory=list)


class TopicTimelineEntry(BaseModel):
    date: str
    quote: str
    sentiment: Literal["positive", "negative", "neutral"]


class EnhancedTopic(BaseModel):
    title: str
    badge: Literal["new", "revisited", "resolved", "shifted", "trending"]
    meeting_count: str
    sentiment_trend: Literal["improving", "declining", "stable"]
    timeline: List[TopicTimelineEntry] = Field(default_factory=list)
    status: str
    next_step: str


class StrategicRecommendation(BaseModel):
    priority: Literal["critical", "important", "opportunity"]
    title: str
    why: str
    impact: str
    timeline: str
    confidence: int


class SmartSummaryResponse(BaseModel):
    meeting_id: str
    source: Literal["llm", "cache", "none"] = "none"
    generated_at: Optional[datetime] = None
    deal_health: Optional[SmartSummaryDealHealth] = None
    deal_evolution: List[DealEvolutionMeeting] = Field(default_factory=list)
    then_vs_now: List[ThenVsNowItem] = Field(default_factory=list)
    change_alerts: List[ChangeAlert] = Field(default_factory=list)
    enhanced_topics: List[EnhancedTopic] = Field(default_factory=list)
    strategic_recommendations: List[StrategicRecommendation] = Field(default_factory=list)
    message: Optional[str] = None


@router.get("/{meeting_id}/smart-summary", response_model=SmartSummaryResponse)
async def get_meeting_smart_summary(
    meeting_id: str,
    force_refresh: bool = Query(False),
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Get cross-meeting Smart Summary intelligence for Atlas Insights / Smart Summary tab.
    Produces: deal health snapshot, deal evolution timeline, then-vs-now comparison,
    change alerts, enhanced discussion topics, strategic recommendations.
    Gathers context from past meetings with the same company/contact to build multi-meeting intel.
    Caches result under 'atlas_smart_summary'.
    """
    collection = db.meetings
    try:
        oid = ObjectId(meeting_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid meeting id")

    doc = await collection.find_one({"_id": oid, "user_id": current_user.id})
    if not doc:
        raise HTTPException(status_code=404, detail="Meeting not found")

    cached = doc.get("atlas_smart_summary") or {}
    if cached and not force_refresh:
        def _parse_deal_health(h):
            if not h:
                return None
            try:
                return SmartSummaryDealHealth(
                    engagement=DealHealthMetric(**h["engagement"]),
                    momentum=DealHealthMetric(**h["momentum"]),
                    risk_level=h.get("risk_level", "Medium"),
                    risk_trend=h.get("risk_trend", "stable"),
                    win_probability=DealHealthMetric(**h["win_probability"]),
                )
            except Exception:
                return None

        return SmartSummaryResponse(
            meeting_id=meeting_id,
            source="cache",
            generated_at=cached.get("generated_at"),
            deal_health=_parse_deal_health(cached.get("deal_health")),
            deal_evolution=[DealEvolutionMeeting(**m) for m in (cached.get("deal_evolution") or [])],
            then_vs_now=[ThenVsNowItem(**t) for t in (cached.get("then_vs_now") or [])],
            change_alerts=[ChangeAlert(**a) for a in (cached.get("change_alerts") or [])],
            enhanced_topics=[EnhancedTopic(**t) for t in (cached.get("enhanced_topics") or [])],
            strategic_recommendations=[StrategicRecommendation(**r) for r in (cached.get("strategic_recommendations") or [])],
            message="Returned cached smart summary.",
        )

    transcript_lines = doc.get("transcript_lines") or []
    transcript_text = _build_transcript_text(transcript_lines)
    if not transcript_text.strip():
        transcript_lines = await _fetch_and_cache_transcript(
            doc=doc,
            collection=collection,
            user_id=current_user.id,
        )
        transcript_text = _build_transcript_text(transcript_lines)
    if not transcript_text.strip():
        return SmartSummaryResponse(
            meeting_id=meeting_id,
            source="none",
            message="No transcript available to generate smart summary.",
        )

    title = doc.get("title") or doc.get("meeting_title") or "Meeting"
    created_at = doc.get("created_at") or doc.get("start_time") or datetime.utcnow()
    meeting_date = created_at.strftime("%b %d") if isinstance(created_at, datetime) else str(created_at)[:10]

    participants_raw = doc.get("participants") or doc.get("attendees") or []
    company_name = ""
    if isinstance(participants_raw, list) and participants_raw:
        first = participants_raw[0] if isinstance(participants_raw[0], dict) else {}
        company_name = first.get("company", "")

    past_meetings_context = ""
    past_cursor = collection.find(
        {
            "user_id": current_user.id,
            "_id": {"$ne": oid},
        },
        sort=[("created_at", -1)],
        limit=5,
    )
    past_docs = await past_cursor.to_list(length=5)
    past_summaries = []
    for p in past_docs:
        p_title = p.get("title") or p.get("meeting_title") or "Past meeting"
        p_date = p.get("created_at") or p.get("start_time")
        p_date_str = p_date.strftime("%b %d") if isinstance(p_date, datetime) else "Earlier"
        p_insights = p.get("atlas_summary") or {}
        p_takeaways = (p_insights.get("key_takeaways") or [])[:3]
        p_next = p.get("atlas_next_steps") or []
        p_next_desc = [n.get("description", "") for n in p_next[:2]]
        summary_text = f"Meeting ({p_date_str}): {p_title}"
        if p_takeaways:
            summary_text += f"\n  Key points: {'; '.join(p_takeaways)}"
        if p_next_desc:
            summary_text += f"\n  Next steps agreed: {'; '.join(p_next_desc)}"
        past_summaries.append(summary_text)

    if past_summaries:
        past_meetings_context = "PAST MEETINGS WITH THIS PROSPECT:\n" + "\n\n".join(past_summaries)
    else:
        past_meetings_context = "No previous meeting history available."

    prompt = f"""You are an expert AI sales intelligence analyst. Analyze the current meeting transcript and past meeting history to generate a cross-meeting Smart Summary.

Current Meeting: {title} ({meeting_date})
{past_meetings_context}

Current Meeting Transcript:
{transcript_text}

Return JSON with this EXACT structure:
{{
  "deal_health": {{
    "engagement": {{"value": 75, "trend": "up" | "down" | "stable"}},
    "momentum": {{"value": 65, "trend": "up" | "down" | "stable"}},
    "risk_level": "Low" | "Medium" | "High",
    "risk_trend": "up" | "down" | "stable",
    "win_probability": {{"value": 70, "trend": "up" | "down" | "stable"}}
  }},
  "deal_evolution": [
    {{"id": "m1", "date": "Feb 15", "type": "Cold Outreach", "outcome": "Brief outcome", "is_current": false}},
    {{"id": "m2", "date": "Today", "type": "Discovery", "outcome": "ROI session agreed", "is_current": true}}
  ],
  "then_vs_now": [
    {{
      "topic": "Budget Status",
      "then_date": "Feb 28",
      "then_status": "Budget confirmed",
      "then_sentiment": "positive" | "negative" | "neutral",
      "now_status": "Needs re-confirmation",
      "now_sentiment": "positive" | "negative" | "neutral",
      "impact": "Deal risk increased",
      "indicator": "green" | "amber" | "red" | "blue"
    }}
  ],
  "change_alerts": [
    {{
      "id": "ca1",
      "severity": "critical" | "warning" | "info" | "positive",
      "title": "Alert title",
      "category": "Budget" | "Technical" | "Stakeholder" | "Competition" | "Timeline",
      "previous_state": "What was said before",
      "previous_date": "Mar 1",
      "current_state": "What changed now",
      "impact_analysis": "One sentence on business impact",
      "recommended_actions": ["Action 1", "Action 2"]
    }}
  ],
  "enhanced_topics": [
    {{
      "title": "Current Challenges",
      "badge": "new" | "revisited" | "resolved" | "shifted" | "trending",
      "meeting_count": "Discussed in 2 of 3 meetings",
      "sentiment_trend": "improving" | "declining" | "stable",
      "timeline": [
        {{"date": "Feb 28", "quote": "Short quote from that meeting", "sentiment": "positive" | "negative" | "neutral"}}
      ],
      "status": "One sentence status",
      "next_step": "One sentence next step"
    }}
  ],
  "strategic_recommendations": [
    {{
      "priority": "critical" | "important" | "opportunity",
      "title": "Short title",
      "why": "One sentence reason",
      "impact": "One sentence impact",
      "timeline": "e.g. Within 48 hours",
      "confidence": 85
    }}
  ]
}}

Rules:
- Output ONLY valid JSON.
- deal_health values: integers 0-100.
- Derive deal_evolution from past meeting history + current meeting.
- then_vs_now: compare key signals from past vs current meeting (2-4 items).
- change_alerts: only include if a real change was detected (0-3 alerts).
- enhanced_topics: 2-4 discussion topics with cross-meeting timeline.
- strategic_recommendations: 2-4 items ordered by priority.
- confidence values: integer 0-100.
""".strip()

    try:
        generated = await _call_groq_json(prompt)

        def _parse_health(h):
            if not h:
                return None
            try:
                return SmartSummaryDealHealth(
                    engagement=DealHealthMetric(**h.get("engagement", {"value": 70, "trend": "stable"})),
                    momentum=DealHealthMetric(**h.get("momentum", {"value": 60, "trend": "stable"})),
                    risk_level=h.get("risk_level", "Medium"),
                    risk_trend=h.get("risk_trend", "stable"),
                    win_probability=DealHealthMetric(**h.get("win_probability", {"value": 65, "trend": "stable"})),
                )
            except Exception:
                return None

        deal_health = _parse_health(generated.get("deal_health"))

        deal_evolution = []
        for m in (generated.get("deal_evolution") or []):
            try:
                deal_evolution.append(DealEvolutionMeeting(**m))
            except Exception:
                pass

        then_vs_now = []
        for t in (generated.get("then_vs_now") or []):
            try:
                then_vs_now.append(ThenVsNowItem(**t))
            except Exception:
                pass

        change_alerts = []
        for a in (generated.get("change_alerts") or []):
            try:
                change_alerts.append(ChangeAlert(**a))
            except Exception:
                pass

        enhanced_topics = []
        for t in (generated.get("enhanced_topics") or []):
            try:
                tl = [TopicTimelineEntry(**e) for e in (t.get("timeline") or [])]
                t["timeline"] = tl
                enhanced_topics.append(EnhancedTopic(**t))
            except Exception:
                pass

        strategic_recommendations = []
        for r in (generated.get("strategic_recommendations") or []):
            try:
                strategic_recommendations.append(StrategicRecommendation(**r))
            except Exception:
                pass

        now = datetime.utcnow()

        def _dhm(h: Optional[SmartSummaryDealHealth]):
            if not h:
                return None
            return {
                "engagement": h.engagement.model_dump(),
                "momentum": h.momentum.model_dump(),
                "risk_level": h.risk_level,
                "risk_trend": h.risk_trend,
                "win_probability": h.win_probability.model_dump(),
            }

        store = {
            "generated_at": now,
            "deal_health": _dhm(deal_health),
            "deal_evolution": [m.model_dump() for m in deal_evolution],
            "then_vs_now": [t.model_dump() for t in then_vs_now],
            "change_alerts": [a.model_dump() for a in change_alerts],
            "enhanced_topics": [t.model_dump() for t in enhanced_topics],
            "strategic_recommendations": [r.model_dump() for r in strategic_recommendations],
        }
        await collection.update_one(
            {"_id": oid, "user_id": current_user.id},
            {"$set": {"atlas_smart_summary": store, "updated_at": now}},
        )

        return SmartSummaryResponse(
            meeting_id=meeting_id,
            source="llm",
            generated_at=now,
            deal_health=deal_health,
            deal_evolution=deal_evolution,
            then_vs_now=then_vs_now,
            change_alerts=change_alerts,
            enhanced_topics=enhanced_topics,
            strategic_recommendations=strategic_recommendations,
            message="Generated smart summary via LLM and cached.",
        )
    except Exception as e:
        logger.error(f"[SmartSummary] LLM generation failed: {e}")
        return SmartSummaryResponse(
            meeting_id=meeting_id,
            source="none",
            message=f"LLM generation failed: {str(e)}",
        )


# ──────────────────────────────────────────────────────────────────────────────
# Strategy Next Meeting endpoint
# ──────────────────────────────────────────────────────────────────────────────

class NextMeetingStrategyRequest(BaseModel):
    meeting_id: Optional[str] = None
    context_hint: Optional[str] = None


class NextMeetingStrategySection(BaseModel):
    title: str
    points: List[str]


class NextMeetingStrategyResponse(BaseModel):
    meeting_id: Optional[str] = None
    source: Literal["llm", "cache", "none"] = "none"
    generated_at: Optional[datetime] = None
    objective: Optional[str] = None
    opening_script: Optional[str] = None
    key_talking_points: List[str] = Field(default_factory=list)
    objection_handling: List[dict] = Field(default_factory=list)
    closing_move: Optional[str] = None
    message: Optional[str] = None


@router.post("/{meeting_id}/strategy-next-meeting", response_model=NextMeetingStrategyResponse)
async def get_next_meeting_strategy(
    meeting_id: str,
    force_refresh: bool = Query(False),
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Generate AI-powered strategy for the next meeting based on the current meeting transcript,
    evaluation, and smart summary. Caches result under 'atlas_next_meeting_strategy'.
    """
    collection = db.meetings
    try:
        oid = ObjectId(meeting_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid meeting id")

    doc = await collection.find_one({"_id": oid, "user_id": current_user.id})
    if not doc:
        raise HTTPException(status_code=404, detail="Meeting not found")

    cached = doc.get("atlas_next_meeting_strategy") or {}
    if cached and not force_refresh:
        return NextMeetingStrategyResponse(
            meeting_id=meeting_id,
            source="cache",
            generated_at=cached.get("generated_at"),
            objective=cached.get("objective"),
            opening_script=cached.get("opening_script"),
            key_talking_points=cached.get("key_talking_points") or [],
            objection_handling=cached.get("objection_handling") or [],
            closing_move=cached.get("closing_move"),
            message="Returned cached strategy.",
        )

    transcript_lines = doc.get("transcript_lines") or []
    transcript_text = _build_transcript_text(transcript_lines)
    if not transcript_text.strip():
        transcript_lines = await _fetch_and_cache_transcript(
            doc=doc,
            collection=collection,
            user_id=current_user.id,
        )
        transcript_text = _build_transcript_text(transcript_lines)
    if not transcript_text.strip():
        return NextMeetingStrategyResponse(
            meeting_id=meeting_id,
            source="none",
            message="No transcript available to generate strategy.",
        )

    title = doc.get("title") or doc.get("meeting_title") or "Meeting"
    evaluation = doc.get("atlas_evaluation") or {}
    smart_summary = doc.get("atlas_smart_summary") or {}

    eval_summary = (evaluation.get("outcome") or {}).get("summary", "")
    recommended_actions = evaluation.get("recommended_actions") or []
    actions_text = "; ".join([a.get("title", "") for a in recommended_actions[:3]])
    strategic_recs = smart_summary.get("strategic_recommendations") or []
    recs_text = "; ".join([r.get("title", "") for r in strategic_recs[:3]])
    change_alerts = smart_summary.get("change_alerts") or []
    alerts_text = "; ".join([a.get("title", "") for a in change_alerts[:3]])

    prompt = f"""You are an expert AI sales strategist. Based on a completed sales meeting, generate a concrete strategy guide for the NEXT meeting with the same prospect.

Meeting: {title}

Call outcome: {eval_summary or 'Not available'}
Recommended actions: {actions_text or 'None'}
Strategic priorities: {recs_text or 'None'}
Risk alerts to address: {alerts_text or 'None'}

Transcript excerpt:
{transcript_text[:2000]}

Return JSON with this EXACT structure:
{{
  "objective": "Single sentence: the primary goal of the next meeting",
  "opening_script": "2-3 sentence natural opener that references the last conversation and sets the new agenda",
  "key_talking_points": [
    "Talking point 1",
    "Talking point 2",
    "Talking point 3",
    "Talking point 4"
  ],
  "objection_handling": [
    {{
      "objection": "Likely objection 1",
      "response": "Recommended response"
    }},
    {{
      "objection": "Likely objection 2",
      "response": "Recommended response"
    }}
  ],
  "closing_move": "Specific closing technique or next step to secure at the end of the meeting"
}}"""

    try:
        result = await _call_groq_json(prompt)
        now = datetime.utcnow()

        objective = result.get("objective") or ""
        opening_script = result.get("opening_script") or ""
        key_talking_points = result.get("key_talking_points") or []
        objection_handling = result.get("objection_handling") or []
        closing_move = result.get("closing_move") or ""

        store = {
            "generated_at": now,
            "objective": objective,
            "opening_script": opening_script,
            "key_talking_points": key_talking_points,
            "objection_handling": objection_handling,
            "closing_move": closing_move,
        }
        await collection.update_one(
            {"_id": oid, "user_id": current_user.id},
            {"$set": {"atlas_next_meeting_strategy": store, "updated_at": now}},
        )

        return NextMeetingStrategyResponse(
            meeting_id=meeting_id,
            source="llm",
            generated_at=now,
            objective=objective,
            opening_script=opening_script,
            key_talking_points=key_talking_points,
            objection_handling=objection_handling,
            closing_move=closing_move,
            message="Generated next meeting strategy via LLM.",
        )
    except Exception as e:
        logger.error(f"[NextMeetingStrategy] LLM generation failed: {e}")
        return NextMeetingStrategyResponse(
            meeting_id=meeting_id,
            source="none",
            message=f"LLM generation failed: {str(e)}",
        )


@router.patch("/{meeting_id}/link-calendar-event")
async def link_calendar_event(
    meeting_id: str,
    calendar_event_id: str = Query(..., description="Google Calendar event ID to link"),
    calendar_event_title: Optional[str] = Query(None, description="Calendar event title"),
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Link a Google Calendar event to a meeting document."""
    collection = db.meetings
    try:
        oid = ObjectId(meeting_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid meeting id")

    doc = await collection.find_one({"_id": oid, "user_id": current_user.id})
    if not doc:
        raise HTTPException(status_code=404, detail="Meeting not found")

    update: dict = {
        "calendar_event_id": calendar_event_id,
        "updated_at": datetime.utcnow(),
    }
    if calendar_event_title:
        update["calendar_event_title"] = calendar_event_title

    await collection.update_one({"_id": oid, "user_id": current_user.id}, {"$set": update})
    return {"ok": True, "meeting_id": meeting_id, "calendar_event_id": calendar_event_id}
