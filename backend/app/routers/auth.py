from fastapi import APIRouter, HTTPException, status, Depends, Request, BackgroundTasks
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
import traceback
from typing import Tuple, Optional, Literal
from urllib.parse import urlencode
from pydantic import BaseModel, Field

from app.models.user import UserRole, Industry
from app.models.company import BusinessModel

logger = logging.getLogger(__name__)


class SupplementProfileRequest(BaseModel):
    """Request body for POST /auth/supplement-profile: update user + optional company creation."""
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    phone: Optional[str] = None
    industry: Optional[str] = None
    language: str = Field(..., min_length=1)
    workspace_role: Literal["owner", "member"]
    company_id: Optional[str] = None
    company_name: Optional[str] = None
    company_website: Optional[str] = None
    company_phone: Optional[str] = None
    company_address: Optional[str] = None
    company_country: Optional[str] = None

# Public email domains: no company entity inferred, user gets personal workspace
PUBLIC_EMAIL_DOMAINS = frozenset({
    "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "outlook.com",
    "hotmail.com", "live.com", "msn.com", "icloud.com", "me.com", "aol.com",
    "mail.com", "protonmail.com", "zoho.com", "yandex.com", "gmx.com",
})


def _is_public_domain(email: str) -> bool:
    domain = (email or "").strip().split("@")[-1].lower()
    return domain in PUBLIC_EMAIL_DOMAINS


def _infer_company_name_from_domain(domain: str) -> str:
    # e.g. "acme.com" -> "Acme", "mail.acme.co.uk" -> "Acme"
    parts = domain.lower().replace("www.", "").split(".")
    name = parts[0] if parts else domain
    return name.capitalize()


