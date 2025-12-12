from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime, date
from enum import Enum


class DealStatus(str, Enum):
    """Deal status - maps to pipeline stages"""
    LEAD = "lead"
    QUALIFIED = "qualified"
    DEMO = "demo"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"
    
    # Legacy statuses (for backward compatibility)
    NEW = "new"
    CONTACTED = "contacted"


class DealPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class DealBase(BaseModel):
    name: str = Field(..., description="Deal name")
    description: Optional[str] = Field(None, description="Deal description")
    contact_id: str = Field(..., description="Contact ID")
    company_id: Optional[str] = Field(None, description="Company ID")
    campaign_id: Optional[str] = Field(None, description="Campaign ID")
    pipeline_id: Optional[str] = Field(None, description="Pipeline ID")
    stage_id: Optional[str] = Field(None, description="Current stage ID in the pipeline")
    status: Optional[str] = Field(None, description="Deal status/stage (will be auto-mapped from stage_id if provided, accepts any string)")
    priority: DealPriority = Field(DealPriority.MEDIUM, description="Deal priority")
    
    # Financial
    amount: float = Field(0.0, description="Deal amount/value in USD")
    cost: float = Field(0.0, description="Deal cost in USD")
    revenue: float = Field(0.0, description="Expected revenue in USD")
    
    # Win probability (can be overridden from pipeline stage)
    probability: Optional[float] = Field(None, ge=0.0, le=100.0, description="Win probability (0-100)")
    
    # Dates
    expected_close_date: Optional[date] = Field(None, description="Expected close date")
    actual_close_date: Optional[date] = Field(None, description="Actual close date")
    start_date: Optional[date] = Field(None, description="Deal start date")
    end_date: Optional[date] = Field(None, description="Deal end date")
    last_activity_date: Optional[datetime] = Field(None, description="Last activity date")
    
    # Additional fields
    loss_reason: Optional[str] = Field(None, description="Reason for losing the deal")
    win_reason: Optional[str] = Field(None, description="Reason for winning the deal")
    next_step: Optional[str] = Field(None, description="Next step/action")
    owner_id: Optional[str] = Field(None, description="Deal owner user ID")
    
    # Custom properties
    custom_properties: Optional[Dict] = Field(default={}, description="Custom properties")


class DealCreate(DealBase):
    pass


class DealUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    contact_id: Optional[str] = None
    company_id: Optional[str] = None
    campaign_id: Optional[str] = None
    pipeline_id: Optional[str] = None
    stage_id: Optional[str] = None
    status: Optional[DealStatus] = None
    priority: Optional[DealPriority] = None
    amount: Optional[float] = None
    cost: Optional[float] = None
    revenue: Optional[float] = None
    probability: Optional[float] = None
    expected_close_date: Optional[date] = None
    actual_close_date: Optional[date] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    last_activity_date: Optional[datetime] = None
    loss_reason: Optional[str] = None
    win_reason: Optional[str] = None
    next_step: Optional[str] = None
    owner_id: Optional[str] = None
    custom_properties: Optional[Dict] = None


