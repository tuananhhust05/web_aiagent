from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class RenewalType(str, Enum):
    subscription = "subscription"
    service = "service"
    contract = "contract"
    license = "license"
    other = "other"

class RenewalStatus(str, Enum):
    pending = "pending"
    completed = "completed"
    overdue = "overdue"
    cancelled = "cancelled"

class RenewalCreate(BaseModel):
    contact_id: str = Field(..., description="ID of the contact")
    renewal_type: RenewalType = Field(..., description="Type of renewal")
    current_expiry_date: str = Field(..., description="Current expiry date (YYYY-MM-DD)")
    renewal_date: str = Field(..., description="Renewal date (YYYY-MM-DD)")
    amount: float = Field(..., ge=0, description="Renewal amount")
    currency: str = Field(default="USD", description="Currency code")
    status: RenewalStatus = Field(default=RenewalStatus.pending, description="Renewal status")
    notes: Optional[str] = Field(None, description="Additional notes")

class RenewalUpdate(BaseModel):
    contact_id: Optional[str] = Field(None, description="ID of the contact")
    renewal_type: Optional[RenewalType] = Field(None, description="Type of renewal")
    current_expiry_date: Optional[str] = Field(None, description="Current expiry date (YYYY-MM-DD)")
    renewal_date: Optional[str] = Field(None, description="Renewal date (YYYY-MM-DD)")
    amount: Optional[float] = Field(None, ge=0, description="Renewal amount")
    currency: Optional[str] = Field(None, description="Currency code")
    status: Optional[RenewalStatus] = Field(None, description="Renewal status")
    notes: Optional[str] = Field(None, description="Additional notes")

class RenewalResponse(BaseModel):
    id: str
    contact_id: str
    contact_name: str
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    renewal_type: RenewalType
    current_expiry_date: str
    renewal_date: str
    amount: float
    currency: str
    status: RenewalStatus
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class RenewalListResponse(BaseModel):
    renewals: List[RenewalResponse]
    total: int
    page: int
    limit: int

class RenewalStats(BaseModel):
    total_renewals: int
    pending_renewals: int
    overdue_renewals: int
    completed_renewals: int
    cancelled_renewals: int
    total_amount: float
    average_amount: float
