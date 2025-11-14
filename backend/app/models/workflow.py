from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class StrokeType(str, Enum):
    SOLID = "solid"
    DASHED = "dashed"

class NodePosition(BaseModel):
    x: float
    y: float

class WorkflowNode(BaseModel):
    id: str
    type: str  # whatsapp, ai-call, linkedin, telegram, email
    position: NodePosition
    data: Dict[str, Any] = Field(default_factory=dict)  # Contains max_no_response_time and other config
    title: Optional[str] = None

class WorkflowConnection(BaseModel):
    id: str
    source: str  # Node ID
    target: str  # Node ID
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None
    strokeType: Optional[StrokeType] = StrokeType.SOLID  # solid or dashed

class WorkflowBase(BaseModel):
    function: str  # convention-activities, csm, deals, etc.
    name: Optional[str] = None
    description: Optional[str] = None
    nodes: List[WorkflowNode] = Field(default_factory=list)
    connections: List[WorkflowConnection] = Field(default_factory=list)

class WorkflowCreate(WorkflowBase):
    pass

class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    nodes: Optional[List[WorkflowNode]] = None
    connections: Optional[List[WorkflowConnection]] = None

class WorkflowResponse(WorkflowBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

