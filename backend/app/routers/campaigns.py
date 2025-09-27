from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
import aiohttp
from app.core.database import get_database
from app.core.auth import get_current_active_user
from app.core.config import settings
from app.models.user import UserResponse
from app.models.campaign import (
    CampaignCreate, 
    CampaignUpdate, 
    CampaignResponse, 
    CampaignStats,
    CampaignFilters,
    CampaignStatus,
    CampaignType,
    CampaignContactsResponse,
    CampaignGroupContacts
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
        campaign_dict['id'] = str(campaign_dict['_id'])
        del campaign_dict['_id']  # Remove _id field to avoid ObjectId serialization issues
        campaign_responses.append(CampaignResponse(**campaign_dict))
    
    return campaign_responses

@router.post("", response_model=CampaignResponse)
async def create_campaign(
    campaign_data: CampaignCreate,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Create a new campaign"""
    db = get_database()
    
    # Validate schedule_settings for scheduled campaigns
    if campaign_data.type == CampaignType.SCHEDULED and not campaign_data.schedule_settings:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Schedule settings are required for scheduled campaigns"
        )
    
    # Get contacts from groups if group_ids provided
    all_contacts = list(campaign_data.contacts)  # Start with direct contacts
    
    if campaign_data.group_ids:
        # Get contacts from each group
        for group_id in campaign_data.group_ids:
            # Verify group belongs to user
            group = await db.groups.find_one({
                "_id": group_id,
                "user_id": current_user.id
            })
            
            if not group:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_F,
                    detail=f"Group {group_id} not found"
                )
            
            # Get members of this group
            members = await db.user_in_groups.find({"group_id": group_id}).to_list(length=None)
            group_contact_ids = [member['contact_id'] for member in members]
            
            # Add unique contacts from group
            for contact_id in group_contact_ids:
                if contact_id not in all_contacts:
                    all_contacts.append(contact_id)
    
    # Handle schedule settings and timezone conversion
    schedule_time = None
    schedule_settings = None
    
    if campaign_data.type == CampaignType.SCHEDULED:
        if campaign_data.schedule_settings:
            schedule_settings = campaign_data.schedule_settings.dict() if hasattr(campaign_data.schedule_settings, 'dict') else campaign_data.schedule_settings
            
            # Convert start_time from user timezone to UTC
            if schedule_settings.get('start_time'):
                try:
                    import pytz
                    user_timezone = schedule_settings.get('timezone', 'UTC')
                    user_tz = pytz.timezone(user_timezone)
                    
                    # Parse the datetime string
                    start_time_str = schedule_settings['start_time']
                    if isinstance(start_time_str, str):
                        # Handle different datetime formats
                        if 'T' in start_time_str:
                            start_time = datetime.datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
                        else:
                            start_time = datetime.datetime.fromisoformat(start_time_str)
                    else:
                        start_time = start_time_str
                    
                    # If naive datetime, localize to user timezone
                    if start_time.tzinfo is None:
                        start_time = user_tz.localize(start_time)
                    
                    # Convert to UTC
                    schedule_time = start_time.astimezone(pytz.UTC)
                    
                    # Update schedule_settings with UTC time
                    schedule_settings['start_time'] = schedule_time.isoformat()
                    
                    print(f"🕐 [TIMEZONE] Converted {start_time_str} ({user_timezone}) to UTC: {schedule_time}")
                    
                except Exception as e:
                    print(f"❌ [TIMEZONE] Error converting timezone: {str(e)}")
                    raise HTTPException(status_code=400, detail=f"Invalid timezone or datetime format: {str(e)}")
        else:
            raise HTTPException(status_code=400, detail="Schedule settings are required for scheduled campaigns")
    
    # Create campaign document
    campaign_doc = {
        "name": campaign_data.name,
        "description": campaign_data.description,
        "status": campaign_data.status,
        "type": campaign_data.type,
        "contacts": all_contacts,  # All contacts including from groups
        "group_ids": campaign_data.group_ids,  # Store group IDs for reference
        "call_script": campaign_data.call_script,
        "schedule_time": schedule_time,
        "schedule_settings": schedule_settings,
        "settings": campaign_data.settings,
        "user_id": current_user.id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    # Insert campaign
    result = await db.campaigns.insert_one(campaign_doc)
    campaign_doc['id'] = str(result.inserted_id)
    del campaign_doc['_id']  # Remove _id field to avoid ObjectId serialization issues
    
    return CampaignResponse(**campaign_doc)

@router.get("/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(
    campaign_id: str,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Get a specific campaign"""
    db = get_database()
    
    campaign = await db.campaigns.find_one({
        "_id": ObjectId(campaign_id),
        "user_id": current_user.id
    })
    
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )
    
    campaign_dict = dict(campaign)
    campaign_dict['id'] = str(campaign_dict['_id'])
    del campaign_dict['_id']  # Remove _id field to avoid ObjectId serialization issues
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
        "_id": ObjectId(campaign_id),
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
    
    # Validate schedule_settings for scheduled campaigns
    if update_data.get("type") == CampaignType.SCHEDULED and not update_data.get("schedule_settings"):
        if existing_campaign.get("type") != CampaignType.SCHEDULED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Schedule settings are required for scheduled campaigns"
            )
    
    # Update campaign
    await db.campaigns.update_one(
        {"_id": ObjectId(campaign_id)},
        {"$set": update_data}
    )
    
    # Get updated campaign
    updated_campaign = await db.campaigns.find_one({"_id": ObjectId(campaign_id)})
    updated_campaign_dict = dict(updated_campaign)
    updated_campaign_dict['id'] = str(updated_campaign_dict['_id'])
    del updated_campaign_dict['_id']  # Remove _id field to avoid ObjectId serialization issues
    
    return CampaignResponse(**updated_campaign_dict)