async def resolve_or_create_company(db, email: str, user_id: str) -> Tuple[Optional[str], str, bool]:
    """
    Resolve or create company by email domain. Returns (company_id or None, workspace_role, is_admin).
    - Public domain -> (None, "owner", False) personal workspace.
    - Company exists -> (company_id, "owner" if admin else "member", is_admin).
    - Company does not exist -> create lightweight company, (company_id, "owner", True).
    
    Args:
        db: Database instance
        email: User email address
        user_id: User ID to set as admin if creating new company or company has no admin
    
    Returns:
        Tuple of (company_id or None, workspace_role, is_admin)
    """
    domain = (email or "").strip().split("@")[-1].lower()
    if not domain or _is_public_domain(email):
        return None, "owner", False

    # Find existing company by domain (store domain on company for lookup)
    existing = await db.companies.find_one({"domain": domain, "is_active": True})
    if existing:
        # Check if company already has an admin
        admin_user_id = existing.get("admin_user_id")
        if admin_user_id:
            # Company has admin, this user is a member
            user_count = await db.users.count_documents({"company_id": existing["_id"]})
            logger.info(f"🔐 [COMPANY] Company {existing['_id']} exists with admin {admin_user_id}, user will be member")
            return existing["_id"], "member", False
        else:
            # Company exists but no admin yet - set this user as admin
            logger.info(f"🔐 [COMPANY] Company {existing['_id']} exists but no admin, setting user {user_id} as admin")
            await db.companies.update_one(
                {"_id": existing["_id"]},
                {
                    "$set": {
                        "admin_user_id": user_id,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            return existing["_id"], "owner", True

    # Create lightweight company - this user becomes the admin/owner
    company_name = _infer_company_name_from_domain(domain)
    company_doc = {
        "_id": str(ObjectId()),
        "name": company_name,
        "domain": domain,
        "business_model": "b2b",
        "industry": None,
        "website": None,
        "phone": None,
        "address": None,
        "country": None,
        "tax_id": None,
        "admin_user_id": user_id,  # Set user as admin immediately
        "employee_count": 1,  # Count this user
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    await db.companies.insert_one(company_doc)
    logger.info(f"🔐 [COMPANY] Created new company {company_doc['_id']} ({company_name}) with admin {user_id}")
    return company_doc["_id"], "owner", True


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
    
    user_id = str(ObjectId())
    # Leave company and workspace_role empty so user must choose on supplement-profile
    company_id = None
    company_name = None
    user_role = "user"
    workspace_role = None  # Required to be set by user on supplement-profile

    # Create user document (no company/workspace_role; user chooses on supplement-profile)
    user_doc = {
        "_id": user_id,
        "email": user_data.email,
        "username": user_data.username,
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "company_name": company_name,
        "company_id": company_id,
        "industry": user_data.industry,
        "tone": user_data.tone or "professional",
        "language": user_data.language or "en",
        "phone": user_data.phone,
        "hashed_password": get_password_hash(user_data.password),
        "role": user_role,
        "workspace_role": workspace_role,
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


@router.post("/supplement-profile", response_model=UserResponse)
async def supplement_profile(
    body: SupplementProfileRequest,
    current_user: UserResponse = Depends(get_current_active_user),
):
    """
    Complete profile: accept terms/GDPR, optionally create company (owner), update user.
    Single API for the supplement-profile page.
    """
    db = get_database()

    if body.workspace_role == "owner" and not (body.company_name and body.company_name.strip()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company name is required when choosing Owner",
        )
    if body.workspace_role == "member" and not (body.company_id and body.company_id.strip()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please select a company when choosing Member",
        )

    user_id = current_user.id
    update_data = {
        "first_name": body.first_name,
        "last_name": body.last_name,
        "phone": body.phone or None,
        "industry": body.industry or None,
        "language": body.language,
        "terms_accepted": True,
        "gdpr_consent": True,
        "workspace_role": body.workspace_role,
        "updated_at": datetime.utcnow(),
    }

    if body.workspace_role == "owner" and body.company_name:
        existing = await db.companies.find_one({"name": body.company_name.strip()})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Company name already registered. Please select it as Member or choose another name.",
            )
        admin_domain = None
        if current_user.email and "@" in current_user.email:
            admin_domain = current_user.email.split("@")[-1].lower()
        try:
            industry_enum = Industry(body.industry) if body.industry else None
        except ValueError:
            industry_enum = None
        company_doc = {
            "_id": str(ObjectId()),
            "name": body.company_name.strip(),
            "domain": admin_domain,
            "business_model": BusinessModel.B2B.value,
            "industry": industry_enum.value if industry_enum else None,
            "website": body.company_website or None,
            "phone": body.company_phone or None,
            "address": body.company_address or None,
            "country": body.company_country or None,
            "tax_id": None,
            "admin_user_id": user_id,
            "employee_count": 1,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        await db.companies.insert_one(company_doc)
        company_id = company_doc["_id"]
        update_data["company_id"] = company_id
        update_data["company_name"] = body.company_name.strip()
        update_data["role"] = UserRole.COMPANY_ADMIN.value
        logger.info("Supplement-profile: created company %s for user %s", company_id, user_id)
    elif body.workspace_role == "member" and body.company_id:
        company = await db.companies.find_one({"_id": body.company_id.strip(), "is_active": True})
        if not company:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Company not found or inactive",
            )
        update_data["company_id"] = company["_id"]
        update_data["company_name"] = company.get("name")
        update_data["role"] = UserRole.EMPLOYEE.value
        await db.companies.update_one(
            {"_id": company["_id"]},
            {"$inc": {"employee_count": 1}, "$set": {"updated_at": datetime.utcnow()}},
        )

    await db.users.update_one({"_id": user_id}, {"$set": update_data})
    updated_user = await db.users.find_one({"_id": user_id})
    if not updated_user:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="User not found after update")
    return UserResponse(**updated_user)


def _parse_source_from_state(state: Optional[str]) -> Optional[str]:
    """Extract source attribution from state (format 'nonce:source' or plain nonce)."""
    if not state or ":" not in state:
        return None
    parts = state.split(":", 1)
    return (parts[1].strip() or None) if len(parts) > 1 else None


# Google OAuth Endpoints
@router.get("/google/login")
async def google_login(source: Optional[str] = None):
    """
    Get Google OAuth authorization URL with identity scopes only.
    Optional query param: source (e.g. linkedin, direct) for attribution.
    """
    try:
        nonce = secrets.token_urlsafe(24)
        state = f"{nonce}:{source}" if (source and source.strip()) else nonce
        auth_url = google_auth_service.get_google_auth_url(state=state)
        logger.info("🔐 [GOOGLE_OAUTH] Login endpoint called, source=%s", source or "none")
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
async def google_callback(auth_request: GoogleAuthRequest, background_tasks: BackgroundTasks):
    """
    Handle Google OAuth callback: create user in DB first, then return token.
    Form for extra info is shown only after user record exists.
    """
    db = get_database()
    logger.info("🔐 [GOOGLE_OAUTH] Callback started, database=%s", settings.MONGODB_DATABASE)
    logger.info(f"🔐 [GOOGLE_OAUTH] Database client: {db.client if hasattr(db, 'client') else 'N/A'}")
    logger.info(f"🔐 [GOOGLE_OAUTH] Database name: {db.name}")
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
        email_raw = (google_user.email or "").strip()
        email_lower = email_raw.lower()
        print(f"🔐 [GOOGLE_OAUTH] User info retrieved: {email_raw}")
        
        # Validate email is not empty
        if not email_raw:
            logger.error("🔐 [GOOGLE_OAUTH] Email is empty from Google user info")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No email received from Google"
            )
        
        # Check if user already exists by email (case-insensitive)
        logger.info(f"🔐 [GOOGLE_OAUTH] Checking for existing user with email: {email_lower}")
        existing_user = await db.users.find_one({"email": email_lower})
        if not existing_user and email_raw != email_lower:
            logger.info(f"🔐 [GOOGLE_OAUTH] Checking for existing user with original email: {email_raw}")
            existing_user = await db.users.find_one({"email": email_raw})
        if existing_user:
            logger.info(f"🔐 [GOOGLE_OAUTH] Existing user found: {existing_user.get('_id')}")
        else:
            logger.info(f"🔐 [GOOGLE_OAUTH] No existing user found, will create new user")
        
        if existing_user:
            # Returning user: update Google identity info only (no Gmail tokens at login)
            logger.info(f"Existing user logged in via Google: {google_user.email}")
            update_fields = {
                "google_id": google_user.id,
                "auth_provider": "google",
                "avatar_url": google_user.picture,
                "is_verified": True,
                "updated_at": datetime.utcnow(),
            }
            await db.users.update_one(
                {"_id": existing_user["_id"]},
                {"$set": update_fields}
            )
            existing_user.update(update_fields)

            jwt_token = create_access_token(data={"sub": existing_user["_id"]})
            user_response = UserResponse(**existing_user)
            user_response.google_id = google_user.id
            user_response.auth_provider = "google"
            user_response.avatar_url = google_user.picture
            user_response.is_verified = True

            needs_profile = (
                user_response.auth_provider == "google"
                and (not user_response.terms_accepted or not user_response.gdpr_consent)
            )
            return GoogleAuthResponse(
                access_token=jwt_token,
                user=user_response,
                is_new_user=False,
                needs_profile_completion=needs_profile,
            )
        
        # First-time user: create account in DB immediately, then supplement workspace/company
        print(f"🔐 [GOOGLE_OAUTH] Creating new user: {google_user.email}")
        logger.info(f"Creating new Google user: {google_user.email}")

        username = google_user.email.split("@")[0]
        counter = 1
        original_username = username
        while await db.users.find_one({"username": username}):
            username = f"{original_username}{counter}"
            counter += 1
        print(f"🔐 [GOOGLE_OAUTH] Generated username: {username}")

        # 1) Create account in database first (minimal record)
        user_id = str(ObjectId())
        now = datetime.utcnow()
        
        # Ensure all required fields are present and valid
        first_name = (google_user.given_name or google_user.name or "User").strip() or "User"
        last_name = (google_user.family_name or "").strip() or "—"
        language_raw = google_user.locale or "en"
        language = language_raw.replace("-", "_")[:5] if language_raw else "en"
        
        user_doc = {
            "_id": user_id,
            "email": email_lower or email_raw,
            "username": username,
            "first_name": first_name,
            "last_name": last_name,
            "google_id": google_user.id,
            "avatar_url": google_user.picture,
            "auth_provider": "google",
            "role": UserRole.USER.value,  # Use enum value instead of string
            "company_id": None,
            "company_name": None,
            "workspace_role": None,  # User must choose on supplement-profile
            "plan": "trial",
            "source_attribution": None,
            "is_active": True,
            "is_verified": True,
            "gdpr_consent": False,
            "terms_accepted": False,
            "tone": "professional",
            "language": language,
            "created_at": now,
            "updated_at": now,
        }
        
        logger.info("🔐 [GOOGLE_OAUTH] Inserting user into users collection")
        logger.info(f"🔐 [GOOGLE_OAUTH] User document keys: {list(user_doc.keys())}")
        logger.info(f"🔐 [GOOGLE_OAUTH] User email: {user_doc.get('email')}, username: {user_doc.get('username')}")
        
        try:
            result = await db.users.insert_one(user_doc)
            print(f"🔐 [GOOGLE_OAUTH] Insert result - inserted_id: {result.inserted_id}")
            logger.info(f"🔐 [GOOGLE_OAUTH] User inserted with _id: {result.inserted_id}")
            
            if not result.inserted_id:
                logger.error(f"🔐 [GOOGLE_OAUTH] CRITICAL: insert_one returned no inserted_id! user_id={user_id}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="User insert returned no ID - database operation may have failed"
                )
            
            # Verify user was actually created
            verify_user = await db.users.find_one({"_id": user_id})
            if not verify_user:
                logger.error(f"🔐 [GOOGLE_OAUTH] CRITICAL: User was not found after insert! user_id={user_id}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="User was not created in database - verification failed"
                )
            logger.info(f"🔐 [GOOGLE_OAUTH] User verified in DB: {verify_user.get('email')}")
            print(f"🔐 [GOOGLE_OAUTH] User created and verified in DB: {user_id}")
        except HTTPException:
            raise
        except Exception as insert_err:
            logger.error(
                "🔐 [GOOGLE_OAUTH] insert_one failed: %s\n%s\nUser doc: %s",
                insert_err,
                traceback.format_exc(),
                user_doc,
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create user in database: {str(insert_err)}",
            )

        # Return immediately so client has user + token before showing any form
        jwt_token = create_access_token(data={"sub": user_id})
        
        # Create UserResponse - ensure all required fields are present
        try:
            user_response = UserResponse(**user_doc)
        except Exception as validation_err:
            logger.error(
                "🔐 [GOOGLE_OAUTH] UserResponse validation failed: %s\nUser doc: %s",
                validation_err,
                user_doc,
            )
            # User already created in DB, but response failed - try to fetch from DB
            db_user = await db.users.find_one({"_id": user_id})
            if db_user:
                user_response = UserResponse(**db_user)
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"User created but response validation failed: {str(validation_err)}",
                )
        
        # Company resolution runs in background; user already exists in DB
        async def _company_resolution_background():
            try:
                logger.info(f"🔐 [GOOGLE_OAUTH] Starting company resolution for user {user_id}, email: {email_raw}")
                company_id, workspace_role, is_admin = await resolve_or_create_company(db, email_raw, user_id)
                
                if company_id:
                    company_doc = await db.companies.find_one({"_id": company_id})
                    company_name = (company_doc or {}).get("name")
                    
                    # Update user role based on company role
                    user_role = "company_admin" if is_admin else "employee"
                    
                    # Prepare update payload (do not set workspace_role; user chooses on supplement-profile)
                    payload = {
                        "company_id": company_id,
                        "company_name": company_name,
                        "role": user_role,
                        "updated_at": datetime.utcnow(),
                    }
                    
                    # Increment employee count if not admin (admin was already counted during company creation)
                    if not is_admin:
                        await db.companies.update_one(
                            {"_id": company_id},
                            {"$inc": {"employee_count": 1}, "$set": {"updated_at": datetime.utcnow()}}
                        )
                    
                    # Add source attribution if present
                    src = _parse_source_from_state(auth_request.state)
                    if src:
                        payload["source_attribution"] = src
                    
                    # Update user with company info
                    await db.users.update_one({"_id": user_id}, {"$set": payload})
                    logger.info(f"🔐 [GOOGLE_OAUTH] User {user_id} linked to company {company_id} as {workspace_role} (role: {user_role})")
                else:
                    # Personal workspace (public email domain)
                    logger.info(f"🔐 [GOOGLE_OAUTH] User {user_id} has personal workspace (public email domain)")
                    src = _parse_source_from_state(auth_request.state)
                    if src:
                        await db.users.update_one(
                            {"_id": user_id},
                            {"$set": {"source_attribution": src, "updated_at": datetime.utcnow()}}
                        )
            except Exception as e:
                logger.error("🔐 [GOOGLE_OAUTH] Background company resolution failed: %s\n%s", e, traceback.format_exc())
        background_tasks.add_task(_company_resolution_background)

        print(f"🔐 [GOOGLE_OAUTH] User ready, returning token (company resolution in background)")
        return GoogleAuthResponse(
            access_token=jwt_token,
            user=user_response,
            is_new_user=True,
            needs_profile_completion=True,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("🔐 [GOOGLE_OAUTH] Callback error: %s\n%s", e, traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}",
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
    background_tasks: BackgroundTasks,
    code: str = None,
    state: str = None,
    error: str = None
):
    """
    Handle Google OAuth callback when Google redirects to backend.
    User is created in DB before redirecting to frontend.
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
        auth_request = GoogleAuthRequest(code=code, state=state)
        result = await google_callback(auth_request, background_tasks)
        
        print(f"🔐 [GOOGLE_OAUTH] Authentication successful, redirecting to frontend")
        frontend_base = getattr(settings, "FRONTEND_URL", None) or "https://forskale.com"
        frontend_base = frontend_base.rstrip("/")
        # Use urlencode so token (JWT) is safe in query string; redirect to dedicated OAuth landing
        query = urlencode({
            "token": result.access_token,
            "user_id": result.user.id,
            "is_new": str(result.is_new_user).lower(),
            "needs_profile": str(result.needs_profile_completion).lower(),
        })
        redirect_url = f"{frontend_base}/auth/oauth-done?{query}"
        return RedirectResponse(url=redirect_url)

    except Exception as e:
        print(f"🔐 [GOOGLE_OAUTH] Callback error: {str(e)}")
        frontend_base = getattr(settings, "FRONTEND_URL", None) or "https://forskale.com"
        error_url = f"{frontend_base.rstrip('/')}/auth/oauth-done?error=oauth_failed"
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