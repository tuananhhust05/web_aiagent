from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from datetime import datetime
from app.core.database import get_database
from app.core.auth import get_current_active_user
from app.models.user import UserResponse
from app.models.campaign import (
    CampaignCreate, 
    CampaignUpdate, 
    CampaignResponse, 
    CampaignStats,
    CampaignFilters,
    CampaignStatus,
    CampaignType
)

router = APIRouter()

@router.get("", response_model=List[CampaignResponse])
async def get_campaigns(
    status: Optional[CampaignStatus] = Query(None),
    type: Optional[CampaignType] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Get campaigns with optional filtering"""
    db = get_database()
    
    # Build filter query
    filter_query = {"user_id": current_user.id}
    
    if status:
        filter_query["status"] = status.value
    
    if type:
        filter_query["type"] = type.value
    
    if search:
        filter_query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    # Get campaigns
    campaigns = await db.campaigns.find(filter_query).skip(offset).limit(limit).to_list(length=limit)
    
    # Ensure each campaign has an id field
    campaign_responses = []
    for campaign in campaigns:
        campaign_dict = dict(campaign)
        campaign_dict['id'] = campaign_dict['_id']
        campaign_responses.append(CampaignResponse(**campaign_dict))
    
    return campaign_responses

@router.post("", response_model=CampaignResponse)
async def create_campaign(
    campaign_data: CampaignCreate,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Create a new campaign"""
    db = get_database()
    
    # Validate schedule_time for scheduled campaigns
    if campaign_data.type == CampaignType.SCHEDULED and not campaign_data.schedule_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Schedule time is required for scheduled campaigns"
        )
    
    # Create campaign document
    campaign_doc = {
        "name": campaign_data.name,
        "description": campaign_data.description,
        "status": campaign_data.status,
        "type": campaign_data.type,
        "contacts": campaign_data.contacts,
        "call_script": campaign_data.call_script,
        "schedule_time": campaign_data.schedule_time,
        "settings": campaign_data.settings,
        "user_id": current_user.id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    # Insert campaign
    result = await db.campaigns.insert_one(campaign_doc)
    campaign_doc['id'] = str(result.inserted_id)
    campaign_doc['_id'] = result.inserted_id
    
    return CampaignResponse(**campaign_doc)

@router.get("/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(
    campaign_id: str,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Get a specific campaign"""
    db = get_database()
    
    campaign = await db.campaigns.find_one({
        "_id": campaign_id,
        "user_id": current_user.id
    })
    
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )
    
    campaign_dict = dict(campaign)
    campaign_dict['id'] = campaign_dict['_id']
    return CampaignResponse(**campaign_dict)

@router.put("/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(
    campaign_id: str,
    campaign_update: CampaignUpdate,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Update a campaign"""
    db = get_database()
    
    # Check if campaign exists
    existing_campaign = await db.campaigns.find_one({
        "_id": campaign_id,
        "user_id": current_user.id
    })
    
    if not existing_campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )
    
    # Build update data
    update_data = {"updated_at": datetime.utcnow()}
    for field, value in campaign_update.dict(exclude_unset=True).items():
        if value is not None:
            update_data[field] = value
    
    # Validate schedule_time for scheduled campaigns
    if update_data.get("type") == CampaignType.SCHEDULED and not update_data.get("schedule_time"):
        if existing_campaign.get("type") != CampaignType.SCHEDULED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Schedule time is required for scheduled campaigns"
            )
    
    # Update campaign
    await db.campaigns.update_one(
        {"_id": campaign_id},
        {"$set": update_data}
    )
    
    # Get updated campaign
    updated_campaign = await db.campaigns.find_one({"_id": campaign_id})
    updated_campaign_dict = dict(updated_campaign)
    updated_campaign_dict['id'] = updated_campaign_dict['_id']
    
    return CampaignResponse(**updated_campaign_dict)

@router.delete("/{campaign_id}")
async def delete_campaign(
    campaign_id: str,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Delete a campaign"""
    db = get_database()
    
    result = await db.campaigns.delete_one({
        "_id": campaign_id,
        "user_id": current_user.id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )
    
    return {"message": "Campaign deleted successfully"}

@router.post("/{campaign_id}/start")
async def start_campaign(
    campaign_id: str,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Start a campaign"""
    db = get_database()
    
    # Check if campaign exists
    campaign = await db.campaigns.find_one({
        "_id": campaign_id,
        "user_id": current_user.id
    })
    
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )
    
    if campaign["status"] not in [CampaignStatus.DRAFT, CampaignStatus.PAUSED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Campaign can only be started from draft or paused status"
        )
    
    # Update campaign status
    await db.campaigns.update_one(
        {"_id": campaign_id},
        {"$set": {
            "status": CampaignStatus.ACTIVE,
            "updated_at": datetime.utcnow()
        }}
    )
    
    return {"message": "Campaign started successfully"}

@router.post("/{campaign_id}/pause")
async def pause_campaign(
    campaign_id: str,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Pause a campaign"""
    db = get_database()
    
    # Check if campaign exists
    campaign = await db.campaigns.find_one({
        "_id": campaign_id,
        "user_id": current_user.id
    })
    
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )
    
    if campaign["status"] != CampaignStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only active campaigns can be paused"
        )
    
    # Update campaign status
    await db.campaigns.update_one(
        {"_id": campaign_id},
        {"$set": {
            "status": CampaignStatus.PAUSED,
            "updated_at": datetime.utcnow()
        }}
    )
    
    return {"message": "Campaign paused successfully"}

@router.get("/stats/summary", response_model=CampaignStats)
async def get_campaign_stats(
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Get campaign statistics"""
    db = get_database()
    
    # Get campaign counts
    total_campaigns = await db.campaigns.count_documents({"user_id": current_user.id})
    active_campaigns = await db.campaigns.count_documents({
        "user_id": current_user.id,
        "status": CampaignStatus.ACTIVE
    })
    scheduled_campaigns = await db.campaigns.count_documents({
        "user_id": current_user.id,
        "status": CampaignStatus.SCHEDULED
    })
    
    # Get total contacts across all campaigns
    campaigns = await db.campaigns.find({"user_id": current_user.id}).to_list(length=None)
    total_contacts = sum(len(campaign.get("contacts", [])) for campaign in campaigns)
    
    # Get completed calls (mock data for now)
    completed_calls = await db.calls.count_documents({
        "user_id": current_user.id,
        "status": "completed"
    })
    
    # Calculate success rate (mock calculation)
    total_calls = await db.calls.count_documents({"user_id": current_user.id})
    success_rate = (completed_calls / total_calls * 100) if total_calls > 0 else 0
    
    return CampaignStats(
        total_campaigns=total_campaigns,
        active_campaigns=active_campaigns,
        scheduled_campaigns=scheduled_campaigns,
        total_contacts=total_contacts,
        completed_calls=completed_calls,
        success_rate=round(success_rate, 2)
    )
