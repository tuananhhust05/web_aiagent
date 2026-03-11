from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class TemplateType(str, Enum):
    personal = "personal"
    team = "team"
    suggested = "suggested"


class MeetingTypeFilter(str, Enum):
    external = "external"
    internal = "internal"
    all = "all"


class PlaybookRule(BaseModel):
    id: Optional[str] = Field(None, description="Client-side rule id")
    label: str = Field(..., min_length=1, max_length=200, description="Rule label")
    description: Optional[str] = Field(None, max_length=500, description="Optional helper text")


class PlaybookTemplateCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    rules: List[PlaybookRule] = Field(default_factory=list)
    template_type: Optional[TemplateType] = TemplateType.personal
    prompt: Optional[str] = None
    meeting_type: Optional[MeetingTypeFilter] = MeetingTypeFilter.all
    title_keyword: Optional[str] = None
    active: Optional[bool] = True


class PlaybookTemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=120)
    rules: Optional[List[PlaybookRule]] = None
    is_default: Optional[bool] = None
    template_type: Optional[TemplateType] = None
    prompt: Optional[str] = None
    meeting_type: Optional[MeetingTypeFilter] = None
    title_keyword: Optional[str] = None
    active: Optional[bool] = None


class PlaybookTemplateResponse(BaseModel):
    id: str
    user_id: str
    name: str
    rules: List[PlaybookRule] = Field(default_factory=list)
    is_default: bool = False
    template_type: str = "personal"
    prompt: Optional[str] = None
    meeting_type: str = "all"
    title_keyword: Optional[str] = None
    active: bool = True
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True


class PlaybookTemplateListResponse(BaseModel):
    templates: List[PlaybookTemplateResponse] = Field(default_factory=list)
    total: int = 0
