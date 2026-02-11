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
from app.services.google_calendar_service import exchange_code_for_calendar_token
from app.services.calendar_crypto import encrypt_refresh_token
from jose import JWTError, jwt
from fastapi.responses import RedirectResponse
import secrets
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/register", response_model=Token)
async def register(user_data: UserCreate):
    db = get_database()
    
    # Debug log
    print(f"📝 [Register] Received data: company_id={user_data.company_id}, type={type(user_data.company_id)}")
    
    # Check if user already exists
    existing_user = await db.users.find_one({"$or": [{"email": user_data.email}, {"username": user_data.username}]})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already registered"
        )
    
    # If company_id is provided, verify company exists and get company name
    company_name = user_data.company_name
    user_role = "user"
    
    if user_data.company_id:
        company = await db.companies.find_one({"_id": user_data.company_id, "is_active": True})
        if not company:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Company not found or inactive"
            )
        company_name = company["name"]
        user_role = "employee"  # Set role to employee if joining a company
    
    # Create user document
    user_doc = {
        "_id": str(ObjectId()),
        "email": user_data.email,
        "username": user_data.username,
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "company_name": company_name,
        "company_id": user_data.company_id,
        "industry": user_data.industry,
        "tone": user_data.tone or "professional",
        "language": user_data.language or "en",
        "phone": user_data.phone,
        "hashed_password": get_password_hash(user_data.password),
        "role": user_role,
        "is_active": True,
        "is_verified": False,
        "gdpr_consent": False,
        "terms_accepted": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db.users.insert_one(user_doc)
    
    # If user joined a company, update employee count
    if user_data.company_id:
        await db.companies.update_one(
            {"_id": user_data.company_id},
            {"$inc": {"employee_count": 1}}
        )
    
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
    
    logger.info("🔐 [RESET_PASSWORD] Incoming reset password request")
    logger.info(f"   Token (first 10 chars): {password_reset.token[:10] if password_reset.token else 'None'}")
    logger.info(f"   New password length: {len(password_reset.new_password) if password_reset.new_password else 0}")
    
    # Find user with valid reset token
    user = await db.users.find_one({
        "reset_token": password_reset.token,
        "reset_token_expires": {"$gt": datetime.utcnow()}
    })
    
    if not user:
        logger.warning("⚠️ [RESET_PASSWORD] No user found with valid reset token")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    logger.info(f"✅ [RESET_PASSWORD] Found user for token: {user.get('email')} (id={user.get('_id')})")
    logger.info("🔐 [RESET_PASSWORD] Updating password and clearing reset token...")
    
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
    Get Google OAuth authorization URL with BASIC scopes only
    (no Gmail read/send permissions).
    """
    try:
        # Generate a random state for security
        state = secrets.token_urlsafe(32)
        auth_url = google_auth_service.get_google_auth_url(state=state)
        
        print(f"🔐 [GOOGLE_OAUTH] Login endpoint called - generating auth URL with BASIC scopes only")
        print(f"🔐 [GOOGLE_OAUTH] Auth URL will request: openid, email, profile")
        
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
        
        # Exchange code for access token (now includes Gmail readonly)
        token_data = await google_auth_service.exchange_code_for_token(auth_request.code)
        access_token = token_data.get("access_token")
        refresh_token = token_data.get("refresh_token")
        
        print(f"🔐 [GOOGLE_OAUTH] Token exchange successful, has_refresh_token={refresh_token is not None}")
        
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No access token received from Google"
            )
        
        # Get user info from Google
        google_user = await google_auth_service.get_user_info(access_token)
        print(f"🔐 [GOOGLE_OAUTH] User info retrieved: {google_user.email}")
        
        # Check if user already exists by email (primary check)
        existing_user = await db.users.find_one({"email": google_user.email})
        
        if existing_user:
            # User exists, log them in and update Google info
            logger.info(f"Existing user logged in via Google: {google_user.email}")
            
            # Update user with Google info and tokens for Gmail access
            update_fields = {
                "google_id": google_user.id,
                "auth_provider": "google",
                "avatar_url": google_user.picture,
                "is_verified": True,  # Google verified emails are trusted
                "google_access_token": access_token,
                "updated_at": datetime.utcnow()
            }
            # Only update refresh_token if we received one (won't be sent on re-auth)
            if refresh_token:
                update_fields["google_refresh_token"] = encrypt_refresh_token(refresh_token)
            
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
            "google_access_token": access_token,
            "google_refresh_token": encrypt_refresh_token(refresh_token) if refresh_token else None,
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
        frontend_url = "https://forskale.com"
        redirect_url = f"{frontend_url}/login?token={result.access_token}&user_id={result.user.id}&is_new={result.is_new_user}"
        
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=redirect_url)
        
    except Exception as e:
        print(f"🔐 [GOOGLE_OAUTH] Callback error: {str(e)}")
        error_url = f"https://forskale.com/login?error=oauth_failed"
        return RedirectResponse(url=error_url)


# ----- Google Calendar OAuth (calendar-only scope) -----
@router.get("/google/calendar/callback")
async def google_calendar_callback(
    code: str = None,
    state: str = None,
    error: str = None,
    scope: str = None,
):
    """
    Handle Google OAuth callback for Calendar only.
    Exchange code -> token, validate scope, save refresh_token (encrypted), set connected.
    Redirect to redirect_origin from state (if allowed) or FRONTEND_URL, then path /atlas/calendar?connected=...
    """
    logger.info(
        "[Calendar OAuth] Callback received: has_code=%s, has_state=%s, error=%s, scope=%s",
        bool(code), bool(state), error, scope,
    )
    frontend_base = getattr(settings, "FRONTEND_URL", None) or "https://forskale.com"
    success_url = f"{frontend_base}/atlas/calendar?connected=success"
    error_url = f"{frontend_base}/atlas/calendar?connected=error"

    if error:
        logger.warning("[Calendar OAuth] Error from Google: %s -> redirect to error_url", error)
        return RedirectResponse(url=error_url)
    if not code or not state:
        logger.warning("[Calendar OAuth] Missing code or state -> redirect to error_url")
        return RedirectResponse(url=error_url)

    try:
        payload = jwt.decode(
            state,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        if payload.get("purpose") != "calendar_connect":
            logger.warning("[Calendar OAuth] Invalid state purpose=%s", payload.get("purpose"))
            return RedirectResponse(url=error_url)
        user_id = payload.get("sub")
        if not user_id:
            logger.warning("[Calendar OAuth] No sub in state")
            return RedirectResponse(url=error_url)
        logger.info("[Calendar OAuth] State decoded: user_id=%s, redirect_origin=%s", user_id, payload.get("redirect_origin"))
        # Use redirect_origin from state so user returns to same origin (e.g. localhost)
        redirect_origin = payload.get("redirect_origin")
        if redirect_origin and isinstance(redirect_origin, str):
            base = redirect_origin.rstrip("/")
            allowed = (
                base.startswith("http://localhost")
                or base.startswith("https://localhost")
                or base.startswith("http://127.0.0.1")
                or base.startswith("https://127.0.0.1")
                or (frontend_base and base == frontend_base.rstrip("/"))
            )
            if allowed:
                success_url = f"{base}/atlas/calendar?connected=success"
                error_url = f"{base}/atlas/calendar?connected=error"
                logger.info("[Calendar OAuth] Using redirect_origin: success_url=%s", success_url)
    except JWTError as e:
        logger.warning("[Calendar OAuth] Invalid state JWT: %s", e)
        return RedirectResponse(url=error_url)

    try:
        logger.info("[Calendar OAuth] Exchanging code for token...")
        token_data = await exchange_code_for_calendar_token(code)
        refresh_token = token_data.get("refresh_token")
        if not refresh_token:
            logger.warning("[Calendar OAuth] No refresh_token in token response")
            return RedirectResponse(url=error_url)
        scope_val = token_data.get("scope", "")
        logger.info("[Calendar OAuth] Token received: has_refresh_token=True, scope=%s", scope_val)
        if "calendar" not in scope_val.lower():
            logger.warning("[Calendar OAuth] Scope missing calendar: %s", scope_val)
            return RedirectResponse(url=error_url)

        encrypted = encrypt_refresh_token(refresh_token)
        logger.info("[Calendar OAuth] Refresh token encrypted, updating user in DB...")
        db = get_database()
        from app.core.auth import _find_user_by_id
        user_doc = await _find_user_by_id(db, str(user_id))
        if not user_doc:
            logger.warning("[Calendar OAuth] User not found for _id=%s", user_id)
            return RedirectResponse(url=error_url)
        payload_set = {
            "google_calendar_connected": True,
            "google_calendar_refresh_token": encrypted,
            "google_calendar_scope": scope_val,
            "google_calendar_connected_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        result = await db.users.update_one(
            {"_id": user_doc["_id"]},
            {"$set": payload_set},
        )
        if result.matched_count == 0:
            logger.warning("[Calendar OAuth] DB update matched_count=0 for _id=%s", user_doc["_id"])
        else:
            logger.info(
                "[Calendar OAuth] DB updated: user_id=%s, matched=%s, modified=%s, google_calendar_connected=True",
                user_id, result.matched_count, result.modified_count,
            )
        logger.info("[Calendar OAuth] Redirecting to success_url: %s", success_url)
        return RedirectResponse(url=success_url)
    except Exception as e:
        logger.exception("[Calendar OAuth] Failed: %s", e)
        return RedirectResponse(url=error_url)