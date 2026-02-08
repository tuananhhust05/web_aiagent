"""
Proxy for Vexa AI API (meeting bots + transcripts).
All Vexa calls go through this router so the API key stays on the server.
VEXA_API_BASE and VEXA_API_KEY are loaded from .env via app.core.config.settings.
"""
import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.core.auth import get_current_active_user
from app.core.config import settings
from app.models.user import UserResponse

router = APIRouter()


class VexaBotJoinBody(BaseModel):
    platform: str = Field(..., description="google_meet or teams")
    native_meeting_id: str = Field(..., description="Meeting ID from link")
    bot_name: str = Field(default="MyMeetingBot", description="Bot display name")
    passcode: str | None = Field(None, description="Required for Teams")


@router.post("/bots")
async def vexa_bots_join(
    body: VexaBotJoinBody,
    current_user: UserResponse = Depends(get_current_active_user),
):
    """
    Proxy POST to Vexa /bots (join Google Meet or Teams with bot).
    Body is forwarded as-is; X-API-Key is added from settings.
    """
    if not settings.VEXA_API_KEY or not settings.VEXA_API_BASE:
        raise HTTPException(
            status_code=503,
            detail="Vexa API is not configured (VEXA_API_KEY / VEXA_API_BASE in .env)",
        )
    url = f"{settings.VEXA_API_BASE.rstrip('/')}/bots"
    payload = body.model_dump(exclude_none=True)
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            url,
            json=payload,
            headers={
                "X-API-Key": settings.VEXA_API_KEY,
                "Content-Type": "application/json",
            },
        )
    if r.status_code >= 400:
        try:
            detail = r.json()
        except Exception:
            detail = r.text
        raise HTTPException(status_code=r.status_code, detail=detail)
    try:
        return r.json()
    except Exception:
        return {"status": r.status_code}


@router.get("/transcripts/google_meet/{meeting_id}")
async def vexa_transcript_google_meet(
    meeting_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
):
    """Proxy GET to Vexa transcripts for Google Meet."""
    if not settings.VEXA_API_KEY or not settings.VEXA_API_BASE:
        raise HTTPException(
            status_code=503,
            detail="Vexa API is not configured (VEXA_API_KEY / VEXA_API_BASE in .env)",
        )
    url = f"{settings.VEXA_API_BASE.rstrip('/')}/transcripts/google_meet/{meeting_id}"
    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.get(url, headers={"X-API-Key": settings.VEXA_API_KEY})
    if r.status_code >= 400:
        try:
            detail = r.json()
        except Exception:
            detail = r.text
        raise HTTPException(status_code=r.status_code, detail=detail)
    try:
        return r.json()
    except Exception:
        return {}


@router.get("/transcripts/teams/{meeting_id}")
async def vexa_transcript_teams(
    meeting_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
):
    """Proxy GET to Vexa transcripts for Teams."""
    if not settings.VEXA_API_KEY or not settings.VEXA_API_BASE:
        raise HTTPException(
            status_code=503,
            detail="Vexa API is not configured (VEXA_API_KEY / VEXA_API_BASE in .env)",
        )
    url = f"{settings.VEXA_API_BASE.rstrip('/')}/transcripts/teams/{meeting_id}"
    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.get(url, headers={"X-API-Key": settings.VEXA_API_KEY})
    if r.status_code >= 400:
        try:
            detail = r.json()
        except Exception:
            detail = r.text
        raise HTTPException(status_code=r.status_code, detail=detail)
    try:
        return r.json()
    except Exception:
        return {}
