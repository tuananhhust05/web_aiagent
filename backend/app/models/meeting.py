from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Any, Dict
from datetime import datetime
from enum import Enum

class MeetingPlatform(str, Enum):
    teams = "teams"
    zoom = "zoom"
    google_meet = "google_meet"
    local = "google_meet"


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
    video_url: Optional[str] = Field(None, description="Video recording URL")
    audio_url: Optional[str] = Field(None, description="Audio recording URL")

class MeetingUpdate(BaseModel):
    title: Optional[str] = Field(None, description="Meeting title")
    description: Optional[str] = Field(None, description="Meeting description")
    platform: Optional[MeetingPlatform] = Field(None, description="Meeting platform")
    link: Optional[str] = Field(None, description="Meeting link")
    transcript_lines: Optional[List[TranscriptLine]] = Field(None, description="Transcription segments")
    video_url: Optional[str] = Field(None, description="Video recording URL")
    audio_url: Optional[str] = Field(None, description="Audio recording URL")

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
    video_url: Optional[str] = None
    audio_url: Optional[str] = None
    duration_seconds: Optional[int] = None
    company: Optional[str] = None
    company_name: Optional[str] = None
    product: Optional[str] = None
    deal_stage: Optional[str] = None
    stage: Optional[str] = None
    data_completeness: Optional[int] = None
    atlas_evaluation: Optional[Dict[str, Any]] = None
    atlas_next_steps: Optional[List[Any]] = None
    atlas_summary: Optional[Dict[str, Any]] = None
    atlas_questions_and_objections: Optional[List[Any]] = None
    feedback_coach: Optional[Dict[str, Any]] = None
    playbook_analysis: Optional[Dict[str, Any]] = None
    atlas_smart_summary: Optional[Dict[str, Any]] = None
    calendar_event_id: Optional[str] = None
    calendar_event_title: Optional[str] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True, extra="allow")

class MeetingListResponse(BaseModel):
    meetings: List[MeetingResponse]
    total: int
    page: int
    limit: int
    total_pages: int
