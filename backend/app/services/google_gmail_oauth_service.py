"""
Google Gmail OAuth and API: gmail scope, refresh_token storage.
Similar to google_calendar_service but for Gmail permissions.
"""
import httpx
from datetime import datetime
from typing import Optional, Dict, Any
from urllib.parse import urlencode
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


# Gmail modify scope: read, send, delete, manage labels (not full access)
# This allows reading emails AND sending emails on behalf of the user
GOOGLE_GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.modify"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"


def get_gmail_redirect_uri() -> str:
    """Redirect URI for Google Gmail OAuth: Google redirects to FRONTEND, then frontend forwards to backend."""
    custom = getattr(settings, "GOOGLE_GMAIL_REDIRECT_URI", None) or ""
    if custom.strip():
        logger.info("[Gmail OAuth] redirect_uri (from GOOGLE_GMAIL_REDIRECT_URI): %s", custom)
        return custom.strip().rstrip("/")
    frontend_base = getattr(settings, "FRONTEND_URL", "https://forskale.com").rstrip("/")
    uri = f"{frontend_base}/auth/google/gmail/callback"
    logger.info("[Gmail OAuth] redirect_uri (frontend): %s", uri)
    return uri


def get_gmail_auth_url(state: str) -> str:
    """
    Generate Google OAuth URL for Gmail: scope=gmail.modify (read+send), access_type=offline, prompt=consent.
    """
    redirect_uri = get_gmail_redirect_uri()
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "scope": GOOGLE_GMAIL_SCOPE,
        "response_type": "code",
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }
    query = urlencode(params)
    auth_url = f"https://accounts.google.com/o/oauth2/auth?{query}"
    logger.info("[Gmail OAuth] Generated auth URL with scope: %s, redirect_uri: %s", GOOGLE_GMAIL_SCOPE, redirect_uri)
    return auth_url


async def exchange_code_for_gmail_token(code: str) -> Dict[str, Any]:
    """
    Exchange authorization code for tokens. Returns dict with access_token, refresh_token, etc.
    Uses gmail callback redirect_uri (must match the redirect_uri used in the auth request).
    """
    redirect_uri = get_gmail_redirect_uri()
    logger.info("[Gmail OAuth] Exchanging code: redirect_uri=%s", redirect_uri)
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
                "[Gmail OAuth] Token exchange failed: status=%s, body=%s",
                response.status_code, response.text,
            )
            raise ValueError(f"Token exchange failed: {response.text}")
        data = response.json()
        logger.info(
            "[Gmail OAuth] Token exchange OK: has_access_token=%s, has_refresh_token=%s",
            "access_token" in data, "refresh_token" in data,
        )
        return data


async def get_gmail_access_token(user_id: str) -> Optional[str]:
    """
    Get valid access_token for Gmail API using stored refresh_token.
    On 401/403 from Google, sets google_gmail_connected=False and returns None.
    """
    db = get_database()
    user = await _find_user_by_id(db, user_id)
    if not user:
        return None
    raw = user.get("google_gmail_refresh_token")
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
                logger.warning("Gmail refresh token failed for user %s: %s", user_id, response.text)
                await db.users.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"google_gmail_connected": False, "updated_at": datetime.utcnow()}},
                )
                return None
            data = response.json()
            return data.get("access_token")
    except Exception as e:
        logger.exception("Gmail get_gmail_access_token error: %s", e)
        return None
