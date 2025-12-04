from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class CampaignWorkflowNodeScriptBase(BaseModel):
    campaign_id: str
    workflow_function: str  # e.g., "convention-activities"
    node_id: str  # ID of the workflow node
    script: str = Field(default="", min_length=0)  # Script content for this node
    config: Optional[Dict[str, Any]] = Field(default_factory=dict)  # Additional config for this node

class CampaignWorkflowNodeScriptCreate(CampaignWorkflowNodeScriptBase):
    pass

class CampaignWorkflowNodeScriptUpdate(BaseModel):
    script: Optional[str] = Field(None, min_length=0)
    config: Optional[Dict[str, Any]] = None

class CampaignWorkflowNodeScriptResponse(CampaignWorkflowNodeScriptBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

