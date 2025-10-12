from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class TelegramContactStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

class TelegramCampaignStatus(str, Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    SENT = "sent"
    FAILED = "failed"

class TelegramMessageStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"
    DELIVERED = "delivered"

# Telegram Contact Models
class TelegramContactBase(BaseModel):
    username: Optional[str] = None
    first_name: str = Field(..., min_length=1, max_length=255)
    last_name: Optional[str] = None
    is_active: bool = True

class TelegramContactCreate(TelegramContactBase):
    pass

class TelegramContactUpdate(BaseModel):
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: Optional[bool] = None

class TelegramContactResponse(TelegramContactBase):
    id: str = Field(alias="_id")
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True

# Telegram Campaign Models
class TelegramCampaignBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=1)
    status: TelegramCampaignStatus = TelegramCampaignStatus.DRAFT
    scheduled_at: Optional[datetime] = None

class TelegramCampaignCreate(TelegramCampaignBase):
    pass

class TelegramCampaignUpdate(BaseModel):
    name: Optional[str] = None
    message: Optional[str] = None
    status: Optional[TelegramCampaignStatus] = None
    scheduled_at: Optional[datetime] = None

class TelegramCampaignResponse(TelegramCampaignBase):
    id: str = Field(alias="_id")
    user_id: str
    sent_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True

# Telegram Message Models
class TelegramMessageBase(BaseModel):
    contact_id: str
    message: str = Field(..., min_length=1)
    status: TelegramMessageStatus = TelegramMessageStatus.PENDING
    campaign_id: Optional[str] = None

class TelegramMessageCreate(TelegramMessageBase):
    pass

class TelegramMessageResponse(TelegramMessageBase):
    id: str = Field(alias="_id")
    user_id: str
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True

# Manual Send Models
class TelegramManualSend(BaseModel):
    message: str = Field(..., min_length=1)
    contact_ids: List[str] = Field(..., min_items=1)
    send_immediately: bool = True

class TelegramSendResponse(BaseModel):
    success: bool
    message: str
    sent_count: int
    failed_count: int
    details: List[dict] = []

# List Response Models
class TelegramContactListResponse(BaseModel):
    contacts: List[TelegramContactResponse]
    total: int
    page: int
    limit: int

class TelegramCampaignListResponse(BaseModel):
    campaigns: List[TelegramCampaignResponse]
    total: int
    page: int
    limit: int

class TelegramMessageListResponse(BaseModel):
    messages: List[TelegramMessageResponse]
    total: int
    page: int
    limit: int
