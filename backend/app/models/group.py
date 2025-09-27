from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

class GroupBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")  # Hex color code
    is_active: bool = Field(True)

class GroupCreate(GroupBase):
    pass

class GroupUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")
    is_active: Optional[bool] = None

class GroupResponse(GroupBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    member_count: Optional[int] = 0

    class Config:
        from_attributes = True

class GroupListResponse(BaseModel):
    groups: List[GroupResponse]
    total: int
    page: int
    limit: int

class GroupFilter(BaseModel):
    search: Optional[str] = None
    is_active: Optional[bool] = None
    page: int = Field(1, ge=1)
    limit: int = Field(20, ge=1, le=100)

# User in Group models
class UserInGroupBase(BaseModel):
    contact_id: str
    group_id: str
    added_at: Optional[datetime] = None
    added_by: Optional[str] = None  # User ID who added this contact to group

class UserInGroupCreate(UserInGroupBase):
    pass

class UserInGroupResponse(UserInGroupBase):
    id: str
    created_at: datetime
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None

    class Config:
        from_attributes = True

class UserInGroupListResponse(BaseModel):
    users: List[UserInGroupResponse]
    total: int
    page: int
    limit: int

class AddContactsToGroupRequest(BaseModel):
    contact_ids: List[str] = Field(..., min_items=1)
    added_by: Optional[str] = None

class RemoveContactsFromGroupRequest(BaseModel):
    contact_ids: List[str] = Field(..., min_items=1)

class GroupStatsResponse(BaseModel):
    total_groups: int
    active_groups: int
    total_members: int
    average_members_per_group: float
