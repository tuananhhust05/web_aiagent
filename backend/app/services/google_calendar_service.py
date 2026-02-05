"""
Google Calendar OAuth and API: calendar-only scope, refresh_token storage, Calendar API calls.
"""
import httpx
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from bson import ObjectId
from app.core.config import settings
from app.core.database import get_database
from app.services.calendar_crypto import encrypt_refresh_token, decrypt_refresh_token
import logging

logger = logging.getLogger(__name__)


async def _find_user_by_id(db, user_id: str):
    """Find user by _id trying both string and ObjectId so we match regardless of storage type."""
    uid_str = str(user_id) if user_id else ""
    user = await db.users.find_one({"_id": uid_str})
    if user:
        return user
    if len(uid_str) == 24 and all(c in "0123456789abcdefABCDEF" for c in uid_str):
        try:
            user = await db.users.find_one({"_id": ObjectId(uid_str)})
            if user:
                return user
        except Exception:
            pass
    return None

# Calendar-only scope (no openid, email, profile)
GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3"


def get_calendar_redirect_uri() -> str:
    """Redirect URI for Google Calendar OAuth callback (frontend or backend URL)."""
    if settings.GOOGLE_CALENDAR_REDIRECT_URI:
        uri = settings.GOOGLE_CALENDAR_REDIRECT_URI
        logger.info("[Calendar OAuth] redirect_uri (from GOOGLE_CALENDAR_REDIRECT_URI): %s", uri)
        return uri
    base = settings.GOOGLE_REDIRECT_URI or ""
    if "/auth/google/callback" in base:
        uri = base.replace("/auth/google/callback", "/auth/google/calendar/callback")
    else:
        uri = base.rstrip("/") + "/auth/google/calendar/callback"
    logger.info("[Calendar OAuth] redirect_uri (derived): %s", uri)
    return uri


def get_calendar_auth_url(state: str) -> str:
    """
    Generate Google OAuth URL for Calendar only: scope=calendar.events, access_type=offline, prompt=consent.
    No openid, email, profile.
    """
    redirect_uri = get_calendar_redirect_uri()
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "scope": GOOGLE_CALENDAR_SCOPE,
        "response_type": "code",
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return f"https://accounts.google.com/o/oauth2/auth?{query}"


async def exchange_code_for_calendar_token(code: str) -> Dict[str, Any]:
    """
    Exchange authorization code for tokens. Returns dict with access_token, refresh_token, etc.
    Uses calendar callback redirect_uri (must match the redirect_uri used in the auth request).
    """
    redirect_uri = get_calendar_redirect_uri()
    logger.info("[Calendar OAuth] Exchanging code: redirect_uri=%s", redirect_uri)
    async with httpx.AsyncClient() as client:
        response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=30.0,
        )
        if not response.is_success:
            logger.error(
                "[Calendar OAuth] Token exchange failed: status=%s, body=%s",
                response.status_code, response.text,
            )
            raise ValueError(f"Token exchange failed: {response.text}")
        data = response.json()
        logger.info(
            "[Calendar OAuth] Token exchange OK: has_access_token=%s, has_refresh_token=%s",
            "access_token" in data, "refresh_token" in data,
        )
        return data


async def get_calendar_access_token(user_id: str) -> Optional[str]:
    """
    Get valid access_token for Calendar API using stored refresh_token.
    On 401/403 from Google, sets google_calendar_connected=False and returns None.
    """
    db = get_database()
    user = await _find_user_by_id(db, user_id)
    if not user:
        return None
    raw = user.get("google_calendar_refresh_token")
    if not raw:
        return None
    refresh_token = decrypt_refresh_token(raw)
    if not refresh_token:
        return None
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                GOOGLE_TOKEN_URL,
                data={
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "refresh_token": refresh_token,
                    "grant_type": "refresh_token",
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=30.0,
            )
            if response.status_code != 200:
                logger.warning("Calendar refresh token failed for user %s: %s", user_id, response.text)
                await db.users.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"google_calendar_connected": False, "updated_at": datetime.utcnow()}},
                )
                return None
            data = response.json()
            return data.get("access_token")
    except Exception as e:
        logger.exception("Calendar get_calendar_access_token error: %s", e)
        return None


async def list_calendar_events(
    user_id: str,
    time_min: Optional[datetime] = None,
    time_max: Optional[datetime] = None,
) -> List[Dict[str, Any]]:
    """
    List events from user's primary calendar. Uses refresh_token -> access_token -> Calendar API.
    On 401/403 sets google_calendar_connected=False and raises.
    """
    access_token = await get_calendar_access_token(user_id)
    if not access_token:
        return []
    params: Dict[str, str] = {
        "singleEvents": "true",
        "orderBy": "startTime",
    }
    if time_min:
        ts = time_min.isoformat()
        if time_min.tzinfo is None:
            ts += "Z"
        params["timeMin"] = ts
    if time_max:
        ts = time_max.isoformat()
        if time_max.tzinfo is None:
            ts += "Z"
        params["timeMax"] = ts
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{GOOGLE_CALENDAR_API_BASE}/calendars/primary/events",
            params=params,
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=30.0,
        )
        if response.status_code in (401, 403):
            db = get_database()
            user = await _find_user_by_id(db, user_id)
            if user:
                await db.users.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"google_calendar_connected": False, "updated_at": datetime.utcnow()}},
                )
            logger.warning("Calendar API 401/403 for user %s - disconnected", user_id)
            return []
        if not response.is_success:
            logger.error("Calendar API error %s: %s", response.status_code, response.text)
            return []
        data = response.json()
        return data.get("items", [])
