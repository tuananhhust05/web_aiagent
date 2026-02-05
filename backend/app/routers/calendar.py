"""
Google Calendar integration: status, connect URL, events.
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query, HTTPException
from app.core.auth import get_current_active_user, create_access_token, _find_user_by_id
from app.core.database import get_database
from app.models.user import UserResponse
from app.services.google_calendar_service import (
    get_calendar_auth_url,
    get_calendar_redirect_uri,
    exchange_code_for_calendar_token,
    list_calendar_events,
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/status")
async def get_calendar_status(
    current_user: UserResponse = Depends(get_current_active_user),
):
    """
    GET /api/user/calendar/status
    Returns { "connected": true | false }
    """
    db = get_database()
    user_id_str = str(current_user.id)
    user = await _find_user_by_id(db, user_id_str)
    if not user:
        logger.warning("[Calendar] get_status: user not found for id=%s", user_id_str)
        raise HTTPException(status_code=404, detail="User not found")
    connected = bool(user.get("google_calendar_connected"))
    logger.info("[Calendar] get_status: user_id=%s, google_calendar_connected=%s", user_id_str, connected)
    return {"connected": connected}


@router.get("/auth-url")
async def get_calendar_auth_url_endpoint(
    current_user: UserResponse = Depends(get_current_active_user),
    redirect_origin: str | None = Query(None, description="Frontend origin to redirect after OAuth (e.g. http://localhost:5173)"),
):
    """
    GET /api/user/calendar/auth-url
    Returns { "url": "https://accounts.google.com/o/oauth2/auth?..." }.
    Frontend redirects user to this URL to connect Google Calendar.
    Pass redirect_origin so callback redirects back to same origin + /atlas/calendar.
    """
    state_data = {"sub": str(current_user.id), "purpose": "calendar_connect"}
    if redirect_origin and redirect_origin.strip():
        state_data["redirect_origin"] = redirect_origin.strip()
    logger.info(
        "[Calendar OAuth] auth-url: user_id=%s, redirect_origin=%s",
        current_user.id, state_data.get("redirect_origin"),
    )
    state = create_access_token(
        data=state_data,
        expires_delta=timedelta(minutes=10),
    )
    url = get_calendar_auth_url(state=state)
    logger.info("[Calendar OAuth] auth-url: redirect_uri (in Google request)=%s", get_calendar_redirect_uri())
    return {"url": url}


@router.get("/events")
async def get_calendar_events(
    current_user: UserResponse = Depends(get_current_active_user),
    time_min: str | None = Query(None, description="ISO datetime for range start"),
    time_max: str | None = Query(None, description="ISO datetime for range end"),
):
    """
    GET /api/user/calendar/events?time_min=...&time_max=...
    Returns list of calendar events from user's primary calendar.
    """
    user_id = str(current_user.id)
    dt_min = None
    dt_max = None
    if time_min:
        try:
            dt_min = datetime.fromisoformat(time_min.replace("Z", "+00:00"))
        except ValueError:
            pass
    if time_max:
        try:
            dt_max = datetime.fromisoformat(time_max.replace("Z", "+00:00"))
        except ValueError:
            pass
    events = await list_calendar_events(user_id, time_min=dt_min, time_max=dt_max)
    return {"events": events}


def _event_has_meeting_link(event: dict) -> bool:
    """True if event has hangoutLink or conferenceData entry point URI."""
    if event.get("hangoutLink"):
        return True
    entry_points = (event.get("conferenceData") or {}).get("entryPoints") or []
    return any(ep.get("uri") for ep in entry_points)


@router.get("/events-with-meeting-link")
async def get_calendar_events_with_meeting_link(
    current_user: UserResponse = Depends(get_current_active_user),
    time_min: str | None = Query(None, description="ISO datetime for range start"),
    time_max: str | None = Query(None, description="ISO datetime for range end"),
):
    """
    GET /api/user/calendar/events-with-meeting-link?time_min=...&time_max=...
    Returns calendar events that have a meeting link (hangoutLink or conferenceData.entryPoints).
    """
    user_id = str(current_user.id)
    dt_min = None
    dt_max = None
    if time_min:
        try:
            dt_min = datetime.fromisoformat(time_min.replace("Z", "+00:00"))
        except ValueError:
            pass
    if time_max:
        try:
            dt_max = datetime.fromisoformat(time_max.replace("Z", "+00:00"))
        except ValueError:
            pass
    events = await list_calendar_events(user_id, time_min=dt_min, time_max=dt_max)
    filtered = [e for e in events if _event_has_meeting_link(e)]
    return {"events": filtered}
