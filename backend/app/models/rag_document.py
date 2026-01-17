from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class RAGDocumentStatus(str, Enum):
    PROCESSING = "processing"
    PROCESSED = "processed"
    FAILED = "failed"

class RAGDocumentBase(BaseModel):
    filename: str
    original_filename: str
    file_path: str  # Path to stored file
    file_size: int  # Size in bytes
    user_id: str
    status: RAGDocumentStatus = RAGDocumentStatus.PROCESSING
    total_chunks: int = 0
    error_message: Optional[str] = None

class RAGDocumentCreate(RAGDocumentBase):
    pass

class RAGDocumentUpdate(BaseModel):
    status: Optional[RAGDocumentStatus] = None
    total_chunks: Optional[int] = None
    error_message: Optional[str] = None

class RAGDocumentResponse(RAGDocumentBase):
    id: str
    uploaded_at: datetime
    processed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
