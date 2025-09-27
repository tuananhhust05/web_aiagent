from fastapi import APIRouter, HTTPException, status, Depends, Query, UploadFile, File
from datetime import datetime
from typing import List, Optional
from bson import ObjectId
import io
from app.core.database import get_database
from app.core.auth import get_current_active_user
from app.models.user import UserResponse
from app.models.group import (
    GroupCreate, GroupUpdate, GroupResponse, GroupListResponse, GroupFilter,
    UserInGroupCreate, UserInGroupResponse, UserInGroupListResponse,
    AddContactsToGroupRequest, RemoveContactsFromGroupRequest, GroupStatsResponse
)

router = APIRouter()

@router.get("", response_model=GroupListResponse)
async def get_groups(
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Get groups with filtering and pagination"""
    db = get_database()
    
    # Build filter query
    filter_query = {"user_id": current_user.id}
    
    if search and search.strip():
        filter_query["$or"] = [
            {"name": {"$regex": search.strip(), "$options": "i"}},
            {"description": {"$regex": search.strip(), "$options": "i"}}
        ]
    
    if is_active is not None:
        filter_query["is_active"] = is_active
    
    # Calculate skip
    skip = (page - 1) * limit
    
    # Get groups with member count
    pipeline = [
        {"$match": filter_query},
        {"$lookup": {
            "from": "user_in_groups",
            "localField": "_id",
            "foreignField": "group_id",
            "as": "members"
        }},
        {"$addFields": {
            "member_count": {"$size": "$members"}
        }},
        {"$project": {
            "members": 0  # Remove members array from response
        }},
        {"$sort": {"created_at": -1}},
        {"$skip": skip},
        {"$limit": limit}
    ]
    
    groups_cursor = db.groups.aggregate(pipeline)
    groups = await groups_cursor.to_list(length=limit)
    
    # Get total count
    total = await db.groups.count_documents(filter_query)
    
    # Convert to response format
    groups_response = []
    for group in groups:
        group_dict = dict(group)
        group_dict['id'] = str(group_dict['_id'])
        del group_dict['_id']  # Remove _id field to avoid ObjectId serialization issues
        groups_response.append(GroupResponse(**group_dict))
    
    return GroupListResponse(
        groups=groups_response,
        total=total,
        page=page,
        limit=limit
    )

@router.get("/{group_id}", response_model=GroupResponse)
async def get_group(
    group_id: str,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Get a specific group by ID"""
    db = get_database()
    
    # Get group with member count
    pipeline = [
        {"$match": {
            "_id": group_id,
            "user_id": current_user.id
        }},
        {"$lookup": {
            "from": "user_in_groups",
            "localField": "_id",
            "foreignField": "group_id",
            "as": "members"
        }},
        {"$addFields": {
            "member_count": {"$size": "$members"}
        }},
        {"$project": {
            "members": 0
        }}
    ]
    
    groups_cursor = db.groups.aggregate(pipeline)
    groups = await groups_cursor.to_list(length=1)
    
    if not groups:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    group_dict = dict(groups[0])
    group_dict['id'] = str(group_dict['_id'])
    del group_dict['_id']  # Remove _id field to avoid ObjectId serialization issues
    
    return GroupResponse(**group_dict)

@router.post("", response_model=GroupResponse)
async def create_group(
    group_data: GroupCreate,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Create a new group"""
    db = get_database()
    
    # Check if group name already exists for this user
    existing_group = await db.groups.find_one({
        "name": group_data.name,
        "user_id": current_user.id
    })
    
    if existing_group:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Group name already exists"
        )
    
    group_doc = {
        "_id": str(ObjectId()),
        "user_id": current_user.id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        **group_data.dict()
    }
    
    await db.groups.insert_one(group_doc)
    
    group_dict = dict(group_doc)
    group_dict['id'] = group_dict['_id']
    group_dict['member_count'] = 0
    
    return GroupResponse(**group_dict)

@router.put("/{group_id}", response_model=GroupResponse)
async def update_group(
    group_id: str,
    group_update: GroupUpdate,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Update a group"""
    db = get_database()
    
    # Check if group exists and belongs to user
    existing_group = await db.groups.find_one({
        "_id": group_id,
        "user_id": current_user.id
    })
    
    if not existing_group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Check if new name conflicts with existing groups
    if group_update.name and group_update.name != existing_group["name"]:
        name_conflict = await db.groups.find_one({
            "name": group_update.name,
            "user_id": current_user.id,
            "_id": {"$ne": group_id}
        })
        
        if name_conflict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Group name already exists"
            )
    
    # Build update data
    update_data = {"updated_at": datetime.utcnow()}
    for field, value in group_update.dict(exclude_unset=True).items():
        if value is not None:
            update_data[field] = value
    
    # Update group
    await db.groups.update_one(
        {"_id": group_id},
        {"$set": update_data}
    )
    
    # Get updated group with member count
    pipeline = [
        {"$match": {"_id": group_id}},
        {"$lookup": {
            "from": "user_in_groups",
            "localField": "_id",
            "foreignField": "group_id",
            "as": "members"
        }},
        {"$addFields": {
            "member_count": {"$size": "$members"}
        }},
        {"$project": {
            "members": 0
        }}
    ]
    
    groups_cursor = db.groups.aggregate(pipeline)
    groups = await groups_cursor.to_list(length=1)
    
    group_dict = dict(groups[0])
    group_dict['id'] = str(group_dict['_id'])
    del group_dict['_id']  # Remove _id field to avoid ObjectId serialization issues
    
    return GroupResponse(**group_dict)

@router.delete("/{group_id}")
async def delete_group(
    group_id: str,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Delete a group and all its member relationships"""
    db = get_database()
    
    # Check if group exists and belongs to user
    existing_group = await db.groups.find_one({
        "_id": group_id,
        "user_id": current_user.id
    })
    
    if not existing_group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Delete all user-group relationships for this group
    await db.user_in_groups.delete_many({"group_id": group_id})
    
    # Delete the group
    result = await db.groups.delete_one({"_id": group_id})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to delete group"
        )
    
    return {"message": "Group deleted successfully"}

@router.get("/{group_id}/members", response_model=UserInGroupListResponse)
async def get_group_members(
    group_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Get members of a specific group"""
    db = get_database()
    
    # Check if group exists and belongs to user
    group = await db.groups.find_one({
        "_id": group_id,
        "user_id": current_user.id
    })
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Calculate skip
    skip = (page - 1) * limit
    
    # Get members with contact details
    pipeline = [
        {"$match": {"group_id": group_id}},
        {"$lookup": {
            "from": "contacts",
            "localField": "contact_id",
            "foreignField": "_id",
            "as": "contact"
        }},
        {"$unwind": "$contact"},
        {"$project": {
            "contact_id": 1,
            "group_id": 1,
            "added_at": 1,
            "added_by": 1,
            "created_at": 1,
            "contact_name": {"$concat": ["$contact.first_name", " ", "$contact.last_name"]},
            "contact_email": "$contact.email",
            "contact_phone": "$contact.phone"
        }},
        {"$sort": {"created_at": -1}},
        {"$skip": skip},
        {"$limit": limit}
    ]
    
    members_cursor = db.user_in_groups.aggregate(pipeline)
    members = await members_cursor.to_list(length=limit)
    
    # Get total count
    total = await db.user_in_groups.count_documents({"group_id": group_id})
    
    # Convert to response format
    members_response = []
    for member in members:
        member_dict = dict(member)
        member_dict['id'] = str(member_dict['_id'])
        del member_dict['_id']  # Remove _id field to avoid ObjectId serialization issues
        members_response.append(UserInGroupResponse(**member_dict))
    
    return UserInGroupListResponse(
        users=members_response,
        total=total,
        page=page,
        limit=limit
    )

@router.get("/{group_id}/available-contacts")
async def get_available_contacts_for_group(
    group_id: str,
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Get contacts that are not yet in this group"""
    db = get_database()
    
    # Check if group exists and belongs to user
    group = await db.groups.find_one({
        "_id": group_id,
        "user_id": current_user.id
    })
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Get contact IDs that are already in this group
    existing_members = await db.user_in_groups.find(
        {"group_id": group_id},
        {"contact_id": 1}
    ).to_list(length=None)
    
    existing_contact_ids = [member["contact_id"] for member in existing_members]
    
    # Build query for contacts not in this group
    query = {
        "user_id": current_user.id,
        "_id": {"$nin": existing_contact_ids}
    }
    
    # Add search filter if provided
    if search:
        query["$or"] = [
            {"first_name": {"$regex": search, "$options": "i"}},
            {"last_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}}
        ]
    
    # Calculate skip
    skip = (page - 1) * limit
    
    # Get contacts
    contacts_cursor = db.contacts.find(query).skip(skip).limit(limit).sort("created_at", -1)
    contacts = await contacts_cursor.to_list(length=limit)
    
    # Get total count
    total = await db.contacts.count_documents(query)
    
    # Convert to response format
    contacts_response = []
    for contact in contacts:
        contact_dict = dict(contact)
        contact_dict['id'] = str(contact_dict['_id'])
        del contact_dict['_id']  # Remove _id field to avoid ObjectId serialization issues
        contacts_response.append(contact_dict)
    
    return {
        "contacts": contacts_response,
        "total": total,
        "page": page,
        "limit": limit
    }

@router.post("/{group_id}/import-contacts")
async def import_contacts_to_group(
    group_id: str,
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Import contacts from Excel file and add them to the group"""
    db = get_database()
    
    # Check if group exists and belongs to user
    group = await db.groups.find_one({
        "_id": group_id,
        "user_id": current_user.id
    })
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Validate file type
    if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be Excel (.xlsx, .xls) or CSV format"
        )
    
    try:
        # Read file content
        content = await file.read()
        
        # Read Excel/CSV file
        if file.filename.endswith('.csv'):
            import pandas as pd
            df = pd.read_csv(io.StringIO(content.decode('utf-8')))
        else:
            import pandas as pd
            df = pd.read_excel(io.BytesIO(content))
        
        # Validate required columns
        required_columns = ['First Name', 'Last Name', 'Email']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required columns: {', '.join(missing_columns)}"
            )
        
        # Get existing phone numbers from user's contacts
        existing_contacts = await db.contacts.find(
            {"user_id": current_user.id},
            {"phone": 1}
        ).to_list(length=None)
        
        existing_phones = set()
        for contact in existing_contacts:
            if contact.get('phone'):
                existing_phones.add(contact['phone'].strip())
        
        # Process contacts
        created_contacts = []
        duplicate_phones = []
        errors = []
        
        for index, row in df.iterrows():
            try:
                first_name = str(row['First Name']).strip()
                last_name = str(row['Last Name']).strip()
                email = str(row.get('Email', '')).strip() if pd.notna(row.get('Email')) else None
                phone = str(row.get('Phone', '')).strip() if pd.notna(row.get('Phone')) else None
                
                # Check for duplicate phone number
                if phone and phone in existing_phones:
                    duplicate_phones.append({
                        "row": index + 2,  # +2 because index starts at 0 and we have header
                        "phone": phone,
                        "name": f"{first_name} {last_name}"
                    })
                    continue
                
                # Create contact data
                contact_data = {
                    "user_id": current_user.id,
                    "first_name": first_name,
                    "last_name": last_name,
                    "email": email if email else None,
                    "phone": phone if phone else None,
                    "company": str(row.get('Company', '')).strip() if pd.notna(row.get('Company')) else None,
                    "status": "lead",  # Default status
                    "source": "import",  # Default source
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
                
                # Insert contact
                result = await db.contacts.insert_one(contact_data)
                contact_id = str(result.inserted_id)
                created_contacts.append(contact_id)
                
                # Add to existing phones set to avoid duplicates in same file
                if phone:
                    existing_phones.add(phone)
                
            except Exception as e:
                errors.append(f"Row {index + 2}: {str(e)}")
        
        # Add created contacts to group
        if created_contacts:
            group_members = []
            for contact_id in created_contacts:
                group_members.append({
                    "contact_id": contact_id,
                    "group_id": group_id,
                    "added_at": datetime.utcnow(),
                    "added_by": current_user.id,
                    "created_at": datetime.utcnow()
                })
            
            await db.user_in_groups.insert_many(group_members)
        
        return {
            "message": "Import completed",
            "created_contacts": len(created_contacts),
            "duplicate_phones": duplicate_phones,
            "errors": errors,
            "created_contact_ids": created_contacts
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error processing file: {str(e)}"
        )

@router.post("/{group_id}/members", response_model=dict)
async def add_contacts_to_group(
    group_id: str,
    request: AddContactsToGroupRequest,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Add contacts to a group"""
    db = get_database()
    
    # Check if group exists and belongs to user
    group = await db.groups.find_one({
        "_id": group_id,
        "user_id": current_user.id
    })
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Check if contacts exist
    existing_contacts = await db.contacts.find({
        "_id": {"$in": request.contact_ids},
        "user_id": current_user.id
    }).to_list(length=None)
    
    existing_contact_ids = [str(contact["_id"]) for contact in existing_contacts]
    invalid_ids = [cid for cid in request.contact_ids if cid not in existing_contact_ids]
    
    if invalid_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid contact IDs: {', '.join(invalid_ids)}"
        )
    
    # Check which contacts are already in the group
    existing_members = await db.user_in_groups.find({
        "group_id": group_id,
        "contact_id": {"$in": request.contact_ids}
    }).to_list(length=None)
    
    existing_member_ids = [member["contact_id"] for member in existing_members]
    new_contact_ids = [cid for cid in request.contact_ids if cid not in existing_member_ids]
    
    if not new_contact_ids:
        return {
            "message": "All contacts are already in the group",
            "added_count": 0,
            "skipped_count": len(request.contact_ids)
        }
    
    # Add new members
    members_to_add = []
    for contact_id in new_contact_ids:
        member_doc = {
            "_id": str(ObjectId()),
            "contact_id": contact_id,
            "group_id": group_id,
            "added_at": datetime.utcnow(),
            "added_by": request.added_by or current_user.id,
            "created_at": datetime.utcnow()
        }
        members_to_add.append(member_doc)
    
    if members_to_add:
        await db.user_in_groups.insert_many(members_to_add)
    
    return {
        "message": "Contacts added to group successfully",
        "added_count": len(new_contact_ids),
        "skipped_count": len(existing_member_ids)
    }

@router.delete("/{group_id}/members", response_model=dict)
async def remove_contacts_from_group(
    group_id: str,
    request: RemoveContactsFromGroupRequest,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Remove contacts from a group"""
    db = get_database()
    
    # Check if group exists and belongs to user
    group = await db.groups.find_one({
        "_id": group_id,
        "user_id": current_user.id
    })
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Remove contacts from group
    result = await db.user_in_groups.delete_many({
        "group_id": group_id,
        "contact_id": {"$in": request.contact_ids}
    })
    
    return {
        "message": "Contacts removed from group successfully",
        "removed_count": result.deleted_count
    }

@router.get("/stats/summary", response_model=GroupStatsResponse)
async def get_group_stats(
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Get group statistics"""
    db = get_database()
    
    # Get total groups
    total_groups = await db.groups.count_documents({"user_id": current_user.id})
    
    # Get active groups
    active_groups = await db.groups.count_documents({
        "user_id": current_user.id,
        "is_active": True
    })
    
    # Get total members across all groups
    total_members = await db.user_in_groups.count_documents({
        "group_id": {"$in": [group["_id"] async for group in db.groups.find({"user_id": current_user.id}, {"_id": 1})]}
    })
    
    # Calculate average members per group
    average_members = total_members / total_groups if total_groups > 0 else 0
    
    return GroupStatsResponse(
        total_groups=total_groups,
        active_groups=active_groups,
        total_members=total_members,
        average_members_per_group=round(average_members, 2)
    )
