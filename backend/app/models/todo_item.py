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


class IntentCategory(str, Enum):
    """Intent category for a todo item (from email/meeting analysis)."""
    INTERESTED = "interested"
    NOT_INTERESTED = "not_interested"
    DO_NOT_CONTACT = "do_not_contact"
    NOT_NOW = "not_now"
    FORWARDED = "forwarded"
    MEETING_INTENT = "meeting_intent"
    NON_IN_TARGET = "non_in_target"


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


class NextStepType(str, Enum):
    """Recommended next commercial step (PRD: multi-path options)."""
    SEND_EMAIL = "send_email"
    MAKE_CALL = "make_call"
    SHARE_CASE_STUDY = "share_case_study"
    ESCALATE_TECHNICAL_VALIDATION = "escalate_technical_validation"
    SCHEDULE_FOLLOWUP_CALL = "schedule_followup_call"


class AlternativeAction(BaseModel):
    """Alternative recommended action with confidence score."""
    action_type: str  # NextStepType value
    label: str
    confidence: int = 0  # 0-100


class TaskStrategy(BaseModel):
    """Strategic layer: why this step, objective, key topics, alternatives (PRD)."""
    recommended_next_step_type: str  # NextStepType value
    recommended_next_step_label: Optional[str] = None  # e.g. "Send email addressing X, Y, Z"
    objective: Optional[str] = None  # e.g. "Re-anchor value", "Reduce pricing resistance"
    key_topics: Optional[List[str]] = None  # X, Y, Z for email
    strategic_reasoning: Optional[str] = None  # Why this step
    decision_factors: Optional[List[str]] = None  # Reasoning transparency
    alternative_actions: Optional[List[AlternativeAction]] = None


class TodoItemBase(BaseModel):
    """Base todo item fields."""
    title: str
    description: Optional[str] = None
    task_type: TodoTaskType = TodoTaskType.GENERAL_FOLLOWUP
    priority: TodoPriority = TodoPriority.MEDIUM
    status: TodoStatus = TodoStatus.READY
    due_at: Optional[datetime] = None
    assignee: Optional[str] = None
    intent_category: Optional[IntentCategory] = None
    reviewed_at: Optional[datetime] = None
    task_strategy: Optional[TaskStrategy] = None


class TodoItemCreate(TodoItemBase):
    """Create a new todo item."""
    source: TodoSource = TodoSource.MANUAL
    source_id: Optional[str] = None
    deal_intelligence: Optional[DealIntelligence] = None
    prepared_action: Optional[PreparedAction] = None
    intent_category: Optional[IntentCategory] = None
    task_strategy: Optional[TaskStrategy] = None


class TodoItemUpdate(BaseModel):
    """Update todo item."""
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TodoStatus] = None
    priority: Optional[TodoPriority] = None
    due_at: Optional[datetime] = None
    prepared_action: Optional[PreparedAction] = None
    intent_category: Optional[IntentCategory] = None
    reviewed_at: Optional[datetime] = None
    task_strategy: Optional[TaskStrategy] = None


class TodoItemResponse(TodoItemBase):
    """Todo item response with all fields."""
    id: str
    user_id: str
    source: TodoSource
    source_id: Optional[str] = None
    deal_intelligence: Optional[DealIntelligence] = None
    thread_id: Optional[str] = None
    prepared_action: Optional[PreparedAction] = None
    task_strategy: Optional[TaskStrategy] = None
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
