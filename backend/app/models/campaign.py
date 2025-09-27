from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class CampaignStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    SCHEDULED = "scheduled"

class CampaignType(str, Enum):
    MANUAL = "manual"
    SCHEDULED = "scheduled"

class ScheduleFrequency(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"

class ScheduleSettings(BaseModel):
    frequency: ScheduleFrequency
    start_time: datetime
    end_time: Optional[datetime] = None
    timezone: str = "UTC"
    days_of_week: Optional[List[int]] = None  # 0=Monday, 6=Sunday (for weekly)
    day_of_month: Optional[int] = None  # 1-31 (for monthly)
    month_of_year: Optional[int] = None  # 1-12 (for yearly)

class CampaignBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    status: CampaignStatus = CampaignStatus.DRAFT
    type: CampaignType = CampaignType.MANUAL
    contacts: List[str] = Field(default_factory=list)
    group_ids: List[str] = Field(default_factory=list)  # Groups to include in campaign
    call_script: str = Field(..., min_length=1)
    schedule_time: Optional[datetime] = None
    schedule_settings: Optional[ScheduleSettings] = None
    settings: Optional[Dict[str, Any]] = Field(default_factory=dict)

class CampaignCreate(CampaignBase):
    pass

class CampaignUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    status: Optional[CampaignStatus] = None
    type: Optional[CampaignType] = None
    contacts: Optional[List[str]] = None
    group_ids: Optional[List[str]] = None  # Groups to include in campaign
    call_script: Optional[str] = Field(None, min_length=1)
    schedule_time: Optional[datetime] = None
    schedule_settings: Optional[ScheduleSettings] = None
    settings: Optional[Dict[str, Any]] = None

class CampaignResponse(CampaignBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        populate_by_name = True
        allow_population_by_field_name = True

class CampaignStats(BaseModel):
    total_campaigns: int
    active_campaigns: int
    scheduled_campaigns: int
    total_contacts: int
    completed_calls: int
    success_rate: float

class CampaignFilters(BaseModel):
    status: Optional[CampaignStatus] = None
    type: Optional[CampaignType] = None
    search: Optional[str] = None
    limit: int = Field(default=50, ge=1, le=100)
    offset: int = Field(default=0, ge=0)

class CampaignGroupContacts(BaseModel):
    group_id: str
    group_name: str
    contacts: List[Dict[str, Any]]  # Contact details
    total_contacts: int

class CampaignContactsResponse(BaseModel):
    groups: List[CampaignGroupContacts]
    total_contacts: int
