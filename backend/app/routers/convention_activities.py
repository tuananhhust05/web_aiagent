from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
from app.core.database import get_database
from app.core.auth import get_current_active_user
from app.models.user import UserResponse
from app.models.contact import ContactStatus, ContactResponse
from pydantic import BaseModel

router = APIRouter()

class ContactStatusUpdate(BaseModel):
    contact_id: str
    status: ContactStatus

class ConventionActivityContact(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    whatsapp_number: Optional[str] = None
    telegram_username: Optional[str] = None
    linkedin_profile: Optional[str] = None
    status: ContactStatus
    campaigns: List[Dict[str, Any]] = []
    created_at: datetime
    updated_at: datetime

class ConventionActivityResponse(BaseModel):
    contacts: List[ConventionActivityContact]
    total_contacts: int
    total_customers: int
    total_leads: int
    total_in_campaigns: int
    total_not_in_campaigns: int

@router.get("", response_model=ConventionActivityResponse)
async def get_convention_activities(
    is_customer: Optional[bool] = Query(None, description="Filter by customer status"),
    has_campaigns: Optional[bool] = Query(None, description="Filter by campaign participation"),
    search: Optional[str] = Query(None, description="Search by name, email, or phone"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Get convention activities with contact listing and filtering"""
    db = get_database()
    
    # Build filter query
    filter_query = {"user_id": current_user.id}
    
    # Add customer status filter
    if is_customer is not None:
        if is_customer:
            filter_query["status"] = ContactStatus.CUSTOMER
        else:
            filter_query["status"] = {"$ne": ContactStatus.CUSTOMER}
    
    # Add search filter
    if search:
        filter_query["$or"] = [
            {"first_name": {"$regex": search, "$options": "i"}},
            {"last_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}}
        ]
    
    # Get contacts
    contacts_cursor = db.contacts.find(filter_query).skip(offset).limit(limit)
    contacts = await contacts_cursor.to_list(length=limit)
    
    # Get all contact IDs for campaign lookup
    contact_ids = [contact["_id"] for contact in contacts]
    
    # Get campaigns for these contacts
    campaigns_cursor = db.campaigns.find({
        "user_id": current_user.id,
        "contacts": {"$in": contact_ids}
    })
    campaigns = await campaigns_cursor.to_list(length=None)
    
    # Create a map of contact_id -> campaigns
    contact_campaigns_map = {}
    for campaign in campaigns:
        for contact_id in campaign.get("contacts", []):
            if contact_id not in contact_campaigns_map:
                contact_campaigns_map[contact_id] = []
            contact_campaigns_map[contact_id].append({
                "id": str(campaign["_id"]),
                "name": campaign.get("name", ""),
                "status": campaign.get("status", ""),
                "type": campaign.get("type", ""),
                "created_at": campaign.get("created_at")
            })
    
    # Filter contacts by campaign participation if specified
    filtered_contacts = []
    for contact in contacts:
        contact_id = contact["_id"]
        contact_campaigns = contact_campaigns_map.get(contact_id, [])
        
        if has_campaigns is not None:
            if has_campaigns and len(contact_campaigns) == 0:
                continue
            elif not has_campaigns and len(contact_campaigns) > 0:
                continue
        
        # Convert contact to response format
        contact_dict = dict(contact)
        contact_dict['id'] = str(contact_dict['_id'])
        del contact_dict['_id']
        
        filtered_contacts.append(ConventionActivityContact(
            **contact_dict,
            campaigns=contact_campaigns
        ))
    
    # Get statistics
    total_contacts = await db.contacts.count_documents({"user_id": current_user.id})
    total_customers = await db.contacts.count_documents({
        "user_id": current_user.id,
        "status": ContactStatus.CUSTOMER
    })
    total_leads = await db.contacts.count_documents({
        "user_id": current_user.id,
        "status": {"$ne": ContactStatus.CUSTOMER}
    })
    
    # Count contacts in campaigns
    contacts_in_campaigns = await db.campaigns.distinct("contacts", {"user_id": current_user.id})
    total_in_campaigns = len(contacts_in_campaigns)
    total_not_in_campaigns = total_contacts - total_in_campaigns
    
    return ConventionActivityResponse(
        contacts=filtered_contacts,
        total_contacts=total_contacts,
        total_customers=total_customers,
        total_leads=total_leads,
        total_in_campaigns=total_in_campaigns,
        total_not_in_campaigns=total_not_in_campaigns
    )

@router.put("/contact-status")
async def update_contact_status(
    status_update: ContactStatusUpdate,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Update contact status (lead to customer or vice versa)"""
    db = get_database()
    
    # Check if contact exists and belongs to user
    contact = await db.contacts.find_one({
        "_id": ObjectId(status_update.contact_id),
        "user_id": current_user.id
    })
    
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )
    
    # Update contact status
    result = await db.contacts.update_one(
        {"_id": ObjectId(status_update.contact_id)},
        {
            "$set": {
                "status": status_update.status,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update contact status"
        )
    
    return {
        "message": f"Contact status updated to {status_update.status}",
        "contact_id": status_update.contact_id,
        "new_status": status_update.status
    }

@router.get("/stats")
async def get_convention_stats(
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Get convention activities statistics"""
    db = get_database()
    
    # Get basic counts
    total_contacts = await db.contacts.count_documents({"user_id": current_user.id})
    total_customers = await db.contacts.count_documents({
        "user_id": current_user.id,
        "status": ContactStatus.CUSTOMER
    })
    total_leads = await db.contacts.count_documents({
        "user_id": current_user.id,
        "status": {"$ne": ContactStatus.CUSTOMER}
    })
    
    # Get campaign participation stats
    contacts_in_campaigns = await db.campaigns.distinct("contacts", {"user_id": current_user.id})
    total_in_campaigns = len(contacts_in_campaigns)
    total_not_in_campaigns = total_contacts - total_in_campaigns
    
    # Get contact source distribution
    source_pipeline = [
        {"$match": {"user_id": current_user.id}},
        {"$group": {"_id": "$source", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    source_stats = await db.contacts.aggregate(source_pipeline).to_list(length=None)
    
    # Get status distribution
    status_pipeline = [
        {"$match": {"user_id": current_user.id}},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    status_stats = await db.contacts.aggregate(status_pipeline).to_list(length=None)
    
    # Count convention campaigns (campaigns with source="convention-activities")
    total_convention_campaigns = await db.campaigns.count_documents({
        "user_id": current_user.id,
        "source": "convention-activities"
    })
    
    # Count campaign goals
    total_campaign_goals = await db.campaign_goals.count_documents({
        "user_id": current_user.id
    })
    
    return {
        "total_contacts": total_contacts,
        "total_customers": total_customers,
        "total_leads": total_leads,
        "total_in_campaigns": total_in_campaigns,
        "total_not_in_campaigns": total_not_in_campaigns,
        "total_convention_campaigns": total_convention_campaigns,
        "total_campaign_goals": total_campaign_goals,
        "source_distribution": source_stats,
        "status_distribution": status_stats,
        "conversion_rate": round((total_customers / total_contacts * 100), 2) if total_contacts > 0 else 0
    }

