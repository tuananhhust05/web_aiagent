from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class InboxResponseBase(BaseModel):
    platform: str = Field(..., description="Platform name, e.g. telegram, whatsapp, email")
    contact: str = Field(..., description="Raw contact identifier received from the platform")
    content: str = Field(..., description="Response content/message text")
    campaign_id: Optional[str] = Field(None, description="Resolved campaign id that the contact belongs to")


class InboxResponseCreate(InboxResponseBase):
    pass


class InboxResponse(InboxResponseBase):
    id: str = Field(alias="_id")
    user_id: Optional[str] = None
    contact_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True


