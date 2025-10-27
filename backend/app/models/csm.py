from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class CSMStatus(str, Enum):
    active = "active"
    at_risk = "at_risk"
    churned = "churned"
    inactive = "inactive"

class CSMPriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"

class CSMBase(BaseModel):
    contact_id: str
    contact_name: str
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    account_value: float
    health_score: int  # 0-100
    status: CSMStatus
    priority: CSMPriority
    last_contact_date: Optional[datetime] = None
    next_follow_up: Optional[datetime] = None
    notes: Optional[str] = None
    success_metrics: Optional[dict] = None
    risk_factors: Optional[List[str]] = None

class CSMCreate(CSMBase):
    pass

class CSMUpdate(BaseModel):
    contact_id: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    account_value: Optional[float] = None
    health_score: Optional[int] = None
    status: Optional[CSMStatus] = None
    priority: Optional[CSMPriority] = None
    last_contact_date: Optional[datetime] = None
    next_follow_up: Optional[datetime] = None
    notes: Optional[str] = None
    success_metrics: Optional[dict] = None
    risk_factors: Optional[List[str]] = None

class CSMResponse(CSMBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True

class CSMListResponse(BaseModel):
    csm_records: List[CSMResponse]
    total: int
    page: int
    limit: int
    total_pages: int

class CSMStatsResponse(BaseModel):
    total_customers: int
    active_customers: int
    at_risk_customers: int
    churned_customers: int
    average_health_score: float
    total_account_value: float
    high_priority_count: int
    critical_priority_count: int
