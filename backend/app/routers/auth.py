from fastapi import APIRouter, HTTPException, status, Depends, Request
from datetime import datetime, timedelta
from bson import ObjectId
from app.core.database import get_database
from app.core.auth import verify_password, get_password_hash, create_access_token, get_current_active_user
from app.models.user import (
    UserCreate, UserLogin, UserResponse, Token, PasswordReset, PasswordResetConfirm, PasswordChange,
    GoogleAuthRequest, GoogleAuthResponse, GoogleUserInfo
)
from app.core.config import settings
from app.services.email import send_password_reset_email, generate_reset_token
from app.services.google_auth import google_auth_service
import secrets
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/register", response_model=Token)
async def register(user_data: UserCreate):
    db = get_database()
    
    # Check if user already exists
    existing_user = await db.users.find_one({"$or": [{"email": user_data.email}, {"username": user_data.username}]})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already registered"
        )
    
    # Create user document
    user_doc = {
        "_id": str(ObjectId()),
        "email": user_data.email,
        "username": user_data.username,
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "company_name": user_data.company_name,
        "industry": user_data.industry,
        "tone": user_data.tone or "professional",
        "language": user_data.language or "en",
        "phone": user_data.phone,
        "hashed_password": get_password_hash(user_data.password),
        "role": "user",
        "is_active": True,
        "is_verified": False,
        "gdpr_consent": False,
        "terms_accepted": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db.users.insert_one(user_doc)
    
    # Create access token
    access_token = create_access_token(data={"sub": user_doc["_id"]})
    
    # Return user response without password
    user_response = UserResponse(**user_doc)
    
    return Token(access_token=access_token, user=user_response)

@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin):
    db = get_database()
    
    # Find user by email
    user = await db.users.find_one({"email": user_credentials.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Verify password
    if not verify_password(user_credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Check if user is active
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": user["_id"]})
    
    # Return user response without password
    user_response = UserResponse(**user)
    
    return Token(access_token=access_token, user=user_response)

@router.post("/forgot-password")
async def forgot_password(password_reset: PasswordReset):
    db = get_database()
    
    # Check if user exists
    user = await db.users.find_one({"email": password_reset.email})
    if not user:
        # Don't reveal if email exists or not for security
        return {"message": "If the email exists, a password reset link has been sent"}
    
    # Generate reset token
    reset_token = generate_reset_token()
    
    # Store reset token in database with expiration (1 hour)
    await db.users.update_one(
        {"email": password_reset.email},
        {
            "$set": {
                "reset_token": reset_token,
                "reset_token_expires": datetime.utcnow() + timedelta(hours=1)
            }
        }
    )
    
    # Print email configuration before sending
    logger.info("📧 [FORGOT_PASSWORD] Email configuration:")
    logger.info(f"   MAIL_SERVER: {settings.MAIL_SERVER}")
    logger.info(f"   MAIL_PORT: {settings.MAIL_PORT}")
    logger.info(f"   MAIL_FROM: {settings.MAIL_FROM}")
    logger.info(f"   MAIL_USERNAME: {settings.MAIL_USERNAME}")
    logger.info(f"   MAIL_PASSWORD: {'*' * len(settings.MAIL_PASSWORD) if settings.MAIL_PASSWORD else 'NOT SET'}")
    logger.info(f"   FRONTEND_URL: {settings.FRONTEND_URL}")
    logger.info(f"   Recipient: {password_reset.email}")
    logger.info(f"   Reset Token: {reset_token[:10]}...")
    
    # Send password reset email
    email_sent = await send_password_reset_email(
        email=password_reset.email,
        reset_token=reset_token,
        username=user.get("first_name")
    )
    
    if email_sent:
        return {"message": "Password reset email sent successfully"}
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send password reset email"
        )

@router.post("/reset-password")
async def reset_password(password_reset: PasswordResetConfirm):
    db = get_database()
    
    # Find user with valid reset token
    user = await db.users.find_one({
        "reset_token": password_reset.token,
        "reset_token_expires": {"$gt": datetime.utcnow()}
    })
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Update password and clear reset token
    await db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "hashed_password": get_password_hash(password_reset.new_password),
                "updated_at": datetime.utcnow()
            },
            "$unset": {
                "reset_token": "",
                "reset_token_expires": ""
            }
        }
    )
    
    return {"message": "Password reset successfully"}

