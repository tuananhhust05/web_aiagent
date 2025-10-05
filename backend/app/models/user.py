from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"

class Industry(str, Enum):
    REAL_ESTATE = "real_estate"
    INSURANCE = "insurance"
    HEALTHCARE = "healthcare"
    FINANCE = "finance"
    EDUCATION = "education"
    RETAIL = "retail"
    TECHNOLOGY = "technology"
    OTHER = "other"

class Tone(str, Enum):
    PROFESSIONAL = "professional"
    FRIENDLY = "friendly"
    FORMAL = "formal"
    CASUAL = "casual"
    ENTHUSIASTIC = "enthusiastic"

class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    company_name: Optional[str] = None
    industry: Optional[Industry] = None
    tone: Optional[Tone] = None
    language: Optional[str] = None
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company_name: Optional[str] = None
    industry: Optional[Industry] = None
    tone: Optional[str] = None
    language: Optional[str] = None
    phone: Optional[str] = None

class UserResponse(BaseModel):
    id: str = Field(alias="_id")
    email: EmailStr
    username: str
    first_name: str
    last_name: str
    company_name: Optional[str] = None
    industry: Optional[Industry] = None
    tone: str = "professional"
    language: str = "en"
    phone: Optional[str] = None
    role: UserRole = UserRole.USER
    is_active: bool = True
    is_verified: bool = False
    created_at: datetime
    updated_at: datetime
    gdpr_consent: bool = False
    terms_accepted: bool = False
    # Google OAuth fields
    google_id: Optional[str] = None
    avatar_url: Optional[str] = None
    auth_provider: str = "email"  # "email" or "google"

    class Config:
        from_attributes = True
        populate_by_name = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class PasswordReset(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)

class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)

# Google OAuth Models
class GoogleUserInfo(BaseModel):
    id: str
    email: str
    verified_email: bool
    name: str
    given_name: str
    family_name: str
    picture: Optional[str] = None
    locale: Optional[str] = None

class GoogleAuthRequest(BaseModel):
    code: str
    state: Optional[str] = None

class GoogleAuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    is_new_user: bool = False 