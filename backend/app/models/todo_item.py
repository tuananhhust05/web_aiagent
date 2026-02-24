"""
TodoItem model - Unified task model for To-Do Ready feature.
Combines tasks from emails, meetings, and manual input.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime
from enum import Enum


class TodoSource(str, Enum):
    EMAIL = "email"
    MEETING = "meeting"
    MANUAL = "manual"


class TodoStatus(str, Enum):
    READY = "ready"
    NEEDS_INPUT = "needs_input"
    OVERDUE = "overdue"
    DONE = "done"


class TodoPriority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class TodoTaskType(str, Enum):
    SEND_INTEGRATION_DOC = "send_integration_doc"
    RESPOND_TO_EMAIL = "respond_to_email"
    HANDLE_PRICING_OBJECTION = "handle_pricing_objection"
    COMPETITIVE_FOLLOWUP = "competitive_followup"
    SCHEDULE_DEMO = "schedule_demo"
    SEND_CASE_STUDY = "send_case_study"
    GENERAL_FOLLOWUP = "general_followup"


class DealIntelligence(BaseModel):
    """Deal context for a task."""
    company_name: str
    company_id: Optional[str] = None
    deal_id: Optional[str] = None
    deal_stage: Optional[str] = None
    last_call_sentiment: Optional[str] = None
    last_objection: Optional[str] = None
    competitor_mentioned: Optional[str] = None


class ThreadMessage(BaseModel):
    """Single message in communication thread."""
    id: str
    role: Literal["prospect", "sales"]
    sender_name: str
    content: str
    timestamp: datetime


class PreparedAction(BaseModel):
    """AI-prepared action/draft."""
    strategy_label: str
    explanation: str
    draft_text: str
    variants: Optional[List[str]] = None


class TodoItemBase(BaseModel):
    """Base todo item fields."""
    title: str
    description: Optional[str] = None
    task_type: TodoTaskType = TodoTaskType.GENERAL_FOLLOWUP
    priority: TodoPriority = TodoPriority.MEDIUM
    status: TodoStatus = TodoStatus.READY
    due_at: Optional[datetime] = None
    assignee: Optional[str] = None


class TodoItemCreate(TodoItemBase):
    """Create a new todo item."""
    source: TodoSource = TodoSource.MANUAL
    source_id: Optional[str] = None
    deal_intelligence: Optional[DealIntelligence] = None
    prepared_action: Optional[PreparedAction] = None


class TodoItemUpdate(BaseModel):
    """Update todo item."""
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TodoStatus] = None
    priority: Optional[TodoPriority] = None
    due_at: Optional[datetime] = None
    prepared_action: Optional[PreparedAction] = None


class TodoItemResponse(TodoItemBase):
    """Todo item response with all fields."""
    id: str
    user_id: str
    source: TodoSource
    source_id: Optional[str] = None
    deal_intelligence: Optional[DealIntelligence] = None
    thread_id: Optional[str] = None
    prepared_action: Optional[PreparedAction] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TodoListResponse(BaseModel):
    """Paginated list of todos."""
    items: List[TodoItemResponse]
    total: int
    page: int
    limit: int


class MemorySignalType(str, Enum):
    SLA_BREACH = "sla_breach"
    PROMISE_PENDING = "promise_pending"
    OBJECTION_UNHANDLED = "objection_unhandled"
    FOLLOWUP_OVERDUE = "followup_overdue"


class MemorySignal(BaseModel):
    """Memory signal / reminder badge."""
    id: str
    type: MemorySignalType
    label: str
    task_id: str
    severity: Literal["warning", "critical"] = "warning"
    detected_at: datetime


class MemorySignalsResponse(BaseModel):
    """List of memory signals."""
    signals: List[MemorySignal]
    total: int


class EmailAnalysisState(BaseModel):
    """Track which emails have been analyzed for a user."""
    user_id: str
    last_analyzed_internal_date: Optional[str] = None
    analyzed_email_ids: List[str] = Field(default_factory=list)
    last_analysis_at: Optional[datetime] = None


class MeetingAnalysisState(BaseModel):
    """Track which meetings have been analyzed for a user."""
    user_id: str
    analyzed_meeting_ids: List[str] = Field(default_factory=list)
    last_analysis_at: Optional[datetime] = None
