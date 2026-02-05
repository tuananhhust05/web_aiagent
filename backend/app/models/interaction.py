"""
Extensible interactions/events model for prospect history.
Used for: email, meeting, call, note (and future types).
Architecture: type, source, metadata JSON, company_id, user_id for easy extension.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class InteractionType(str, Enum):
    email = "email"
    meeting = "meeting"
    call = "call"
    note = "note"


class InteractionBase(BaseModel):
    type: InteractionType = Field(..., description="Event type: email, meeting, call, note")
    date: datetime = Field(..., description="Event date/time")
    description: Optional[str] = Field(None, description="Free text description")
    participants: List[str] = Field(default_factory=list, description="Participant IDs or emails")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Type-specific data (JSON)")
    company_id: Optional[str] = Field(None, description="Related company ID")
    contact_id: Optional[str] = Field(None, description="Related contact ID")
    deal_id: Optional[str] = Field(None, description="Related deal ID")
    source: Optional[str] = Field(None, description="Source system: crm, calendar, email, etc.")


class InteractionCreate(InteractionBase):
    pass


class InteractionResponse(InteractionBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        populate_by_name = True