@router.delete("/{campaign_id}")
async def delete_campaign(
    campaign_id: str,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Delete a campaign"""
    db = get_database()
    
    result = await db.campaigns.delete_one({
        "_id": ObjectId(campaign_id),
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
    from bson import ObjectId
    
    try:
        campaign_object_id = ObjectId(campaign_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid campaign ID format: {str(e)}"
        )
    
    # Debug logging
    print(f"🔍 Looking for campaign with ID: {campaign_id}")
    print(f"🔍 User ID: {current_user.id}")
    
    campaign = await db.campaigns.find_one({
        "_id": campaign_object_id,
        "user_id": current_user.id
    })
    
    if not campaign:
        # Check if campaign exists but belongs to different user
        campaign_exists = await db.campaigns.find_one({"_id": campaign_object_id})
        if campaign_exists:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Campaign not found or access denied"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign not found"
            )
    
    if campaign["status"] not in [CampaignStatus.DRAFT, CampaignStatus.PAUSED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Campaign can only be started from draft or paused status"
        )
    
    # Get all contacts for this campaign
    all_contact_ids = list(campaign.get("contacts", []))
    
    # Log campaign start
    print(f"🚀 Starting Campaign: {campaign['name']} (ID: {campaign_id})")
    print(f"📊 Campaign Type: {campaign['type']}")
    print(f"👥 Total Contacts: {len(all_contact_ids)}")
    
    # Query contacts from database and log phone numbers
    if all_contact_ids:
        contacts_cursor = db.contacts.find({"_id": {"$in": all_contact_ids}})
        contacts = await contacts_cursor.to_list(length=None)
        
        print(f"📞 Contact Phone Numbers:")
        for i, contact in enumerate(contacts, 1):
            phone = contact.get("phone", "N/A")
            name = f"{contact.get('first_name', '')} {contact.get('last_name', '')}".strip()
            print(f"  {i}. {name} - {phone}")
    else:
        print("⚠️  No contacts found for this campaign")
    
    # Handle different campaign types
    if campaign["type"] == CampaignType.MANUAL:
        # For manual campaigns, execute calls immediately and keep original status
        print(f"📋 Manual Campaign: Executing calls for {len(all_contact_ids)} contacts")
        
        # Execute AI calls for manual campaigns
        if all_contact_ids and contacts:
            call_script = campaign.get("call_script", settings.AI_CALL_DEFAULT_PROMPT)
            
            for contact in contacts:
                phone = contact.get("phone", "N/A")
                name = f"{contact.get('first_name', '')} {contact.get('last_name', '')}".strip()
                
                if phone and phone != "N/A":
                    try:
                        # Prepare AI call API payload
                        ai_call_payload = {
                            "number": phone,
                            "prompt": call_script
                        }
                        
                        print(f"🤖 Calling AI API for {name} ({phone})")
                        
                        # Make async HTTP request to AI call API
                        async with aiohttp.ClientSession() as session:
                            async with session.post(
                                settings.AI_CALL_API_URL,
                                json=ai_call_payload,
                                headers={"Content-Type": "application/json"},
                                timeout=aiohttp.ClientTimeout(total=30)
                            ) as response:
                                if response.status == 200:
                                    ai_response = await response.json()
                                    print(f"✅ AI call initiated for {name}: {ai_response}")
                                    
                                    # Create call record in database
                                    call_doc = {
                                        "_id": str(ObjectId()),
                                        "user_id": current_user.id,
                                        "contact_id": str(contact["_id"]),
                                        "campaign_id": campaign_id,
                                        "phone_number": phone,
                                        "call_type": "outbound",
                                        "status": "connecting",
                                        "created_at": datetime.utcnow(),
                                        "updated_at": datetime.utcnow(),
                                        "notes": f"Manual campaign call for {name}"
                                    }
                                    
                                    # Insert call record
                                    await db.calls.insert_one(call_doc)
                                    print(f"📝 Call record created for {name}")
                                    
                                else:
                                    error_text = await response.text()
                                    print(f"❌ AI call failed for {name}: {response.status} - {error_text}")
                                    
                    except Exception as e:
                        print(f"❌ Failed to call AI API for {name}: {str(e)}")
        
        print(f"🔄 Campaign status remains: {campaign['status']}")
        return {"message": f"Manual campaign executed. Called {len(all_contact_ids)} contacts."}
    else:
        # For scheduled campaigns, only update status to ACTIVE (scheduler will handle calls)
        await db.campaigns.update_one(
            {"_id": campaign_object_id},
            {"$set": {
                "status": CampaignStatus.ACTIVE,
                "updated_at": datetime.utcnow()
            }}
        )
        print(f"✅ Scheduled Campaign {campaign['name']} activated! Scheduler will handle calls at scheduled time.")
        return {"message": "Scheduled campaign activated. Calls will be made at scheduled time."}

@router.post("/{campaign_id}/pause")
async def pause_campaign(
    campaign_id: str,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Pause a campaign"""
    db = get_database()
    
    # Check if campaign exists
    campaign = await db.campaigns.find_one({
        "_id": ObjectId(campaign_id),
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
        {"_id": ObjectId(campaign_id)},
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

@router.get("/contacts-from-groups", response_model=CampaignContactsResponse)
async def get_contacts_from_groups(
    group_ids: str = Query(..., description="Comma-separated group IDs"),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Get contacts from specified groups for campaign creation"""
    db = get_database()
    
    # Parse group IDs
    group_id_list = [gid.strip() for gid in group_ids.split(',') if gid.strip()]
    
    if not group_id_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one group ID is required"
        )
    
    # Get groups and verify they belong to user
    groups = await db.groups.find({
        "_id": {"$in": group_id_list},
        "user_id": current_user.id
    }).to_list(length=None)
    
    if len(groups) != len(group_id_list):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_F,
            detail="One or more groups not found"
        )
    
    # Get contacts from each group
    groups_with_contacts = []
    total_contacts = 0
    
    for group in groups:
        group_id = str(group['_id'])
        group_name = group['name']
        
        # Get members of this group
        members = await db.user_in_groups.find({"group_id": group_id}).to_list(length=None)
        
        if not members:
            groups_with_contacts.append(CampaignGroupContacts(
                group_id=group_id,
                group_name=group_name,
                contacts=[],
                total_contacts=0
            ))
            continue
        
        # Get contact details
        contact_ids = [member['contact_id'] for member in members]
        contacts = await db.contacts.find({
            "_id": {"$in": contact_ids},
            "user_id": current_user.id
        }).to_list(length=None)
        
        # Convert contacts to response format
        contact_list = []
        for contact in contacts:
            contact_dict = dict(contact)
            contact_dict['id'] = str(contact_dict['_id'])
            del contact_dict['_id']  # Remove _id field
            contact_list.append(contact_dict)
        
        groups_with_contacts.append(CampaignGroupContacts(
            group_id=group_id,
            group_name=group_name,
            contacts=contact_list,
            total_contacts=len(contact_list)
        ))
        
        total_contacts += len(contact_list)
    
    return CampaignContactsResponse(
        groups=groups_with_contacts,
        total_contacts=total_contacts
    )
