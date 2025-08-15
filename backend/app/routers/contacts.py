from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from datetime import datetime
from bson import ObjectId
import pandas as pd
from typing import List
from app.core.database import get_database
from app.core.auth import get_current_active_user
from app.models.user import UserResponse
from app.models.contact import (
    ContactCreate, ContactUpdate, ContactResponse, ContactFilter,
    ContactImport, ContactBulkUpdate
)

router = APIRouter()

@router.post("/", response_model=ContactResponse)
async def create_contact(
    contact_data: ContactCreate,
    current_user: UserResponse = Depends(get_current_active_user)
):
    db = get_database()
    
    # Create contact document
    contact_doc = {
        "_id": str(ObjectId()),
        "user_id": current_user.id,
        "first_name": contact_data.first_name,
        "last_name": contact_data.last_name,
        "email": contact_data.email,
        "phone": contact_data.phone,
        "company": contact_data.company,
        "job_title": contact_data.job_title,
        "status": contact_data.status,
        "source": contact_data.source,
        "notes": contact_data.notes,
        "tags": contact_data.tags,
        "custom_fields": contact_data.custom_fields,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db.contacts.insert_one(contact_doc)
    return ContactResponse(**contact_doc)

@router.get("/", response_model=List[ContactResponse])
async def get_contacts(
    search: str = None,
    status: str = None,
    source: str = None,
    tags: str = None,
    company: str = None,
    limit: int = 50,
    skip: int = 0,
    current_user: UserResponse = Depends(get_current_active_user)
):
    db = get_database()
    
    # Build filter
    filter_query = {"user_id": current_user.id}
    
    if search:
        filter_query["$or"] = [
            {"first_name": {"$regex": search, "$options": "i"}},
            {"last_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"company": {"$regex": search, "$options": "i"}}
        ]
    
    if status:
        filter_query["status"] = status
    if source:
        filter_query["source"] = source
    if company:
        filter_query["company"] = {"$regex": company, "$options": "i"}
    if tags:
        tag_list = [tag.strip() for tag in tags.split(",")]
        filter_query["tags"] = {"$in": tag_list}
    
    # Get contacts
    cursor = db.contacts.find(filter_query).skip(skip).limit(limit).sort("created_at", -1)
    contacts = await cursor.to_list(length=limit)
    
    return [ContactResponse(**contact) for contact in contacts]

@router.get("/{contact_id}", response_model=ContactResponse)
async def get_contact(
    contact_id: str,
    current_user: UserResponse = Depends(get_current_active_user)
):
    db = get_database()
    
    contact = await db.contacts.find_one({
        "_id": contact_id,
        "user_id": current_user.id
    })
    
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )
    
    return ContactResponse(**contact)

@router.put("/{contact_id}", response_model=ContactResponse)
async def update_contact(
    contact_id: str,
    contact_update: ContactUpdate,
    current_user: UserResponse = Depends(get_current_active_user)
):
    db = get_database()
    
    # Check if contact exists and belongs to user
    contact = await db.contacts.find_one({
        "_id": contact_id,
        "user_id": current_user.id
    })
    
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )
    
    # Build update document
    update_data = {"updated_at": datetime.utcnow()}
    if contact_update.first_name is not None:
        update_data["first_name"] = contact_update.first_name
    if contact_update.last_name is not None:
        update_data["last_name"] = contact_update.last_name
    if contact_update.email is not None:
        update_data["email"] = contact_update.email
    if contact_update.phone is not None:
        update_data["phone"] = contact_update.phone
    if contact_update.company is not None:
        update_data["company"] = contact_update.company
    if contact_update.job_title is not None:
        update_data["job_title"] = contact_update.job_title
    if contact_update.status is not None:
        update_data["status"] = contact_update.status
    if contact_update.notes is not None:
        update_data["notes"] = contact_update.notes
    if contact_update.tags is not None:
        update_data["tags"] = contact_update.tags
    if contact_update.custom_fields is not None:
        update_data["custom_fields"] = contact_update.custom_fields
    
    # Update contact
    await db.contacts.update_one(
        {"_id": contact_id, "user_id": current_user.id},
        {"$set": update_data}
    )
    
    # Get updated contact
    updated_contact = await db.contacts.find_one({"_id": contact_id})
    return ContactResponse(**updated_contact)

