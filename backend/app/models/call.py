from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class CallType(str, Enum):
    INBOUND = "inbound"
    OUTBOUND = "outbound"

class CallStatus(str, Enum):
    INITIATED = "initiated"
    CONNECTING = "connecting"
    COMPLETED = "completed"
    FAILED = "failed"
    BUSY = "busy"
    NO_ANSWER = "no_answer"
    CANCELLED = "cancelled"

class SentimentType(str, Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"

class CallBase(BaseModel):
    phone_number: str = Field(..., description="Phone number called")
    agent_name: str = Field(..., description="Name of the agent")
    call_type: CallType = Field(..., description="Type of call")
    duration: int = Field(..., description="Call duration in seconds")
    status: CallStatus = Field(..., description="Call status")
    recording_url: Optional[str] = None
    transcript: Optional[str] = None
    sentiment: Optional[SentimentType] = None
    sentiment_score: Optional[float] = Field(None, ge=0, le=1, description="Sentiment score 0-1")
    feedback: Optional[str] = None
    meeting_booked: bool = False
    meeting_date: Optional[datetime] = None
    notes: Optional[str] = None

class CallCreate(CallBase):
    pass

class CallUpdate(BaseModel):
    phone_number: Optional[str] = None
    agent_name: Optional[str] = None
    call_type: Optional[CallType] = None
    duration: Optional[int] = None
    status: Optional[CallStatus] = None
    recording_url: Optional[str] = None
    transcript: Optional[str] = None
    sentiment: Optional[SentimentType] = None
    sentiment_score: Optional[float] = Field(None, ge=0, le=1)
    feedback: Optional[str] = None
    meeting_booked: Optional[bool] = None
    meeting_date: Optional[datetime] = None
    notes: Optional[str] = None

class CallResponse(BaseModel):
    id: str = Field(alias="_id")
    phone_number: str
    agent_name: str
    call_type: CallType
    duration: int
    status: CallStatus
    recording_url: Optional[str] = None
    transcript: Optional[str] = None
    sentiment: Optional[SentimentType] = None
    sentiment_score: Optional[float] = None
    feedback: Optional[str] = None
    meeting_booked: bool = False
    meeting_date: Optional[datetime] = None
    notes: Optional[str] = None
    twilio_call_sid: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    user_id: str

    class Config:
        from_attributes = True
        populate_by_name = True

class KPISummary(BaseModel):
    total_calls: int
    call_success_rate: float = Field(..., ge=0, le=100, description="Success rate percentage")
    avg_call_duration: int = Field(..., description="Average duration in seconds")
    meetings_booked: int
    total_calls_change: float = Field(..., description="Percentage change from previous period")
    success_rate_change: float = Field(..., description="Percentage change from previous period")
    duration_change: float = Field(..., description="Percentage change from previous period")
    meetings_change: float = Field(..., description="Percentage change from previous period")

class CallFilters(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    phone_number: Optional[str] = None
    agent_name: Optional[str] = None
    call_type: Optional[CallType] = None
    status: Optional[CallStatus] = None
    sentiment: Optional[SentimentType] = None
    unique_calls_only: bool = False
    limit: int = Field(50, ge=1, le=1000)
    offset: int = Field(0, ge=0)
