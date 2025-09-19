from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class ContactStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    LEAD = "lead"
    CUSTOMER = "customer"
    PROSPECT = "prospect"

class ContactSource(str, Enum):
    MANUAL = "manual"
    CSV_IMPORT = "csv_import"
    HUBSPOT = "hubspot"
    SALESFORCE = "salesforce"
    PIPEDRIVE = "pipedrive"
    WEBSITE = "website"

class ContactBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    job_title: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    status: ContactStatus = ContactStatus.LEAD
    source: ContactSource = ContactSource.MANUAL
    notes: Optional[str] = None
    tags: List[str] = []
    custom_fields: Dict[str, Any] = {}

class ContactCreate(ContactBase):
    pass

class ContactUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    job_title: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    status: Optional[ContactStatus] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    custom_fields: Optional[Dict[str, Any]] = None

class ContactResponse(ContactBase):
    id: str = Field(alias="_id")
    user_id: str
    created_at: datetime
    updated_at: datetime
    last_contacted: Optional[datetime] = None
    crm_id: Optional[str] = None
    crm_source: Optional[str] = None

    class Config:
        from_attributes = True
        populate_by_name = True
        allow_population_by_field_name = True

class ContactImport(BaseModel):
    contacts: List[ContactCreate]
    source: ContactSource = ContactSource.CSV_IMPORT

class ContactFilter(BaseModel):
    search: Optional[str] = None
    status: Optional[ContactStatus] = None
    source: Optional[ContactSource] = None
    tags: Optional[List[str]] = None
    company: Optional[str] = None
    limit: int = 50
    skip: int = 0

class ContactBulkUpdate(BaseModel):
    contact_ids: List[str]
    updates: ContactUpdate 