class DealResponse(DealBase):
    id: str = Field(..., description="Deal ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    
    # Calculated fields
    weighted_value: Optional[float] = Field(None, description="Deal value × probability")
    days_in_stage: Optional[int] = Field(None, description="Days in current stage")
    is_stalled: bool = Field(False, description="Is deal stalled (no activity for 14+ days)")
    
    # Populated fields
    contact_name: Optional[str] = Field(None, description="Contact name")
    contact_email: Optional[str] = Field(None, description="Contact email")
    contact_phone: Optional[str] = Field(None, description="Contact phone")
    campaign_name: Optional[str] = Field(None, description="Campaign name")
    pipeline_name: Optional[str] = Field(None, description="Pipeline name")
    stage_name: Optional[str] = Field(None, description="Current stage name")
    owner_name: Optional[str] = Field(None, description="Owner name")
    
    class Config:
        from_attributes = True


class DealStats(BaseModel):
    total_deals: int = Field(..., description="Total number of deals")
    open_deals: int = Field(0, description="Number of open deals")
    won_deals: int = Field(0, description="Number of won deals")
    lost_deals: int = Field(0, description="Number of lost deals")
    stalled_deals: int = Field(0, description="Number of stalled deals")
    total_value: float = Field(..., description="Total deal value")
    weighted_value: float = Field(0.0, description="Total weighted value")
    total_revenue: float = Field(..., description="Total revenue in USD")
    total_cost: float = Field(..., description="Total cost in USD")
    total_profit: float = Field(..., description="Total profit in USD")
    win_rate: float = Field(0.0, description="Win rate percentage")
    avg_deal_value: float = Field(0.0, description="Average deal value")
    avg_days_to_close: float = Field(0.0, description="Average days to close")
    
    # Legacy fields for backward compatibility
    new_deals: int = Field(0, description="Number of new deals")
    contacted_deals: int = Field(0, description="Number of contacted deals")
    negotiation_deals: int = Field(0, description="Number of negotiation deals")


class DealListResponse(BaseModel):
    deals: List[DealResponse] = Field(..., description="List of deals")
    total: int = Field(..., description="Total number of deals")
    page: int = Field(..., description="Current page")
    limit: int = Field(..., description="Items per page")
    stats: DealStats = Field(..., description="Deal statistics")


# Pipeline View Models
class PipelineStageView(BaseModel):
    id: str = Field(..., description="Stage ID")
    name: str = Field(..., description="Stage name")
    probability: float = Field(0.0, description="Win probability")
    color: str = Field("#3B82F6", description="Stage color")
    deals: List[DealResponse] = Field(default=[], description="Deals in this stage")
    total_value: float = Field(default=0.0, description="Total value of deals in this stage")
    weighted_value: float = Field(default=0.0, description="Weighted value of deals")
    count: int = Field(default=0, description="Number of deals in this stage")


class PipelineViewResponse(BaseModel):
    pipeline_id: str = Field(..., description="Pipeline ID")
    pipeline_name: str = Field(..., description="Pipeline name")
    stages: List[PipelineStageView] = Field(..., description="Pipeline stages with deals")
    total_deals: int = Field(..., description="Total number of deals")
    total_value: float = Field(..., description="Total value of all deals")
    weighted_value: float = Field(0.0, description="Total weighted value")
    forecast_this_month: float = Field(0.0, description="Forecast for this month")
    forecast_this_quarter: float = Field(0.0, description="Forecast for this quarter")


# Legacy models for backward compatibility
class PipelineStage(BaseModel):
    id: str = Field(..., description="Stage ID")
    name: str = Field(..., description="Stage name")
    deals: List[DealResponse] = Field(default=[], description="Deals in this stage")
    total_value: float = Field(default=0.0, description="Total value of deals in this stage")
    count: int = Field(default=0, description="Number of deals in this stage")


class PipelineResponse(BaseModel):
    stages: List[PipelineStage] = Field(..., description="Pipeline stages with deals")
    total_deals: int = Field(..., description="Total number of deals")
    total_value: float = Field(..., description="Total value of all deals")
    

class DealStageUpdate(BaseModel):
    stage: Optional[DealStatus] = Field(None, description="New stage for the deal (enum)")
    stage_id: Optional[str] = Field(None, description="New stage ID (UUID) - will be mapped to stage name from pipeline")
    pipeline_id: Optional[str] = Field(None, description="Pipeline ID to search for stage (optional, will search all pipelines if not provided)")


# Activity models for deal tracking
class DealActivityType(str, Enum):
    NOTE = "note"
    CALL = "call"
    EMAIL = "email"
    MEETING = "meeting"
    TASK = "task"
    STAGE_CHANGE = "stage_change"


class DealActivityBase(BaseModel):
    deal_id: str = Field(..., description="Deal ID")
    activity_type: DealActivityType = Field(..., description="Activity type")
    subject: Optional[str] = Field(None, description="Activity subject")
    content: Optional[str] = Field(None, description="Activity content/notes")
    scheduled_at: Optional[datetime] = Field(None, description="Scheduled date/time")
    completed_at: Optional[datetime] = Field(None, description="Completion date/time")
    is_completed: bool = Field(False, description="Is activity completed")


class DealActivityCreate(DealActivityBase):
    pass


class DealActivityResponse(DealActivityBase):
    id: str = Field(..., description="Activity ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    created_by: Optional[str] = Field(None, description="Created by user ID")
    created_by_name: Optional[str] = Field(None, description="Created by user name")
    
    class Config:
        from_attributes = True