@router.delete("/{contact_id}")
async def delete_contact(
    contact_id: str,
    current_user: UserResponse = Depends(get_current_active_user)
):
    db = get_database()
    
    result = await db.contacts.delete_one({
        "_id": contact_id,
        "user_id": current_user.id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )
    
    return {"message": "Contact deleted successfully"}

@router.post("/import/csv")
async def import_contacts_csv(
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_active_user)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a CSV"
        )
    
    try:
        # Read CSV file
        df = pd.read_csv(file.file)
        
        # Validate required columns
        required_columns = ['first_name', 'last_name']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required columns: {missing_columns}"
            )
        
        # Convert DataFrame to list of dictionaries
        contacts_data = df.to_dict('records')
        
        # Create contacts
        db = get_database()
        created_contacts = []
        
        for contact_data in contacts_data:
            # Clean and validate data
            contact_doc = {
                "_id": str(ObjectId()),
                "user_id": current_user.id,
                "first_name": str(contact_data.get('first_name', '')).strip(),
                "last_name": str(contact_data.get('last_name', '')).strip(),
                "email": contact_data.get('email', '').strip() if contact_data.get('email') else None,
                "phone": contact_data.get('phone', '').strip() if contact_data.get('phone') else None,
                "company": contact_data.get('company', '').strip() if contact_data.get('company') else None,
                "job_title": contact_data.get('job_title', '').strip() if contact_data.get('job_title') else None,
                "status": "lead",
                "source": "csv_import",
                "notes": contact_data.get('notes', '').strip() if contact_data.get('notes') else None,
                "tags": [],
                "custom_fields": {},
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            # Add custom fields
            for key, value in contact_data.items():
                if key not in ['first_name', 'last_name', 'email', 'phone', 'company', 'job_title', 'notes']:
                    contact_doc['custom_fields'][key] = str(value) if value else None
            
            await db.contacts.insert_one(contact_doc)
            created_contacts.append(ContactResponse(**contact_doc))
        
        return {
            "message": f"Successfully imported {len(created_contacts)} contacts",
            "contacts": created_contacts
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error processing CSV file: {str(e)}"
        )

@router.post("/bulk-update")
async def bulk_update_contacts(
    bulk_update: ContactBulkUpdate,
    current_user: UserResponse = Depends(get_current_active_user)
):
    db = get_database()
    
    # Build update document
    update_data = {"updated_at": datetime.utcnow()}
    if bulk_update.updates.first_name is not None:
        update_data["first_name"] = bulk_update.updates.first_name
    if bulk_update.updates.last_name is not None:
        update_data["last_name"] = bulk_update.updates.last_name
    if bulk_update.updates.email is not None:
        update_data["email"] = bulk_update.updates.email
    if bulk_update.updates.phone is not None:
        update_data["phone"] = bulk_update.updates.phone
    if bulk_update.updates.company is not None:
        update_data["company"] = bulk_update.updates.company
    if bulk_update.updates.job_title is not None:
        update_data["job_title"] = bulk_update.updates.job_title
    if bulk_update.updates.status is not None:
        update_data["status"] = bulk_update.updates.status
    if bulk_update.updates.notes is not None:
        update_data["notes"] = bulk_update.updates.notes
    if bulk_update.updates.tags is not None:
        update_data["tags"] = bulk_update.updates.tags
    if bulk_update.updates.custom_fields is not None:
        update_data["custom_fields"] = bulk_update.updates.custom_fields
    
    # Update contacts
    result = await db.contacts.update_many(
        {
            "_id": {"$in": bulk_update.contact_ids},
            "user_id": current_user.id
        },
        {"$set": update_data}
    )
    
    return {
        "message": f"Successfully updated {result.modified_count} contacts",
        "modified_count": result.modified_count
    }

@router.get("/stats/summary")
async def get_contacts_summary(current_user: UserResponse = Depends(get_current_active_user)):
    db = get_database()
    
    # Get total contacts
    total_contacts = await db.contacts.count_documents({"user_id": current_user.id})
    
    # Get contacts by status
    pipeline = [
        {"$match": {"user_id": current_user.id}},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    status_counts = await db.contacts.aggregate(pipeline).to_list(None)
    
    # Get contacts by source
    pipeline = [
        {"$match": {"user_id": current_user.id}},
        {"$group": {"_id": "$source", "count": {"$sum": 1}}}
    ]
    source_counts = await db.contacts.aggregate(pipeline).to_list(None)
    
    return {
        "total_contacts": total_contacts,
        "by_status": {item["_id"]: item["count"] for item in status_counts},
        "by_source": {item["_id"]: item["count"] for item in source_counts}
    } 