from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
import aiohttp
import asyncio

from app.core.database import get_database
from app.core.auth import get_current_active_user
from app.core.config import settings
from app.models.user import UserResponse
from app.models.inbox import InboxResponseCreate, InboxResponse


router = APIRouter()


async def trigger_campaign_calls(campaign: dict, user_id: Optional[str]):
    """
    Trigger AI voice calls for all contacts in a campaign after receiving a message.
    Only executes the first channel in the campaign's flow.
    """
    db = get_database()
    
    try:
        # Get campaign flow (default to ['telegram', 'ai_voice', 'whatsapp', 'linkedin'])
        flow = campaign.get("flow", ['telegram', 'ai_voice', 'whatsapp', 'linkedin'])
        if not flow or len(flow) == 0:
            flow = ['telegram', 'ai_voice', 'whatsapp', 'linkedin']
        
        # Always trigger AI voice calls when inbox receives a message
        # This is independent of the campaign flow
        print(f"🔄 Campaign flow: {flow}")
        print(f"📞 Triggering AI voice calls for all contacts in campaign (triggered by inbox message)")
        
        # Get all contacts for this campaign
        all_contact_ids = list(campaign.get("contacts", []))
        
        if not all_contact_ids:
            print(f"⚠️ No contacts found in campaign")
            return
        
        # Get call script from campaign
        call_script = campaign.get("call_script", settings.AI_CALL_DEFAULT_PROMPT)
        campaign_id = str(campaign.get("_id", ""))
        
        print(f"📋 Campaign: {campaign.get('name', 'Unknown')}")
        print(f"👥 Total Contacts: {len(all_contact_ids)}")
        print(f"📝 Call Script: {call_script[:100]}...")
        
        # Query contacts from database
        contacts_cursor = db.contacts.find({"_id": {"$in": all_contact_ids}})
        contacts = await contacts_cursor.to_list(length=None)
        
        calls_made_count = 0
        
        # Make AI calls for all contacts sequentially
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
                                    "user_id": user_id,
                                    "contact_id": str(contact["_id"]),
                                    "campaign_id": campaign_id,
                                    "phone_number": phone,
                                    "call_type": "outbound",
                                    "status": "connecting",
                                    "created_at": datetime.utcnow(),
                                    "updated_at": datetime.utcnow(),
                                    "notes": f"Auto-triggered call from inbox response for campaign {campaign.get('name', 'Unknown')}"
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
        
        print(f"📊 Campaign Calls Summary: {calls_made_count} calls initiated out of {len(contacts)} contacts")
        
    except Exception as e:
        print(f"❌ Error triggering campaign calls: {str(e)}")
        import traceback
        traceback.print_exc()


@router.post("/receive", response_model=InboxResponse)
async def receive_response(
    data: InboxResponseCreate,
):
    """
    Receive a response from any platform.
    Simple case: platform = "telegram" -> find contact by telegram_username == contact,
    then find a campaign that includes this contact _id in its contacts array.
    """
    db = get_database()

    contact_id: Optional[str] = None
    campaign_id: Optional[str] = None
    user_id: Optional[str] = None
    campaign: Optional[dict] = None

    # Resolve contact and campaign based on platform
    if data.platform.lower() == "telegram":
        contact = await db.contacts.find_one({
            "telegram_username": data.contact,
        })
        if contact:
            contact_id = contact["_id"]
            user_id = contact.get("user_id")
            campaign = await db.campaigns.find_one({
                "contacts": {"$in": [contact_id]},
                **({"user_id": user_id} if user_id else {}),
            })
            if campaign:
                campaign_id = str(campaign["_id"])

    # Insert inbox record
    inbox_doc = {
        "_id": str(datetime.utcnow().timestamp()).replace(".", ""),
        "user_id": user_id,
        "platform": data.platform,
        "contact": data.contact,
        "content": data.content,
        "campaign_id": campaign_id,
        "contact_id": contact_id,
        "created_at": datetime.utcnow(),
    }

    await db.inbox_responses.insert_one(inbox_doc)
    inbox_doc["id"] = inbox_doc["_id"]
    
    # If campaign is found, trigger AI voice calls for all contacts in campaign
    if campaign_id and campaign:
        print(f"📞 Inbox received message from contact in campaign {campaign_id}")
        print(f"🚀 Triggering AI voice calls for all contacts in campaign")
        
        # Trigger calls asynchronously (don't wait for completion)
        asyncio.create_task(trigger_campaign_calls(campaign, user_id))
    
    return InboxResponse(**inbox_doc)


@router.get("/by-campaign/{campaign_id}", response_model=List[InboxResponse])
async def get_responses_by_campaign(
    campaign_id: str,
    limit: int = Query(100, ge=1, le=500),
    skip: int = Query(0, ge=0),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Return inbox responses for a specific campaign."""
    db = get_database()

    cursor = db.inbox_responses.find({
        "campaign_id": campaign_id,
        "user_id": current_user.id,
    }).skip(skip).limit(limit).sort("created_at", -1)

    items = await cursor.to_list(length=limit)
    responses: List[InboxResponse] = []
    for item in items:
        item["id"] = item["_id"]
        responses.append(InboxResponse(**item))
    return responses


