from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from enum import Enum

class DealStatus(str, Enum):
    NEW = "new"
    CONTACTED = "contacted"
    NEGOTIATION = "negotiation"

class DealBase(BaseModel):
    name: str = Field(..., description="Deal name")
    description: Optional[str] = Field(None, description="Deal description")
    contact_id: str = Field(..., description="Contact ID")
    campaign_id: Optional[str] = Field(None, description="Campaign ID")
    start_date: Optional[date] = Field(None, description="Deal start date")
    end_date: Optional[date] = Field(None, description="Deal end date")
    status: DealStatus = Field(DealStatus.NEW, description="Deal status")
    cost: float = Field(0.0, description="Deal cost in USD")
    revenue: float = Field(0.0, description="Deal revenue in USD")

class DealCreate(DealBase):
    pass

class DealUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    contact_id: Optional[str] = None
    campaign_id: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[DealStatus] = None
    cost: Optional[float] = None
    revenue: Optional[float] = None

class DealResponse(DealBase):
    id: str = Field(..., description="Deal ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    
    # Populated fields
    contact_name: Optional[str] = Field(None, description="Contact name")
    contact_email: Optional[str] = Field(None, description="Contact email")
    contact_phone: Optional[str] = Field(None, description="Contact phone")
    campaign_name: Optional[str] = Field(None, description="Campaign name")
    
    class Config:
        from_attributes = True

class DealStats(BaseModel):
    total_deals: int = Field(..., description="Total number of deals")
    new_deals: int = Field(..., description="Number of new deals")
    contacted_deals: int = Field(..., description="Number of contacted deals")
    negotiation_deals: int = Field(..., description="Number of negotiation deals")
    total_revenue: float = Field(..., description="Total revenue in USD")
    total_cost: float = Field(..., description="Total cost in USD")
    total_profit: float = Field(..., description="Total profit in USD")

class DealListResponse(BaseModel):
    deals: List[DealResponse] = Field(..., description="List of deals")
    total: int = Field(..., description="Total number of deals")
    page: int = Field(..., description="Current page")
    limit: int = Field(..., description="Items per page")
    stats: DealStats = Field(..., description="Deal statistics")
