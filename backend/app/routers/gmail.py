"""
Gmail API Router - Endpoints for reading and sending emails via user's Gmail account
"""
from fastapi import APIRouter, HTTPException, Depends, Query, Request
from typing import Optional
from datetime import datetime, timedelta
from app.models.user import UserResponse
from app.core.auth import get_current_active_user
from app.core.config import settings
from app.services.gmail_service import gmail_service
from jose import jwt
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
    Check if Gmail is configured for the current user.
    Uses stored google_gmail_connected and google_gmail_scope from DB.
    """
    from app.core.database import get_database
    db = get_database()
    user = await db.users.find_one({"_id": str(current_user.id)})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    gmail_connected = bool(user.get("google_gmail_connected"))
    gmail_scope = user.get("google_gmail_scope", "")
    has_gmail_scope = gmail_connected and "gmail" in gmail_scope.lower()
    
    has_refresh_token = bool(user.get("google_refresh_token") or user.get("google_gmail_refresh_token"))
    has_access_token = bool(user.get("google_access_token"))
    token_expiry = user.get("google_token_expiry")
    
    return {
        "configured": gmail_connected or has_refresh_token,
        "has_access_token": has_access_token,
        "has_gmail_scope": has_gmail_scope,
        "token_scopes": gmail_scope if gmail_scope else None,
        "token_expiry": token_expiry.isoformat() if token_expiry else None,
        "email": user.get("email"),
        "needs_reauthorization": not gmail_connected and has_refresh_token
    }


@router.get("/debug-redirect-uri")
async def debug_gmail_redirect_uri():
    """Debug endpoint to check what redirect URI is being used for Gmail OAuth."""
    from app.services.google_gmail_oauth_service import get_gmail_redirect_uri, GOOGLE_GMAIL_SCOPE
    
    redirect_uri = get_gmail_redirect_uri()
    frontend_url = getattr(settings, "FRONTEND_URL", "not set")
    custom_uri = getattr(settings, "GOOGLE_GMAIL_REDIRECT_URI", "not set")
    
    return {
        "redirect_uri_being_used": redirect_uri,
        "frontend_url": frontend_url,
        "custom_gmail_redirect_uri": custom_uri,
        "scope": GOOGLE_GMAIL_SCOPE,
        "client_id": settings.GOOGLE_CLIENT_ID[:20] + "...",
        "note": "Register this exact redirect_uri in Google Cloud Console for your OAuth Client"
    }


@router.get("/reauthorize")
async def get_gmail_reauthorize_url(
    request: Request,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Get Google OAuth URL to re-authorize with Gmail scopes.
    User should be redirected to this URL to grant Gmail permissions.
    Uses proper Gmail OAuth flow with gmail.readonly scope.
    """
    from app.services.google_gmail_oauth_service import get_gmail_auth_url
    
    try:
        # Get redirect origin from request
        origin = request.headers.get("origin") or request.headers.get("referer")
        if origin:
            from urllib.parse import urlparse
            parsed = urlparse(origin)
            redirect_origin = f"{parsed.scheme}://{parsed.netloc}"
        else:
            redirect_origin = getattr(settings, "FRONTEND_URL", "https://forskale.com")
        
        # Generate state JWT with user info and purpose
        state_payload = {
            "sub": str(current_user.id),
            "purpose": "gmail_connect",
            "redirect_origin": redirect_origin,
            "exp": datetime.utcnow() + timedelta(minutes=10),
        }
        state = jwt.encode(state_payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
        
        auth_url = get_gmail_auth_url(state=state)
        
        logger.info(f"🔐 [GMAIL] Generated re-authorization URL for user {current_user.id} with Gmail scope")
        
        return {
            "auth_url": auth_url,
            "state": state,
            "message": "Please visit the auth_url to grant Gmail permissions. After authorization, you will be redirected back to To-Do Ready."
        }
    except Exception as e:
        logger.error(f"❌ Error generating re-authorization URL: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate re-authorization URL: {str(e)}"
        )