@router.post("/change-password")
async def change_password(
    password_change: PasswordChange,
    current_user: UserResponse = Depends(get_current_active_user)
):
    db = get_database()
    
    # Get user with password
    user = await db.users.find_one({"_id": current_user.id})
    
    # Verify current password
    if not verify_password(password_change.current_password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    
    # Update password
    await db.users.update_one(
        {"_id": current_user.id},
        {
            "$set": {
                "hashed_password": get_password_hash(password_change.new_password),
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": "Password changed successfully"}

@router.post("/accept-terms")
async def accept_terms(current_user: UserResponse = Depends(get_current_active_user)):
    db = get_database()
    
    await db.users.update_one(
        {"_id": current_user.id},
        {
            "$set": {
                "terms_accepted": True,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": "Terms accepted successfully"}

@router.post("/gdpr-consent")
async def gdpr_consent(current_user: UserResponse = Depends(get_current_active_user)):
    db = get_database()
    
    await db.users.update_one(
        {"_id": current_user.id},
        {
            "$set": {
                "gdpr_consent": True,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": "GDPR consent recorded successfully"}

# Google OAuth Endpoints
@router.get("/google/login")
async def google_login():
    """
    Get Google OAuth authorization URL with Gmail scopes
    This will show consent screen requesting Gmail permissions
    """
    try:
        # Generate a random state for security
        state = secrets.token_urlsafe(32)
        auth_url = google_auth_service.get_google_auth_url(state=state)
        
        print(f"🔐 [GOOGLE_OAUTH] Login endpoint called - generating auth URL with Gmail scopes")
        print(f"🔐 [GOOGLE_OAUTH] Auth URL will request: openid, email, profile, gmail.send, gmail.readonly")
        
        return {
            "auth_url": auth_url,
            "state": state
        }
    except Exception as e:
        logger.error(f"Error generating Google auth URL: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate Google authorization URL"
        )

@router.post("/google/callback", response_model=GoogleAuthResponse)
async def google_callback(auth_request: GoogleAuthRequest):
    """
    Handle Google OAuth callback and create/login user
    """
    db = get_database()
    
    try:
        print(f"🔐 [GOOGLE_OAUTH] Starting OAuth callback with code: {auth_request.code[:10]}...")
        
        # Exchange code for access token
        token_data = await google_auth_service.exchange_code_for_token(auth_request.code)
        access_token = token_data.get("access_token")
        refresh_token = token_data.get("refresh_token")
        expires_in = token_data.get("expires_in") or 3600
        scope = token_data.get("scope", "")  # Get scope from token response
        
        print(f"🔐 [GOOGLE_OAUTH] Token exchange successful")
        print(f"🔐 [GOOGLE_OAUTH] Received scopes: {scope}")
        
        # Verify Gmail scopes are present
        has_gmail_scope = "gmail" in scope.lower() if scope else False
        if has_gmail_scope:
            print(f"✅ [GOOGLE_OAUTH] Gmail scopes confirmed in token!")
        else:
            print(f"⚠️ [GOOGLE_OAUTH] WARNING: Gmail scopes NOT found in token response!")
            print(f"⚠️ [GOOGLE_OAUTH] Token scopes: {scope}")
        
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No access token received from Google"
            )
        
        # Get user info from Google
        google_user = await google_auth_service.get_user_info(access_token)
        print(f"🔐 [GOOGLE_OAUTH] User info retrieved: {google_user.email}")
        
        # Prepare Gmail token fields (for sending/receiving mail later)
        gmail_token_data = {}
        if refresh_token:
            gmail_token_data = {
                "gmail_access_token": access_token,
                "gmail_refresh_token": refresh_token,
                "gmail_token_expiry": datetime.utcnow() + timedelta(seconds=expires_in),
            }
        
        # Check if user already exists by email (primary check)
        existing_user = await db.users.find_one({"email": google_user.email})
        
        if existing_user:
            # User exists, log them in and update Google info
            logger.info(f"Existing user logged in via Google: {google_user.email}")
            
            # Update user with Google info
            update_fields = {
                "google_id": google_user.id,
                "auth_provider": "google",
                "avatar_url": google_user.picture,
                "is_verified": True,  # Google verified emails are trusted
                "updated_at": datetime.utcnow()
            }
            # Only set Gmail tokens if we received a refresh_token (Google may not send it every time)
            if gmail_token_data:
                update_fields.update(gmail_token_data)
            
            await db.users.update_one(
                {"_id": existing_user["_id"]},
                {"$set": update_fields}
            )
            
            # Create JWT token
            jwt_token = create_access_token(data={"sub": existing_user["_id"]})
            user_response = UserResponse(**existing_user)
            user_response.google_id = google_user.id
            user_response.auth_provider = "google"
            user_response.avatar_url = google_user.picture
            user_response.is_verified = True
            
            return GoogleAuthResponse(
                access_token=jwt_token,
                user=user_response,
                is_new_user=False
            )
        
        # Create new user
        print(f"🔐 [GOOGLE_OAUTH] Creating new user: {google_user.email}")
        logger.info(f"Creating new Google user: {google_user.email}")
        
        # Generate username from email
        username = google_user.email.split("@")[0]
        # Ensure username is unique
        counter = 1
        original_username = username
        while await db.users.find_one({"username": username}):
            username = f"{original_username}{counter}"
            counter += 1
        
        print(f"🔐 [GOOGLE_OAUTH] Generated username: {username}")
        
        user_doc = {
            "_id": str(ObjectId()),
            "email": google_user.email,
            "username": username,
            "first_name": google_user.given_name,
            "last_name": google_user.family_name,
            "google_id": google_user.id,
            "avatar_url": google_user.picture,
            "auth_provider": "google",
            "role": "user",
            "is_active": True,
            "is_verified": True,  # Google verified emails are trusted
            "gdpr_consent": False,
            "terms_accepted": False,
            "tone": "professional",
            "language": google_user.locale or "en",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Add Gmail token fields for new user if available
        if gmail_token_data:
            user_doc.update(gmail_token_data)
        
        await db.users.insert_one(user_doc)
        print(f"🔐 [GOOGLE_OAUTH] User created successfully: {user_doc['_id']}")
        
        # Create JWT token
        jwt_token = create_access_token(data={"sub": user_doc["_id"]})
        user_response = UserResponse(**user_doc)
        
        print(f"🔐 [GOOGLE_OAUTH] JWT token generated, returning response")
        
        return GoogleAuthResponse(
            access_token=jwt_token,
            user=user_response,
            is_new_user=True
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in Google OAuth callback: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed"
        )

@router.get("/me")
async def get_current_user_info(current_user: UserResponse = Depends(get_current_active_user)):
    """
    Get current user's profile information
    """
    return current_user

@router.get("/google/user-info")
async def get_google_user_info(current_user: UserResponse = Depends(get_current_active_user)):
    """
    Get current user's Google profile information
    """
    if current_user.auth_provider != "google":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not authenticated via Google"
        )
    
    return {
        "google_id": current_user.google_id,
        "avatar_url": current_user.avatar_url,
        "auth_provider": current_user.auth_provider
    }

@router.get("/login/google")
async def google_login_callback(
    code: str = None,
    state: str = None,
    error: str = None
):
    """
    Handle Google  OAuth callback from redirect
    """
    if error:
        print(f"🔐 [GOOGLE_OAUTH] OAuth error: {error}")
        return {
            "error": error,
            "message": "Google authentication failed"
        }
    
    if not code:
        print(f"🔐 [GOOGLE_OAUTH] No authorization code received")
        return {
            "error": "no_code",
            "message": "No authorization code received from Google"
        }
    
    try:
        print(f"🔐 [GOOGLE_OAUTH] Processing callback with code: {code[:10]}...")
        
        # Call the existing callback logic
        auth_request = GoogleAuthRequest(code=code, state=state)
        result = await google_callback(auth_request)
        
        print(f"🔐 [GOOGLE_OAUTH] Authentication successful, redirecting to frontend")
        
        # Redirect to frontend login page with token
        frontend_url = "https://4skale.com"
        redirect_url = f"{frontend_url}/login?token={result.access_token}&user_id={result.user.id}&is_new={result.is_new_user}"
        
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=redirect_url)
        
    except Exception as e:
        print(f"🔐 [GOOGLE_OAUTH] Callback error: {str(e)}")
        error_url = f"https://4skale.com/login?error=oauth_failed"
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=error_url) 