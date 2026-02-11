"""
Gmail API Router - Endpoints for reading and sending emails via user's Gmail account
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from app.models.user import UserResponse
from app.core.auth import get_current_active_user
from app.services.gmail_service import gmail_service
from app.services.google_auth import google_auth_service
import secrets
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/latest")
async def get_latest_emails(
    max_results: int = Query(10, ge=1, le=50, description="Maximum number of emails to retrieve"),
    query: Optional[str] = Query(None, description="Gmail search query (e.g., 'is:unread', 'from:example@gmail.com')"),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Get latest emails from the current user's Gmail inbox
    Requires user to have authenticated with Google and granted Gmail permissions
    """
    try:
        user_id = str(current_user.id)
        
        # Check if user has Gmail tokens
        from app.core.database import get_database
        db = get_database()
        user = await db.users.find_one({"_id": user_id})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if not user.get("google_refresh_token"):
            raise HTTPException(
                status_code=400,
                detail="Gmail not configured. Please login with Google and grant Gmail permissions."
            )
        
        # Get latest emails
        emails = await gmail_service.get_latest_emails(
            user_id=user_id,
            max_results=max_results,
            query=query or ""
        )
        
        return {
            "success": True,
            "count": len(emails),
            "emails": emails
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting latest emails: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve emails: {str(e)}"
        )


@router.get("/status")
async def get_gmail_status(
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Check if Gmail is configured for the current user and verify token scopes
    """
    from app.core.database import get_database
    db = get_database()
    user = await db.users.find_one({"_id": str(current_user.id)})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    has_refresh_token = bool(user.get("google_refresh_token"))
    has_access_token = bool(user.get("google_access_token"))
    token_expiry = user.get("google_token_expiry")
    
    # Check token scopes if access token exists
    token_scopes = None
    has_gmail_scope = False
    if has_access_token:
        token_scopes = await gmail_service.check_token_scope(user.get("google_access_token"))
        if token_scopes:
            has_gmail_scope = any("gmail" in scope.lower() for scope in token_scopes)
    
    return {
        "configured": has_refresh_token,
        "has_access_token": has_access_token,
        "has_gmail_scope": has_gmail_scope,
        "token_scopes": token_scopes,
        "token_expiry": token_expiry.isoformat() if token_expiry else None,
        "email": user.get("email"),
        "needs_reauthorization": has_refresh_token and not has_gmail_scope
    }


@router.get("/reauthorize")
async def get_gmail_reauthorize_url(
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Get Google OAuth URL to re-authorize with Gmail scopes
    User should be redirected to this URL to grant Gmail permissions
    """
    try:
        # Generate state for security
        state = secrets.token_urlsafe(32)
        auth_url = google_auth_service.get_google_auth_url(state=state)
        
        logger.info(f"🔐 [GMAIL] Generated re-authorization URL for user {current_user.id}")
        
        return {
            "auth_url": auth_url,
            "state": state,
            "message": "Please visit the auth_url to grant Gmail permissions. After authorization, the new token will be saved automatically."
        }
    except Exception as e:
        logger.error(f"❌ Error generating re-authorization URL: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate re-authorization URL: {str(e)}"
        )

