from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime
from enum import Enum

class MeetingPlatform(str, Enum):
    teams = "teams"
    zoom = "zoom"
    google_meet = "google_meet"


class TranscriptLine(BaseModel):
    speaker: str = Field(..., description="Speaker name or label")
    role: Optional[str] = Field(None, description="Speaker role e.g. Seller")
    time: str = Field(..., description="Timestamp e.g. 00:01")
    text: str = Field(..., description="Transcribed text")


class MeetingCreate(BaseModel):
    title: str = Field(..., description="Meeting title")
    description: Optional[str] = Field(None, description="Meeting description")
    platform: MeetingPlatform = Field(..., description="Meeting platform")
    link: str = Field(..., description="Meeting link")

class MeetingUpdate(BaseModel):
    title: Optional[str] = Field(None, description="Meeting title")
    description: Optional[str] = Field(None, description="Meeting description")
    platform: Optional[MeetingPlatform] = Field(None, description="Meeting platform")
    link: Optional[str] = Field(None, description="Meeting link")
    transcript_lines: Optional[List[TranscriptLine]] = Field(None, description="Transcription segments")

class MeetingResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    platform: MeetingPlatform
    link: str
    created_at: datetime
    updated_at: datetime
    transcript_lines: Optional[List[TranscriptLine]] = None

    class Config:
        from_attributes = True
        populate_by_name = True

class MeetingListResponse(BaseModel):
    meetings: List[MeetingResponse]
    total: int
    page: int
    limit: int
    total_pages: int
