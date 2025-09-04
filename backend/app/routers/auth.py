from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timedelta
from bson import ObjectId
from app.core.database import get_database
from app.core.auth import verify_password, get_password_hash, create_access_token, get_current_active_user
from app.models.user import UserCreate, UserLogin, UserResponse, Token, PasswordReset, PasswordResetConfirm, PasswordChange
from app.core.config import settings
from app.services.email import send_password_reset_email, generate_reset_token

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
        "tone": user_data.tone,
        "language": user_data.language,
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