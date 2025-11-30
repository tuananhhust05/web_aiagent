from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
import aiohttp
import asyncio
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
from app.services.telegram_service import telegram_service, send_message_to_user
from app.services.whatsapp_service import whatsapp_service
from app.services.linkedin_service import linkedin_service
from app.services.email_service import email_service
from app.services.workflow_executor import workflow_executor

router = APIRouter()

@router.get("", response_model=List[CampaignResponse])
async def get_campaigns(
    status: Optional[CampaignStatus] = Query(None),
    type: Optional[CampaignType] = Query(None),
    search: Optional[str] = Query(None),
    campaign_goal_id: Optional[str] = Query(None),
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
    
    if campaign_goal_id:
        filter_query["campaign_goal_id"] = campaign_goal_id
    
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
        "source": campaign_data.source,  # Add source field
        "campaign_goal_id": campaign_data.campaign_goal_id,  # Add campaign goal ID field
        "contacts": all_contacts,  # All contacts including from groups
        "group_ids": campaign_data.group_ids,  # Store group IDs for reference
        "call_script": campaign_data.call_script,
        "schedule_time": schedule_time,
        "schedule_settings": schedule_settings,
        "settings": campaign_data.settings,
        "flow": campaign_data.flow,  # Flow channels (default: ['telegram', 'ai_voice', 'whatsapp', 'linkedin'])
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
        
        # Try to load workflow from source (e.g., "convention-activities")
        workflow = None
        campaign_source = campaign.get("source")
        if campaign_source:
            print(f"🔍 Looking for workflow with source: {campaign_source}")
            workflow = await db.workflows.find_one({
                "user_id": current_user.id,
                "function": campaign_source
            })
            if workflow:
                print(f"✅ Found workflow for source '{campaign_source}' with {len(workflow.get('nodes', []))} nodes")
            else:
                print(f"⚠️ No workflow found for source '{campaign_source}', using campaign flow instead")
        
        # Get flow from campaign (default to ['telegram', 'ai_voice', 'whatsapp', 'linkedin'])
        flow = campaign.get("flow", ['telegram', 'ai_voice', 'whatsapp', 'linkedin'])
        if not flow or len(flow) == 0:
            flow = ['telegram', 'ai_voice', 'whatsapp', 'linkedin']
        
        # Execute workflow with response-based routing
        # Initialize counters (used in summary regardless of execution path)
        calls_made_count = 0
        whatsapp_sent_count = 0
        telegram_sent_count = 0
        linkedin_sent_count = 0
        email_sent_count = 0
        nodes_to_execute = []  # Initialize to avoid UnboundLocalError
        
        if all_contact_ids and contacts:
            call_script = campaign.get("call_script", settings.AI_CALL_DEFAULT_PROMPT)
            
            # Use WorkflowExecutor if workflow exists with nodes
            if workflow and workflow.get("nodes") and len(workflow.get("nodes", [])) > 0:
                # Extract node types for summary
                nodes_to_execute = [node.get('type') for node in workflow.get('nodes', [])]
                print(f"📋 Using workflow executor with response-based routing from source '{campaign_source}'")
                print(f"🔄 Workflow nodes: {[node.get('type') for node in workflow.get('nodes', [])]}")
                
                # Execute workflow for each contact
                for contact in contacts:
                    try:
                        await workflow_executor.execute_workflow_for_contact(
                            workflow,
                            contact,
                            campaign,
                            call_script
                        )
                    except Exception as e:
                        print(f"❌ Failed to execute workflow for contact {contact.get('_id')}: {str(e)}")
                        continue
            else:
                # Fallback to legacy sequential execution
                print(f"⚠️ No workflow found, using legacy sequential execution")
                
                # Use campaign flow as nodes
                nodes_to_execute = flow if flow else ['telegram']
                print(f"🔄 Campaign flow: {nodes_to_execute}")
                
                # Process each contact
                for contact in contacts:
                    phone = contact.get("phone", "N/A")
                    whatsapp_number = contact.get("whatsapp_number")
                    telegram_username = contact.get("telegram_username")
                    linkedin_profile = contact.get("linkedin_profile")
                    contact_email = contact.get("email")
                    name = f"{contact.get('first_name', '')} {contact.get('last_name', '')}".strip()
                    
                    # Execute nodes sequentially with 1 minute delay between nodes
                    for node_index, node_channel in enumerate(nodes_to_execute):
                        if node_index > 0:
                            # Wait 1 minute (60 seconds) before executing next node
                            print(f"⏳ Waiting 60 seconds before executing next node...")
                            await asyncio.sleep(60)
                        
                        print(f"🔄 [{node_index + 1}/{len(nodes_to_execute)}] Executing node: {node_channel} for {name}")
                        
                        if node_channel == 'whatsapp':
                            # Send WhatsApp message if contact has WhatsApp number
                            if whatsapp_number:
                                try:
                                    print(f"📱 Sending WhatsApp message to {name} ({whatsapp_number})")
                                    print(f"📝 Message content: {call_script[:100]}...")
                                    
                                    whatsapp_result = await whatsapp_service.send_message_to_contact(
                                        whatsapp_number, 
                                        call_script,
                                        user_id=current_user.id
                                    )
                                
                                    if whatsapp_result.get("success"):
                                        print(f"✅ WhatsApp message sent to {name}: {whatsapp_result}")
                                        whatsapp_sent_count += 1
                                    else:
                                        print(f"❌ WhatsApp message failed for {name}: {whatsapp_result}")
                                        if "error" in whatsapp_result:
                                            print(f"🔍 Error details: {whatsapp_result['error']}")
                                        
                                except Exception as e:
                                    print(f"❌ Failed to send WhatsApp message to {name}: {str(e)}")
                                    print(f"🔍 Exception type: {type(e).__name__}")
                            else:
                                print(f"⚠️ Contact {name} does not have WhatsApp number")
                        
                        elif node_channel == 'telegram':
                            # Send Telegram message if contact has Telegram username
                            if telegram_username:
                                try:
                                    # Kiểm tra và thêm @ nếu chưa có
                                    if not telegram_username.startswith('@'):
                                        telegram_username = f"@{telegram_username}"
                                        print(f"📝 Added @ prefix to telegram_username: {telegram_username}")
                                    
                                    print(f"📱 Sending Telegram message to {name} ({telegram_username})")
                                    print(f"📝 Message content: {call_script[:100]}...")
                                    
                                    # Sử dụng hàm send_message_to_user thay vì API call
                                    success = await send_message_to_user(
                                        recipient=telegram_username,
                                        message=call_script,
                                        user_id=current_user.id
                                    )
                                
                                    if success:
                                        print(f"✅ Telegram message sent successfully to {name} ({telegram_username})")
                                        telegram_sent_count += 1
                                    else:
                                        print(f"❌ Telegram message failed for {name} ({telegram_username})")
                                        
                                except Exception as e:
                                    print(f"❌ Failed to send Telegram message to {name}: {str(e)}")
                                    print(f"🔍 Exception type: {type(e).__name__}")
                            else:
                                print(f"⚠️ Contact {name} does not have Telegram username")
                        
                        elif node_channel == 'linkedin':
                            # Send LinkedIn message if contact has LinkedIn profile
                            if linkedin_profile:
                                try:
                                    print(f"🔗 Sending LinkedIn message to {name} ({linkedin_profile})")
                                    print(f"📝 Message content: {call_script[:100]}...")
                                    
                                    linkedin_result = await linkedin_service.send_message_to_contact(
                                        linkedin_profile, 
                                        call_script
                                    )
                                    
                                    if linkedin_result.get("success"):
                                        print(f"✅ LinkedIn message sent to {name}: {linkedin_result}")
                                        linkedin_sent_count += 1
                                    else:
                                        print(f"❌ LinkedIn message failed for {name}: {linkedin_result}")
                                        if "error" in linkedin_result:
                                            print(f"🔍 Error details: {linkedin_result['error']}")
                                        
                                except Exception as e:
                                    print(f"❌ Failed to send LinkedIn message to {name}: {str(e)}")
                                    print(f"🔍 Exception type: {type(e).__name__}")
                            else:
                                print(f"⚠️ Contact {name} does not have LinkedIn profile")
                        
                        elif node_channel == 'ai_voice':
                            # Make AI call if contact has phone number
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
                                                calls_made_count += 1
                                                
                                            else:
                                                error_text = await response.text()
                                                print(f"❌ AI call failed for {name}: {response.status} - {error_text}")
                                                
                                except Exception as e:
                                    print(f"❌ Failed to call AI API for {name}: {str(e)}")
                            else:
                                print(f"⚠️ Contact {name} does not have phone number")
                        
                        elif node_channel == 'email':
                            # Send email if contact has email address
                            if contact_email:
                                try:
                                    print(f"📧 Sending email to {name} ({contact_email})")
                                    print(f"📝 Email content: {call_script[:100]}...")
                                    
                                    # Get email credentials from database
                                    email_credentials = await db.email_credentials.find_one({"user_id": current_user.id})
                                    
                                    if not email_credentials:
                                        print(f"❌ Email credentials not found for user {current_user.id}")
                                        print(f"⚠️ Skipping email for {name} - Please configure email credentials first")
                                        continue
                                    
                                    # Prepare email data
                                    email_addr = email_credentials.get("email")
                                    app_password = email_credentials.get("app_password")
                                    from_name = email_credentials.get("from_name")
                                    
                                    if not email_addr or not app_password:
                                        print(f"❌ Email credentials incomplete for user {current_user.id}")
                                        print(f"⚠️ Skipping email for {name}")
                                        continue
                                    
                                    # Prepare recipients
                                    recipients = [{
                                        "email": contact_email,
                                        "name": name,
                                        "contact_id": str(contact["_id"])
                                    }]
                                    
                                    # Use call_script as email content
                                    email_subject = "Email Marketing"
                                    email_content = call_script
                                    
                                    # Send email with custom credentials
                                    email_result = await email_service.send_email_with_credentials_async(
                                        email=email_addr,
                                        app_password=app_password,
                                        from_name=from_name,
                                        subject=email_subject,
                                        content=email_content,
                                        is_html=False,
                                        recipients=recipients
                                    )
                                    
                                    if email_result.get("success"):
                                        print(f"✅ Email sent to {name}: {email_result}")
                                        email_sent_count += 1
                                    else:
                                        print(f"❌ Email failed for {name}: {email_result}")
                                        if "error" in email_result:
                                            print(f"🔍 Error details: {email_result['error']}")
                                        
                                except Exception as e:
                                    print(f"❌ Failed to send email to {name}: {str(e)}")
                                    print(f"🔍 Exception type: {type(e).__name__}")
                            else:
                                print(f"⚠️ Contact {name} does not have email address")
                        
                        else:
                            print(f"⚠️ Unknown node channel: {node_channel}")
        else:
            # No contacts found
            calls_made_count = 0
            whatsapp_sent_count = 0
            telegram_sent_count = 0
            linkedin_sent_count = 0
            email_sent_count = 0
        
        print(f"🔄 Campaign status remains: {campaign['status']}")
        
        # Build summary
        summary_message = f"📊 Campaign Summary: "
        summary_parts = []
        if calls_made_count > 0:
            summary_parts.append(f"{calls_made_count} calls made")
        if whatsapp_sent_count > 0:
            summary_parts.append(f"{whatsapp_sent_count} WhatsApp messages sent")
        if telegram_sent_count > 0:
            summary_parts.append(f"{telegram_sent_count} Telegram messages sent")
        if linkedin_sent_count > 0:
            summary_parts.append(f"{linkedin_sent_count} LinkedIn messages sent")
        if email_sent_count > 0:
            summary_parts.append(f"{email_sent_count} emails sent")
        
        summary_message += ", ".join(summary_parts) if summary_parts else "No actions executed"
        print(summary_message)
        
        # Build response message based on execution type
        if nodes_to_execute:
            message = f"Manual campaign executed successfully. Executed {len(nodes_to_execute)} nodes sequentially with 1 minute delay between nodes."
        else:
            message = "Manual campaign executed successfully."
        
        return {
            "message": message,
            "nodes_executed": nodes_to_execute if nodes_to_execute else [],
            "summary": {
                "total_contacts": len(all_contact_ids),
                "calls_made": calls_made_count,
                "whatsapp_messages_sent": whatsapp_sent_count,
                "telegram_messages_sent": telegram_sent_count,
                "linkedin_messages_sent": linkedin_sent_count,
                "emails_sent": email_sent_count
            }
        }
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

@router.get("/test-telegram")
async def test_telegram_connection(
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Test Telegram API connection"""
    try:
        test_result = await telegram_service.test_connection()
        return {
            "message": "Telegram API connection test completed",
            "result": test_result
        }
    except Exception as e:
        return {
            "message": "Telegram API connection test failed",
            "error": str(e)
        }

@router.get("/test-whatsapp")
async def test_whatsapp_connection(
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Test WhatsApp API connection"""
    try:
        test_result = await whatsapp_service.test_connection()
        return {
            "message": "WhatsApp API connection test completed",
            "result": test_result
        }
    except Exception as e:
        return {
            "message": "WhatsApp API connection test failed",
            "error": str(e)
        }

@router.get("/test-linkedin")
async def test_linkedin_connection(
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Test LinkedIn API connection"""
    try:
        test_result = await linkedin_service.test_connection()
        return {
            "message": "LinkedIn API connection test completed",
            "result": test_result
        }
    except Exception as e:
        return {
            "message": "LinkedIn API connection test failed",
            "error": str(e)
        }

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
