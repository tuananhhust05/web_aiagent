from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class IntegrationType(str, Enum):
    HUBSPOT = "hubspot"
    SALESFORCE = "salesforce"
    PIPEDRIVE = "pipedrive"

class IntegrationStatus(str, Enum):
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    ERROR = "error"
    SYNCING = "syncing"

class SyncFrequency(str, Enum):
    REALTIME = "realtime"
    HOURLY = "hourly"
    DAILY = "daily"

class IntegrationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    type: IntegrationType
    status: IntegrationStatus = IntegrationStatus.DISCONNECTED
    settings: Dict[str, Any] = Field(default_factory=dict)
    last_sync: Optional[datetime] = None
    total_contacts: int = 0
    sync_frequency: SyncFrequency = SyncFrequency.DAILY
    auto_sync: bool = True

class IntegrationCreate(IntegrationBase):
    api_key: str = Field(..., min_length=1)
    webhook_url: Optional[str] = None

class IntegrationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    api_key: Optional[str] = Field(None, min_length=1)
    webhook_url: Optional[str] = None
    sync_frequency: Optional[SyncFrequency] = None
    auto_sync: Optional[bool] = None
    settings: Optional[Dict[str, Any]] = None

class IntegrationResponse(IntegrationBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        populate_by_name = True
        allow_population_by_field_name = True

class SyncResult(BaseModel):
    success: bool
    message: str
    contacts_synced: int
    errors: List[str] = Field(default_factory=list)
    sync_time: datetime

class IntegrationStats(BaseModel):
    total_integrations: int
    connected_integrations: int
    total_contacts_synced: int
    last_sync_time: Optional[datetime]
    sync_errors: int
