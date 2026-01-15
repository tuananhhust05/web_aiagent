from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from datetime import datetime
from bson import ObjectId
import pandas as pd
from typing import List, Optional, Dict, Any
from app.core.database import get_database
from app.core.auth import get_current_active_user
from app.models.user import UserResponse
from app.models.contact import (
    ContactCreate, ContactUpdate, ContactResponse, ContactFilter,
    ContactImport, ContactBulkUpdate
)
from pydantic import BaseModel

router = APIRouter()

# Response models for detailed contact endpoint
class CampaignGoalInfo(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    color_gradient: Optional[str] = None
    is_active: Optional[bool] = None
    source: Optional[str] = None

class WorkflowInfo(BaseModel):
    id: Optional[str] = None
    function: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    nodes: Optional[List[Dict[str, Any]]] = None
    connections: Optional[List[Dict[str, Any]]] = None

class CampaignInfo(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    status: str
    type: str
    source: Optional[str] = None
    campaign_goal: Optional[CampaignGoalInfo] = None
    workflow: Optional[WorkflowInfo] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class DealInfo(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    amount: float = 0.0
    revenue: float = 0.0
    cost: float = 0.0
    probability: Optional[float] = None
    expected_close_date: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class ContactDetailResponse(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    telegram_username: Optional[str] = None
    whatsapp_number: Optional[str] = None
    linkedin_profile: Optional[str] = None
    company: Optional[str] = None
    job_title: Optional[str] = None
    status: str
    source: str
    created_at: datetime
    updated_at: datetime
    campaigns: List[CampaignInfo] = []
    deals: List[DealInfo] = []

@router.post("", response_model=ContactResponse)
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
        "telegram_username": contact_data.telegram_username,
        "whatsapp_number": contact_data.whatsapp_number,
        "linkedin_profile": contact_data.linkedin_profile,
        "company": contact_data.company,
        "job_title": contact_data.job_title,
        "address": contact_data.address,
        "city": contact_data.city,
        "state": contact_data.state,
        "country": contact_data.country,
        "postal_code": contact_data.postal_code,
        "status": contact_data.status,
        "source": contact_data.source,
        "notes": contact_data.notes,
        "tags": contact_data.tags,
        "custom_fields": contact_data.custom_fields,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db.contacts.insert_one(contact_doc)
    
    # Ensure id field is properly set
    contact_doc['id'] = contact_doc['_id']
    
    return ContactResponse(**contact_doc)

@router.get("", response_model=List[ContactResponse])
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
    
    # Convert to ContactResponse and ensure id field is properly set
    contact_responses = []
    for contact in contacts:
        contact_dict = dict(contact)
        contact_dict['id'] = str(contact_dict['_id'])  # Convert ObjectId to string
        del contact_dict['_id']  # Remove _id field to avoid conflict
        contact_responses.append(ContactResponse(**contact_dict))
    
    return contact_responses

# IMPORTANT: Route /detailed must be defined BEFORE /{contact_id}
# Otherwise FastAPI will treat "detailed" as a contact_id
@router.get("/detailed", response_model=List[ContactDetailResponse])
async def get_contacts_detailed(
    search: Optional[str] = None,
    status: Optional[str] = None,
    source: Optional[str] = None,
    limit: int = 100,
    skip: int = 0,
    current_user: UserResponse = Depends(get_current_active_user)
):
    print("search ....", search)
    """
    Get all contacts with detailed information including:
    - Campaigns containing the contact (with campaign goals and workflows)
    - Deals related to the contact
    """
    db = get_database()
    
    # Build filter query
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
    
    # Get contacts
    cursor = db.contacts.find(filter_query).skip(skip).limit(limit).sort("created_at", -1)
    contacts = await cursor.to_list(length=limit)
    print("contacts ....", contacts)
    
    # Get all contact IDs
    contact_ids = [str(contact["_id"]) for contact in contacts]
    
    # Get all campaigns that contain any of these contacts
    campaigns_cursor = db.campaigns.find({
        "user_id": current_user.id,
        "contacts": {"$in": contact_ids}
    })
    all_campaigns = await campaigns_cursor.to_list(length=None)
    
    # Get all campaign goal IDs and workflow IDs
    campaign_goal_ids = []
    workflow_ids = []
    for campaign in all_campaigns:
        if campaign.get("campaign_goal_id"):
            campaign_goal_ids.append(campaign["campaign_goal_id"])
        if campaign.get("workflow_id"):
            workflow_ids.append(campaign["workflow_id"])
    
    # Get all campaign goals
    campaign_goals = {}
    if campaign_goal_ids:
        # Remove duplicates
        unique_goal_ids = list(set([gid for gid in campaign_goal_ids if gid]))
        
        # Convert goal IDs to ObjectIds, filtering out invalid ones
        valid_goal_object_ids = []
        invalid_goal_ids = []
        goal_id_mapping = {}  # Map ObjectId string back to original ID
        
        for gid in unique_goal_ids:
            try:
                goal_obj_id = ObjectId(gid)
                goal_str_id = str(goal_obj_id)
                valid_goal_object_ids.append(goal_obj_id)
                # Map both original ID and ObjectId string to the same goal
                goal_id_mapping[gid] = goal_str_id
                goal_id_mapping[goal_str_id] = goal_str_id
            except:
                # If not valid ObjectId, keep as string for later query
                invalid_goal_ids.append(gid)
                goal_id_mapping[gid] = gid
        
        # Query goals by ObjectId
        if valid_goal_object_ids:
            goals_cursor = db.campaign_goals.find({
                "user_id": current_user.id,
                "_id": {"$in": valid_goal_object_ids}
            })
            goals_list = await goals_cursor.to_list(length=None)
            for goal in goals_list:
                goal_id = str(goal["_id"])
                goal_data = {
                    "id": goal_id,
                    "name": goal.get("name", ""),
                    "description": goal.get("description"),
                    "color_gradient": goal.get("color_gradient"),
                    "is_active": goal.get("is_active", True),
                    "source": goal.get("source")
                }
                # Store with ObjectId string as key
                campaign_goals[goal_id] = goal_data
                # Also store with original ID if different
                for orig_id, mapped_id in goal_id_mapping.items():
                    if mapped_id == goal_id:
                        campaign_goals[orig_id] = goal_data
        
        # Query goals by string ID (for non-ObjectId format)
        if invalid_goal_ids:
            for gid in invalid_goal_ids:
                goal = await db.campaign_goals.find_one({
                    "user_id": current_user.id,
                    "_id": gid
                })
                if goal:
                    goal_id = str(goal["_id"])
                    goal_data = {
                        "id": goal_id,
                        "name": goal.get("name", ""),
                        "description": goal.get("description"),
                        "color_gradient": goal.get("color_gradient"),
                        "is_active": goal.get("is_active", True),
                        "source": goal.get("source")
                    }
                    campaign_goals[gid] = goal_data
                    campaign_goals[goal_id] = goal_data
    
    # Get all workflows
    workflows = {}
    if workflow_ids:
        # Try to find workflows by ID first
        valid_workflow_object_ids = []
        for wid in workflow_ids:
            if wid:
                try:
                    valid_workflow_object_ids.append(ObjectId(wid))
                except:
                    pass
        
        if valid_workflow_object_ids:
            workflows_cursor = db.workflows.find({
                "user_id": current_user.id,
                "_id": {"$in": valid_workflow_object_ids}
            })
            workflows_list = await workflows_cursor.to_list(length=None)
            for workflow in workflows_list:
                workflow_id = str(workflow["_id"])
                workflows[workflow_id] = {
                    "id": workflow_id,
                    "function": workflow.get("function", ""),
                    "name": workflow.get("name"),
                    "description": workflow.get("description"),
                    "nodes": workflow.get("nodes", []),
                    "connections": workflow.get("connections", [])
                }
        
        # Also try to find workflows by function name for those that weren't found
        for wid in workflow_ids:
            if wid not in workflows:
                # Try as function name
                workflow_by_function = await db.workflows.find_one({
                    "user_id": current_user.id,
                    "function": wid
                })
                if workflow_by_function:
                    workflows[wid] = {
                        "id": str(workflow_by_function["_id"]),
                        "function": workflow_by_function.get("function", wid),
                        "name": workflow_by_function.get("name"),
                        "description": workflow_by_function.get("description"),
                        "nodes": workflow_by_function.get("nodes", []),
                        "connections": workflow_by_function.get("connections", [])
                    }
    
    # Get all deals for these contacts
    deals_cursor = db.deals.find({
        "user_id": current_user.id,
        "contact_id": {"$in": contact_ids}
    })
    all_deals = await deals_cursor.to_list(length=None)
    
    # Organize deals by contact_id
    deals_by_contact = {}
    for deal in all_deals:
        contact_id = deal.get("contact_id")
        if contact_id:
            if contact_id not in deals_by_contact:
                deals_by_contact[contact_id] = []
            deals_by_contact[contact_id].append({
                "id": str(deal["_id"]),
                "name": deal.get("name", ""),
                "description": deal.get("description"),
                "status": deal.get("status"),
                "priority": deal.get("priority"),
                "amount": deal.get("amount", 0.0),
                "revenue": deal.get("revenue", 0.0),
                "cost": deal.get("cost", 0.0),
                "probability": deal.get("probability"),
                "expected_close_date": deal.get("expected_close_date"),
                "created_at": deal.get("created_at"),
                "updated_at": deal.get("updated_at")
            })
    
    # Build response
    result = []
    for contact in contacts:
        contact_id = str(contact["_id"])
        
        # Find campaigns containing this contact (only campaigns with workflow)
        contact_campaigns = []
        for campaign in all_campaigns:
            # Only include campaigns that have a workflow_id
            workflow_id = campaign.get("workflow_id")
            if contact_id in campaign.get("contacts", []) and workflow_id:
                campaign_info = {
                    "id": str(campaign["_id"]),
                    "name": campaign.get("name", ""),
                    "description": campaign.get("description"),
                    "status": campaign.get("status", ""),
                    "type": campaign.get("type", ""),
                    "source": campaign.get("source"),
                    "created_at": campaign.get("created_at"),
                    "updated_at": campaign.get("updated_at")
                }
                
                # Add campaign goal if exists
                goal_id = campaign.get("campaign_goal_id")
                if goal_id and goal_id in campaign_goals:
                    campaign_info["campaign_goal"] = CampaignGoalInfo(**campaign_goals[goal_id])
                
                # Add workflow (required - we already checked workflow_id exists)
                if workflow_id:
                    # Try to find workflow by ID or function name
                    workflow_data = None
                    # First try to find in already loaded workflows by exact ID match
                    if workflow_id in workflows:
                        workflow_data = workflows[workflow_id]
                    else:
                        # Try to find by converting to ObjectId and matching
                        try:
                            workflow_obj_id = ObjectId(workflow_id)
                            workflow_str_id = str(workflow_obj_id)
                            if workflow_str_id in workflows:
                                workflow_data = workflows[workflow_str_id]
                        except:
                            pass
                        
                        # If still not found, try to find by function name
                        if not workflow_data:
                            workflow_by_function = await db.workflows.find_one({
                                "user_id": current_user.id,
                                "function": workflow_id
                            })
                            if workflow_by_function:
                                workflow_data = {
                                    "id": str(workflow_by_function["_id"]),
                                    "function": workflow_by_function.get("function", workflow_id),
                                    "name": workflow_by_function.get("name"),
                                    "description": workflow_by_function.get("description"),
                                    "nodes": workflow_by_function.get("nodes", []),
                                    "connections": workflow_by_function.get("connections", [])
                                }
                    
                    if workflow_data:
                        campaign_info["workflow"] = WorkflowInfo(**workflow_data)
                
                contact_campaigns.append(CampaignInfo(**campaign_info))
        
        # Get deals for this contact
        contact_deals = deals_by_contact.get(contact_id, [])
        
        # Build contact response
        contact_dict = dict(contact)
        contact_dict['id'] = contact_id
        del contact_dict['_id']
        
        result.append(ContactDetailResponse(
            **contact_dict,
            campaigns=contact_campaigns,
            deals=[DealInfo(**deal) for deal in contact_deals]
        ))
    
    return result

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
    
    # Ensure id field is properly set
    contact_dict = dict(contact)
    contact_dict['id'] = str(contact_dict['_id'])
    del contact_dict['_id']  # Remove _id field to avoid conflict
    
    return ContactResponse(**contact_dict)

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
    print(f"🔧 [DEBUG] Updating contact {contact_id} with data: {contact_update.dict()}")
    update_data = {"updated_at": datetime.utcnow()}
    if contact_update.first_name is not None:
        update_data["first_name"] = contact_update.first_name
    if contact_update.last_name is not None:
        update_data["last_name"] = contact_update.last_name
    if contact_update.email is not None:
        update_data["email"] = contact_update.email
    if contact_update.phone is not None:
        update_data["phone"] = contact_update.phone
    if contact_update.telegram_username is not None:
        update_data["telegram_username"] = contact_update.telegram_username
    if contact_update.whatsapp_number is not None:
        update_data["whatsapp_number"] = contact_update.whatsapp_number
    if contact_update.linkedin_profile is not None:
        update_data["linkedin_profile"] = contact_update.linkedin_profile if contact_update.linkedin_profile.strip() else None
    if contact_update.company is not None:
        update_data["company"] = contact_update.company
    if contact_update.job_title is not None:
        update_data["job_title"] = contact_update.job_title
    if contact_update.address is not None:
        update_data["address"] = contact_update.address
    if contact_update.city is not None:
        update_data["city"] = contact_update.city
    if contact_update.state is not None:
        update_data["state"] = contact_update.state
    if contact_update.country is not None:
        update_data["country"] = contact_update.country
    if contact_update.postal_code is not None:
        update_data["postal_code"] = contact_update.postal_code
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
    contact_dict = dict(updated_contact)
    contact_dict['id'] = str(contact_dict['_id'])
    del contact_dict['_id']  # Remove _id field to avoid conflict
    return ContactResponse(**contact_dict)

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
                "telegram_username": contact_data.get('telegram_username', '').strip() if contact_data.get('telegram_username') else None,
                "whatsapp_number": contact_data.get('whatsapp_number', '').strip() if contact_data.get('whatsapp_number') else None,
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
                if key not in ['first_name', 'last_name', 'email', 'phone', 'telegram_username', 'whatsapp_number', 'company', 'job_title', 'notes']:
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
    if bulk_update.updates.telegram_username is not None:
        update_data["telegram_username"] = bulk_update.updates.telegram_username
    if bulk_update.updates.whatsapp_number is not None:
        update_data["whatsapp_number"] = bulk_update.updates.whatsapp_number
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