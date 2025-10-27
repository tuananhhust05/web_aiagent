from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UpsellStatus(str, Enum):
    opportunity = "opportunity"
    in_progress = "in_progress"
    closed_won = "closed_won"
    closed_lost = "closed_lost"
    on_hold = "on_hold"

class UpsellType(str, Enum):
    upgrade = "upgrade"
    cross_sell = "cross_sell"
    add_on = "add_on"
    renewal = "renewal"

class UpsellPriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"

class UpsellBase(BaseModel):
    contact_id: str
    contact_name: str
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    current_product: str
    target_product: str
    upsell_type: UpsellType
    status: UpsellStatus
    priority: UpsellPriority
    estimated_value: float
    probability: int  # 0-100
    expected_close_date: Optional[datetime] = None
    last_contact_date: Optional[datetime] = None
    notes: Optional[str] = None
    success_criteria: Optional[List[str]] = None
    objections: Optional[List[str]] = None

class UpsellCreate(UpsellBase):
    pass

class UpsellUpdate(BaseModel):
    contact_id: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    current_product: Optional[str] = None
    target_product: Optional[str] = None
    upsell_type: Optional[UpsellType] = None
    status: Optional[UpsellStatus] = None
    priority: Optional[UpsellPriority] = None
    estimated_value: Optional[float] = None
    probability: Optional[int] = None
    expected_close_date: Optional[datetime] = None
    last_contact_date: Optional[datetime] = None
    notes: Optional[str] = None
    success_criteria: Optional[List[str]] = None
    objections: Optional[List[str]] = None

class UpsellResponse(UpsellBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True

class UpsellListResponse(BaseModel):
    upsell_records: List[UpsellResponse]
    total: int
    page: int
    limit: int
    total_pages: int

class UpsellStatsResponse(BaseModel):
    total_opportunities: int
    in_progress_opportunities: int
    closed_won_opportunities: int
    closed_lost_opportunities: int
    total_estimated_value: float
    weighted_pipeline_value: float
    average_probability: float
    high_priority_count: int
    critical_priority_count: int
