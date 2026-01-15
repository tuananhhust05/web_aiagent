from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class Channel(str, Enum):
    GMAIL = "Gmail"
    TELEGRAM = "Telegram"
    AI_CALL = "AI Call"
    LINKEDIN = "Linkedin"
    WHATSAPP = "Whatsapp"

class AITip(BaseModel):
    title: str = Field(..., description="Tip title")
    content: str = Field(..., description="Detailed tip content")
    category: Optional[str] = Field(None, description="Tip category (e.g., 'personalization', 'timing', 'engagement')")

class PrioritizedProspectBase(BaseModel):
    prospect_id: str = Field(..., description="Contact ID")
    prospect_name: str = Field(..., description="Contact name")
    what: str = Field(..., description="What action to take")
    when: str = Field(..., description="When to take action")
    channel: Channel = Field(..., description="Channel to use")
    priority: Optional[int] = Field(None, ge=1, le=10, description="Priority score 1-10")
    confidence: Optional[float] = Field(None, ge=0.0, le=100.0, description="AI confidence score")
    reasoning: Optional[str] = Field(None, description="AI reasoning for this prospect")
    generated_content: Optional[str] = Field(None, description="AI-generated email/message content ready to send")
    ai_tips: Optional[List[AITip]] = Field(None, description="AI-generated tips for sales coaching")
    contact_data: Optional[Dict[str, Any]] = Field(None, description="Full contact data")
    campaign_data: Optional[List[Dict[str, Any]]] = Field(None, description="Campaigns data")
    deal_data: Optional[List[Dict[str, Any]]] = Field(None, description="Deals data")

class PrioritizedProspectCreate(PrioritizedProspectBase):
    pass

class PrioritizedProspectUpdate(BaseModel):
    prospect_id: Optional[str] = None
    prospect_name: Optional[str] = None
    what: Optional[str] = None
    when: Optional[str] = None
    channel: Optional[Channel] = None
    priority: Optional[int] = None
    confidence: Optional[float] = None
    reasoning: Optional[str] = None
    generated_content: Optional[str] = None
    ai_tips: Optional[List[AITip]] = None
    contact_data: Optional[Dict[str, Any]] = None
    campaign_data: Optional[List[Dict[str, Any]]] = None
    deal_data: Optional[List[Dict[str, Any]]] = None

class PrioritizedProspectResponse(PrioritizedProspectBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        populate_by_name = True
        allow_population_by_field_name = True

class PrioritizedProspectListResponse(BaseModel):
    prospects: List[PrioritizedProspectResponse]
    total: int
    page: int
    limit: int
