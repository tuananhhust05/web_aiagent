from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum


class PipelineStageBase(BaseModel):
    """Base model for a pipeline stage"""
    name: str = Field(..., description="Stage name")
    probability: float = Field(0.0, ge=0.0, le=100.0, description="Win probability percentage (0-100)")
    order: int = Field(0, description="Display order")
    color: Optional[str] = Field("#3B82F6", description="Stage color (hex)")
    description: Optional[str] = Field(None, description="Stage description")
    required_properties: List[str] = Field(default=[], description="Required properties at this stage")


class PipelineStageCreate(PipelineStageBase):
    pass


class PipelineStageResponse(PipelineStageBase):
    id: str = Field(..., description="Stage ID")


class PipelineBase(BaseModel):
    """Base model for a sales pipeline"""
    name: str = Field(..., description="Pipeline name")
    description: Optional[str] = Field(None, description="Pipeline description")
    business_type: Optional[str] = Field("general", description="Business type (b2b, b2c, general)")
    is_default: bool = Field(False, description="Is this the default pipeline")
    is_active: bool = Field(True, description="Is pipeline active")


class PipelineCreate(PipelineBase):
    stages: List[PipelineStageCreate] = Field(default=[], description="Pipeline stages")


class PipelineUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    business_type: Optional[str] = None
    is_default: Optional[bool] = None
    is_active: Optional[bool] = None
    stages: Optional[List[PipelineStageCreate]] = None


class PipelineResponse(PipelineBase):
    id: str = Field(..., description="Pipeline ID")
    stages: List[PipelineStageResponse] = Field(default=[], description="Pipeline stages")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    deal_count: int = Field(0, description="Number of deals in this pipeline")
    
    class Config:
        from_attributes = True


class PipelineListResponse(BaseModel):
    pipelines: List[PipelineResponse] = Field(..., description="List of pipelines")
    total: int = Field(..., description="Total count")


# Default pipeline stages based on HubSpot best practices
DEFAULT_PIPELINE_STAGES = [
    {"name": "Lead", "probability": 10, "order": 1, "color": "#3B82F6"},
    {"name": "Qualified", "probability": 25, "order": 2, "color": "#8B5CF6"},
    {"name": "Demo/Meeting", "probability": 40, "order": 3, "color": "#F59E0B"},
    {"name": "Proposal Sent", "probability": 60, "order": 4, "color": "#F97316"},
    {"name": "Negotiation", "probability": 80, "order": 5, "color": "#EF4444"},
    {"name": "Closed Won", "probability": 100, "order": 6, "color": "#22C55E"},
    {"name": "Closed Lost", "probability": 0, "order": 7, "color": "#6B7280"},
]


# Pipeline Analytics Models
class StageConversionRate(BaseModel):
    from_stage: str = Field(..., description="From stage name")
    to_stage: str = Field(..., description="To stage name")
    conversion_rate: float = Field(..., description="Conversion rate percentage")
    deals_moved: int = Field(0, description="Number of deals moved")


class PipelineForecast(BaseModel):
    pipeline_id: str = Field(..., description="Pipeline ID")
    pipeline_name: str = Field(..., description="Pipeline name")
    total_deals: int = Field(0, description="Total deals in pipeline")
    total_value: float = Field(0.0, description="Total deal value")
    weighted_value: float = Field(0.0, description="Weighted forecast (value × probability)")
    by_stage: List[Dict] = Field(default=[], description="Breakdown by stage")
    expected_close_this_month: float = Field(0.0, description="Expected to close this month")
    expected_close_this_quarter: float = Field(0.0, description="Expected to close this quarter")


class PipelineAnalytics(BaseModel):
    forecast: PipelineForecast = Field(..., description="Pipeline forecast")
    conversion_rates: List[StageConversionRate] = Field(default=[], description="Stage conversion rates")
    avg_deal_value: float = Field(0.0, description="Average deal value")
    avg_days_in_stage: Dict[str, float] = Field(default={}, description="Average days spent in each stage")
    stalled_deals_count: int = Field(0, description="Number of stalled deals")
    deals_without_activity: int = Field(0, description="Deals without recent activity")


# Lead-to-pipeline mapping models
class PipelineLeadEntry(BaseModel):
    contact_id: str = Field(..., description="Contact/lead ID")
    stage_id: str = Field(..., description="Stage ID within the pipeline")
    pipeline_id: str = Field(..., description="Pipeline ID")
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class PipelineLead(BaseModel):
    id: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None
    stage_id: str


class PipelineLeadStageView(BaseModel):
    id: str
    name: str
    color: Optional[str] = "#3B82F6"
    order: int
    leads: List[PipelineLead] = Field(default=[])
    count: int = 0


class PipelineLeadViewResponse(BaseModel):
    pipeline_id: str
    pipeline_name: str
    stages: List[PipelineLeadStageView]
    total_leads: int


class PipelineLeadStageUpdate(BaseModel):
    """Model for updating lead stage in pipeline"""
    stage_id: str = Field(..., description="Stage ID to move the lead to")


# Deal View Filters
class DealViewType(str, Enum):
    ALL = "all"
    OPEN = "open"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"
    STALLED = "stalled"
    NO_ACTIVITY = "no_activity"
    CLOSING_THIS_MONTH = "closing_this_month"
    CLOSING_THIS_QUARTER = "closing_this_quarter"

