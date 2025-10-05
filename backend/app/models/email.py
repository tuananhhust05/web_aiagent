from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class EmailStatus(str, Enum):
    DRAFT = "draft"
    SENDING = "sending"
    SENT = "sent"
    FAILED = "failed"

class EmailRecipient(BaseModel):
    email: str
    name: Optional[str] = None
    contact_id: Optional[str] = None

class EmailAttachment(BaseModel):
    filename: str
    content_type: str
    size: int
    url: Optional[str] = None

class EmailCreate(BaseModel):
    subject: str
    content: str
    is_html: bool = True
    recipients: List[Dict] = []
    group_ids: List[str] = []
    contact_ids: List[str] = []
    attachments: List[Dict] = []

class EmailUpdate(BaseModel):
    subject: Optional[str] = None
    content: Optional[str] = None
    is_html: Optional[bool] = None
    status: Optional[EmailStatus] = None

class EmailResponse(BaseModel):
    id: str
    subject: str
    content: str
    is_html: bool
    status: EmailStatus
    recipients: List[Dict]
    attachments: List[Dict]
    sent_count: int
    failed_count: int
    total_recipients: int
    created_by: str
    created_at: datetime
    updated_at: datetime
    sent_at: Optional[datetime] = None

class EmailSendRequest(BaseModel):
    email_id: str

class EmailStats(BaseModel):
    total_emails: int
    sent_emails: int
    failed_emails: int
    draft_emails: int
    total_recipients: int
    successful_deliveries: int
    failed_deliveries: int

class EmailHistory(BaseModel):
    id: str
    email_id: str
    action: str  # sent, send_failed, send_exception, deleted, updated
    status: str  # success, failed
    sent_count: Optional[int] = 0
    failed_count: Optional[int] = 0
    error: Optional[str] = None
    recipients: Optional[List[Dict]] = []
    email_subject: Optional[str] = None
    sent_at: datetime
    created_by: str

class EmailHistoryResponse(BaseModel):
    email_id: str
    email_subject: str
    history: List[EmailHistory]