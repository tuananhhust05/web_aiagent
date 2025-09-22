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

class CampaignBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    status: CampaignStatus = CampaignStatus.DRAFT
    type: CampaignType = CampaignType.MANUAL
    contacts: List[str] = Field(default_factory=list)
    call_script: str = Field(..., min_length=1)
    schedule_time: Optional[datetime] = None
    settings: Optional[Dict[str, Any]] = Field(default_factory=dict)

class CampaignCreate(CampaignBase):
    pass

class CampaignUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    status: Optional[CampaignStatus] = None
    type: Optional[CampaignType] = None
    contacts: Optional[List[str]] = None
    call_script: Optional[str] = Field(None, min_length=1)
    schedule_time: Optional[datetime] = None
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
