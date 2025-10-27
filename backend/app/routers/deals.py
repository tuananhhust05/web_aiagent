from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from datetime import datetime, date
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..core.database import get_database
from ..core.auth import get_current_active_user, UserResponse
from ..models.deal import (
    DealCreate, 
    DealUpdate, 
    DealResponse, 
    DealListResponse, 
    DealStats,
    DealStatus
)

router = APIRouter()

@router.get("/all", response_model=DealListResponse)
async def get_deals(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    status: Optional[DealStatus] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search in name and description"),
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get deals with pagination, filtering and statistics"""
    
    # Build filter
    filter_query = {"user_id": current_user.id}
    
    if status:
        filter_query["status"] = status.value
    
    if search:
        filter_query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    # Get total count
    total = await db.deals.count_documents(filter_query)
    
    # Get deals with pagination
    skip = (page - 1) * limit
    deals_cursor = db.deals.find(filter_query).skip(skip).limit(limit).sort("created_at", -1)
    deals = await deals_cursor.to_list(length=limit)
    
    # Populate contact and campaign information
    populated_deals = []
    for deal in deals:
        # Get contact info
        contact = await db.contacts.find_one({"_id": ObjectId(deal["contact_id"])})
        if contact:
            contact_name = f"{contact.get('first_name', '')} {contact.get('last_name', '')}".strip() or "Unknown"
            contact_email = contact.get("email", "")
            contact_phone = contact.get("phone", "")
        else:
            contact_name = "Unknown"
            contact_email = ""
            contact_phone = ""
        
        # Get campaign info
        campaign_name = None
        if deal.get("campaign_id"):
            campaign = await db.campaigns.find_one({"_id": ObjectId(deal["campaign_id"])})
            campaign_name = campaign.get("name", "Unknown") if campaign else None
        
        populated_deal = {
            **deal,
            "id": str(deal["_id"]),
            "contact_name": contact_name,
            "contact_email": contact_email,
            "contact_phone": contact_phone,
            "campaign_name": campaign_name
        }
        populated_deals.append(DealResponse(**populated_deal))
    
    # Calculate statistics
    stats_pipeline = [
        {"$match": {"user_id": current_user.id}},
        {
            "$group": {
                "_id": None,
                "total_deals": {"$sum": 1},
                "total_revenue": {"$sum": "$revenue"},
                "total_cost": {"$sum": "$cost"},
                "new_deals": {
                    "$sum": {"$cond": [{"$eq": ["$status", "new"]}, 1, 0]}
                },
                "contacted_deals": {
                    "$sum": {"$cond": [{"$eq": ["$status", "contacted"]}, 1, 0]}
                },
                "negotiation_deals": {
                    "$sum": {"$cond": [{"$eq": ["$status", "negotiation"]}, 1, 0]}
                }
            }
        }
    ]
    
    stats_result = await db.deals.aggregate(stats_pipeline).to_list(1)
    stats = stats_result[0] if stats_result else {
        "total_deals": 0,
        "total_revenue": 0.0,
        "total_cost": 0.0,
        "new_deals": 0,
        "contacted_deals": 0,
        "negotiation_deals": 0
    }
    
    stats["total_profit"] = stats["total_revenue"] - stats["total_cost"]
    
    return DealListResponse(
        deals=populated_deals,
        total=total,
        page=page,
        limit=limit,
        stats=DealStats(**stats)
    )

@router.get("/stats", response_model=DealStats)
async def get_deal_stats(
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get deal statistics"""
    
    stats_pipeline = [
        {"$match": {"user_id": current_user.id}},
        {
            "$group": {
                "_id": None,
                "total_deals": {"$sum": 1},
                "total_revenue": {"$sum": "$revenue"},
                "total_cost": {"$sum": "$cost"},
                "new_deals": {
                    "$sum": {"$cond": [{"$eq": ["$status", "new"]}, 1, 0]}
                },
                "contacted_deals": {
                    "$sum": {"$cond": [{"$eq": ["$status", "contacted"]}, 1, 0]}
                },
                "negotiation_deals": {
                    "$sum": {"$cond": [{"$eq": ["$status", "negotiation"]}, 1, 0]}
                }
            }
        }
    ]
    
    stats_result = await db.deals.aggregate(stats_pipeline).to_list(1)
    stats = stats_result[0] if stats_result else {
        "total_deals": 0,
        "total_revenue": 0.0,
        "total_cost": 0.0,
        "new_deals": 0,
        "contacted_deals": 0,
        "negotiation_deals": 0
    }
    
    stats["total_profit"] = stats["total_revenue"] - stats["total_cost"]
    
    return DealStats(**stats)

@router.get("/{deal_id}", response_model=DealResponse)
async def get_deal(
    deal_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get deal by ID"""
    
    if not ObjectId.is_valid(deal_id):
        raise HTTPException(status_code=400, detail="Invalid deal ID")
    
    deal = await db.deals.find_one({
        "_id": ObjectId(deal_id),
        "user_id": current_user.id
    })
    
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    # Get contact info
    contact = await db.contacts.find_one({"_id": ObjectId(deal["contact_id"])})
    if contact:
        contact_name = f"{contact.get('first_name', '')} {contact.get('last_name', '')}".strip() or "Unknown"
    else:
        contact_name = "Unknown"
    contact_email = contact.get("email", "") if contact else ""
    contact_phone = contact.get("phone", "") if contact else ""
    
    # Get campaign info
    campaign_name = None
    if deal.get("campaign_id"):
        campaign = await db.campaigns.find_one({"_id": ObjectId(deal["campaign_id"])})
        campaign_name = campaign.get("name", "Unknown") if campaign else None
    
    populated_deal = {
        **deal,
        "id": str(deal["_id"]),
        "contact_name": contact_name,
        "contact_email": contact_email,
        "contact_phone": contact_phone,
        "campaign_name": campaign_name
    }
    
    return DealResponse(**populated_deal)

@router.post("/create", response_model=DealResponse)
async def create_deal(
    deal_data: DealCreate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create a new deal"""
    
    # Validate contact exists - search by string ID
    # First try to find contact with user_id
    contact = await db.contacts.find_one({
        "_id": deal_data.contact_id,
        "user_id": current_user.id
    })
    
    # If not found, try without user_id (for legacy contacts)
    if not contact:
        contact = await db.contacts.find_one({
            "_id": deal_data.contact_id
        })
    
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    # Validate campaign exists if provided
    if deal_data.campaign_id:
        if not ObjectId.is_valid(deal_data.campaign_id):
            raise HTTPException(status_code=400, detail="Invalid campaign ID")
        
        campaign = await db.campaigns.find_one({
            "_id": ObjectId(deal_data.campaign_id),
            "user_id": current_user.id
        })
        
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Create deal
    now = datetime.utcnow()
    deal_dict = deal_data.dict()
    
    # Convert date fields to datetime for MongoDB compatibility
    if deal_dict.get("start_date") and isinstance(deal_dict["start_date"], date):
        deal_dict["start_date"] = datetime.combine(deal_dict["start_date"], datetime.min.time())
    
    if deal_dict.get("end_date") and isinstance(deal_dict["end_date"], date):
        deal_dict["end_date"] = datetime.combine(deal_dict["end_date"], datetime.min.time())
    
    deal_doc = {
        **deal_dict,
        "user_id": current_user.id,
        "created_at": now,
        "updated_at": now
    }
    
    result = await db.deals.insert_one(deal_doc)
    deal_doc["_id"] = result.inserted_id
    deal_doc["id"] = str(result.inserted_id)
    
    # Get contact and campaign info for response
    contact_name = f"{contact.get('first_name', '')} {contact.get('last_name', '')}".strip() or "Unknown"
    contact_email = contact.get("email", "")
    contact_phone = contact.get("phone", "")
    
    campaign_name = None
    if deal_data.campaign_id:
        campaign_name = campaign.get("name", "Unknown")
    
    populated_deal = {
        **deal_doc,
        "contact_name": contact_name,
        "contact_email": contact_email,
        "contact_phone": contact_phone,
        "campaign_name": campaign_name
    }
    
    return DealResponse(**populated_deal)

@router.put("/{deal_id}", response_model=DealResponse)
async def update_deal(
    deal_id: str,
    deal_data: DealUpdate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update a deal"""
    
    if not ObjectId.is_valid(deal_id):
        raise HTTPException(status_code=400, detail="Invalid deal ID")
    
    # Check if deal exists
    existing_deal = await db.deals.find_one({
        "_id": ObjectId(deal_id),
        "user_id": current_user.id
    })
    
    if not existing_deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    # Validate contact if provided
    if deal_data.contact_id:
        if not ObjectId.is_valid(deal_data.contact_id):
            raise HTTPException(status_code=400, detail="Invalid contact ID")
        
        contact = await db.contacts.find_one({
            "_id": ObjectId(deal_data.contact_id),
            "user_id": current_user.id
        })
        
        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found")
    
    # Validate campaign if provided
    if deal_data.campaign_id:
        if not ObjectId.is_valid(deal_data.campaign_id):
            raise HTTPException(status_code=400, detail="Invalid campaign ID")
        
        campaign = await db.campaigns.find_one({
            "_id": ObjectId(deal_data.campaign_id),
            "user_id": current_user.id
        })
        
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Update deal
    deal_dict = deal_data.dict()
    
    # Convert date fields to datetime for MongoDB compatibility
    if deal_dict.get("start_date") and isinstance(deal_dict["start_date"], date):
        deal_dict["start_date"] = datetime.combine(deal_dict["start_date"], datetime.min.time())
    
    if deal_dict.get("end_date") and isinstance(deal_dict["end_date"], date):
        deal_dict["end_date"] = datetime.combine(deal_dict["end_date"], datetime.min.time())
    
    update_data = {k: v for k, v in deal_dict.items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await db.deals.update_one(
        {"_id": ObjectId(deal_id)},
        {"$set": update_data}
    )
    
    # Get updated deal
    updated_deal = await db.deals.find_one({"_id": ObjectId(deal_id)})
    
    # Get contact info
    contact_id = deal_data.contact_id or existing_deal["contact_id"]
    contact = await db.contacts.find_one({"_id": ObjectId(contact_id)})
    if contact:
        contact_name = f"{contact.get('first_name', '')} {contact.get('last_name', '')}".strip() or "Unknown"
    else:
        contact_name = "Unknown"
    contact_email = contact.get("email", "") if contact else ""
    contact_phone = contact.get("phone", "") if contact else ""
    
    # Get campaign info
    campaign_id = deal_data.campaign_id or existing_deal.get("campaign_id")
    campaign_name = None
    if campaign_id:
        campaign = await db.campaigns.find_one({"_id": ObjectId(campaign_id)})
        campaign_name = campaign.get("name", "Unknown") if campaign else None
    
    populated_deal = {
        **updated_deal,
        "id": str(updated_deal["_id"]),
        "contact_name": contact_name,
        "contact_email": contact_email,
        "contact_phone": contact_phone,
        "campaign_name": campaign_name
    }
    
    return DealResponse(**populated_deal)

@router.delete("/{deal_id}")
async def delete_deal(
    deal_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete a deal"""
    
    if not ObjectId.is_valid(deal_id):
        raise HTTPException(status_code=400, detail="Invalid deal ID")
    
    result = await db.deals.delete_one({
        "_id": ObjectId(deal_id),
        "user_id": current_user.id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    return {"message": "Deal deleted successfully"}

@router.get("/contacts/list")
async def get_contacts_for_deals(
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get contacts list for deal creation"""
    
    contacts_cursor = db.contacts.find(
        {"user_id": current_user.id},
        {"name": 1, "email": 1, "phone": 1}
    ).sort("name", 1)
    
    contacts = await contacts_cursor.to_list(length=None)
    
    return [
        {
            "id": str(contact["_id"]),
            "name": f"{contact.get('first_name', '')} {contact.get('last_name', '')}".strip() or "Unknown",
            "email": contact.get("email", ""),
            "phone": contact.get("phone", "")
        }
        for contact in contacts
    ]

@router.get("/campaigns/list")
async def get_campaigns_for_deals(
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get campaigns list for deal creation"""
    
    campaigns_cursor = db.campaigns.find(
        {"user_id": current_user.id},
        {"name": 1, "status": 1}
    ).sort("name", 1)
    
    campaigns = await campaigns_cursor.to_list(length=None)
    
    return [
        {
            "id": str(campaign["_id"]),
            "name": campaign.get("name", "Unknown"),
            "status": campaign.get("status", "draft")
        }
        for campaign in campaigns
    ]





