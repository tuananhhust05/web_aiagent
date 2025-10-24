from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class CampaignGoalBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    color_gradient: Optional[str] = Field(None, description="CSS gradient string for the goal button")
    source: Optional[str] = Field(None, max_length=100, description="Source of the goal (e.g., 'convention-activities')")
    is_active: bool = Field(default=True)

class CampaignGoalCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    color_gradient: Optional[str] = Field(None, description="CSS gradient string for the goal button")
    source: Optional[str] = Field(None, max_length=100, description="Source of the goal (e.g., 'convention-activities')")
    is_active: bool = Field(default=True)

class CampaignGoalUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    color_gradient: Optional[str] = Field(None, description="CSS gradient string for the goal button")
    source: Optional[str] = Field(None, max_length=100, description="Source of the goal")
    is_active: Optional[bool] = None

class CampaignGoalResponse(CampaignGoalBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        populate_by_name = True
        allow_population_by_field_name = True

class CampaignGoalStats(BaseModel):
    total_goals: int
    active_goals: int
    inactive_goals: int
