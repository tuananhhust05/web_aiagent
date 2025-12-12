from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
from app.models.user import Industry

class BusinessModel(str, Enum):
    B2B = "b2b"
    B2C = "b2c"
    B2B2C = "b2b2c"

class CompanyBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    business_model: BusinessModel
    industry: Optional[Industry] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    country: Optional[str] = None
    tax_id: Optional[str] = None

class CompanyCreate(CompanyBase):
    admin_email: EmailStr
    admin_first_name: str = Field(..., min_length=1, max_length=50)
    admin_last_name: str = Field(..., min_length=1, max_length=50)
    admin_password: str = Field(..., min_length=8)

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    business_model: Optional[BusinessModel] = None
    industry: Optional[Industry] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    country: Optional[str] = None
    tax_id: Optional[str] = None

class CompanyResponse(BaseModel):
    id: str = Field(alias="_id")
    name: str
    business_model: BusinessModel
    industry: Optional[Industry] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    country: Optional[str] = None
    tax_id: Optional[str] = None
    admin_user_id: str  # ID of the company admin
    employee_count: int = 0
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True

class EmployeeInvite(BaseModel):
    email: EmailStr
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    role: str = "employee"  # employee, colleague
    send_invite_email: bool = True

class EmployeeInviteResponse(BaseModel):
    invite_id: str
    email: EmailStr
    invite_token: str
    expires_at: datetime
    message: str

class ColleagueLinkRequest(BaseModel):
    email: EmailStr
    message: Optional[str] = None

class AdminLinkRequest(BaseModel):
    email: EmailStr
    company_id: str
    message: Optional[str] = None








