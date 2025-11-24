from fastapi import APIRouter, Depends, HTTPException, Query, Body
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
import httpx
from pydantic import BaseModel
from app.core.auth import get_current_user
from app.models.user import UserResponse
from app.models.telegram import (
    TelegramContactCreate, TelegramContactUpdate, TelegramContactResponse,
    TelegramCampaignCreate, TelegramCampaignUpdate, TelegramCampaignResponse,
    TelegramManualSend, TelegramSendResponse,
    TelegramContactListResponse, TelegramCampaignListResponse
)
from app.core.database import get_database

router = APIRouter(prefix="/api/telegram", tags=["telegram"])
TELEGRAM_LOGIN_API_BASE = "http://3.106.56.62:8000"


class TelegramLoginRequest(BaseModel):
    user_id: Optional[str] = None


class TelegramAppConfigRequest(BaseModel):
    api_id: str
    api_hash: str


async def _forward_telegram_login_request(endpoint: str, payload: dict):
    try:
        async with httpx.AsyncClient(timeout=200.0) as client:
            response = await client.post(
                f"{TELEGRAM_LOGIN_API_BASE}{endpoint}",
                json=payload,
                headers={"Content-Type": "application/json"}
            )

            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Telegram login API error: {response.text}"
                )
    except httpx.TimeoutException:
        raise HTTPException(status_code=408, detail="Telegram login API timeout")
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Telegram login API unavailable")
    except Exception as e:
        print(f"❌ Error calling Telegram login API: {e}")
        raise HTTPException(status_code=500, detail=f"Telegram login API error: {str(e)}")


def _resolve_user_id(request: Optional[TelegramLoginRequest], current_user: UserResponse) -> str:
    if request and request.user_id:
        return request.user_id
    return str(current_user.id)

# Telegram Contacts Endpoints
@router.get("/contacts", response_model=TelegramContactListResponse)
async def get_telegram_contacts(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get all Telegram contacts for the current user"""
    collection = db["telegram_contacts"]
    
    # Build query
    query = {"user_id": current_user.id}
    if search:
        query["$or"] = [
            {"first_name": {"$regex": search, "$options": "i"}},
            {"last_name": {"$regex": search, "$options": "i"}},
            {"username": {"$regex": search, "$options": "i"}}
        ]
    
    # Get total count
    total = await collection.count_documents(query)
    
    # Get contacts with pagination
    skip = (page - 1) * limit
    cursor = collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
    contacts = await cursor.to_list(length=limit)
    
    # Convert ObjectId to string
    for contact in contacts:
        contact["_id"] = str(contact["_id"])
        contact["id"] = str(contact["_id"])  # Add id field for frontend compatibility
    
    return TelegramContactListResponse(
        contacts=contacts,
        total=total,
        page=page,
        limit=limit
    )

@router.post("/contacts", response_model=TelegramContactResponse)
async def create_telegram_contact(
    contact_data: TelegramContactCreate,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Create a new Telegram contact"""
    collection = db["telegram_contacts"]
    
    # Check if username already exists for this user
    if contact_data.username:
        existing = await collection.find_one({
            "user_id": current_user.id,
            "username": contact_data.username
        })
        if existing:
            raise HTTPException(status_code=400, detail="Username already exists")
    
    # Create contact document
    contact_doc = {
        **contact_data.dict(),
        "user_id": current_user.id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await collection.insert_one(contact_doc)
    contact_doc["_id"] = str(result.inserted_id)
    
    return TelegramContactResponse(**contact_doc)

@router.get("/contacts/{contact_id}", response_model=TelegramContactResponse)
async def get_telegram_contact(
    contact_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get a specific Telegram contact"""
    try:
        collection = db["telegram_contacts"]
        
        # Validate ObjectId format
        if not ObjectId.is_valid(contact_id):
            raise HTTPException(status_code=400, detail="Invalid contact ID format")
        
        contact = await collection.find_one({
            "_id": ObjectId(contact_id),
            "user_id": current_user.id
        })
        
        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found")
        
        contact["_id"] = str(contact["_id"])
        contact["id"] = str(contact["_id"])  # Add id field for frontend compatibility
        return TelegramContactResponse(**contact)
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error getting contact: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get contact: {str(e)}")

@router.put("/contacts/{contact_id}", response_model=TelegramContactResponse)
async def update_telegram_contact(
    contact_id: str,
    contact_data: TelegramContactUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Update a Telegram contact"""
    collection = db["telegram_contacts"]
    
    # Check if contact exists and belongs to user
    existing = await collection.find_one({
        "_id": ObjectId(contact_id),
        "user_id": current_user.id
    })
    
    if not existing:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    # Check if username already exists for this user (if updating username)
    if contact_data.username and contact_data.username != existing.get("username"):
        username_exists = await collection.find_one({
            "user_id": current_user.id,
            "username": contact_data.username,
            "_id": {"$ne": ObjectId(contact_id)}
        })
        if username_exists:
            raise HTTPException(status_code=400, detail="Username already exists")
    
    # Update contact
    update_data = {k: v for k, v in contact_data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await collection.update_one(
        {"_id": ObjectId(contact_id)},
        {"$set": update_data}
    )
    
    # Get updated contact
    updated_contact = await collection.find_one({"_id": ObjectId(contact_id)})
    updated_contact["_id"] = str(updated_contact["_id"])
    updated_contact["id"] = str(updated_contact["_id"])  # Add id field for frontend compatibility
    
    return TelegramContactResponse(**updated_contact)

@router.delete("/contacts/{contact_id}")
async def delete_telegram_contact(
    contact_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Delete a Telegram contact"""
    try:
        collection = db["telegram_contacts"]
        
        # Validate ObjectId format
        if not ObjectId.is_valid(contact_id):
            raise HTTPException(status_code=400, detail="Invalid contact ID format")
        
        result = await collection.delete_one({
            "_id": ObjectId(contact_id),
            "user_id": current_user.id
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Contact not found")
        
        return {"message": "Contact deleted successfully"}
    except Exception as e:
        print(f"❌ Error deleting contact: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete contact: {str(e)}")

# Telegram Campaigns Endpoints
@router.get("/campaigns", response_model=TelegramCampaignListResponse)
async def get_telegram_campaigns(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get all Telegram campaigns for the current user"""
    collection = db["telegram_campaigns"]
    
    query = {"user_id": current_user.id}
    total = await collection.count_documents(query)
    
    skip = (page - 1) * limit
    cursor = collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
    campaigns = await cursor.to_list(length=limit)
    
    for campaign in campaigns:
        campaign["_id"] = str(campaign["_id"])
        campaign["id"] = str(campaign["_id"])  # Add id field for frontend compatibility
    
    return TelegramCampaignListResponse(
        campaigns=campaigns,
        total=total,
        page=page,
        limit=limit
    )

@router.post("/campaigns", response_model=TelegramCampaignResponse)
async def create_telegram_campaign(
    campaign_data: TelegramCampaignCreate,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Create a new Telegram campaign"""
    collection = db["telegram_campaigns"]
    
    campaign_doc = {
        **campaign_data.dict(),
        "user_id": current_user.id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await collection.insert_one(campaign_doc)
    campaign_doc["_id"] = str(result.inserted_id)
    campaign_doc["id"] = str(result.inserted_id)  # Add id field for frontend compatibility
    
    return TelegramCampaignResponse(**campaign_doc)

@router.put("/campaigns/{campaign_id}", response_model=TelegramCampaignResponse)
async def update_telegram_campaign(
    campaign_id: str,
    campaign_data: TelegramCampaignUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Update a Telegram campaign"""
    collection = db["telegram_campaigns"]
    
    existing = await collection.find_one({
        "_id": ObjectId(campaign_id),
        "user_id": current_user.id
    })
    
    if not existing:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    update_data = {k: v for k, v in campaign_data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await collection.update_one(
        {"_id": ObjectId(campaign_id)},
        {"$set": update_data}
    )
    
    updated_campaign = await collection.find_one({"_id": ObjectId(campaign_id)})
    updated_campaign["_id"] = str(updated_campaign["_id"])
    updated_campaign["id"] = str(updated_campaign["_id"])  # Add id field for frontend compatibility
    
    return TelegramCampaignResponse(**updated_campaign)

@router.delete("/campaigns/{campaign_id}")
async def delete_telegram_campaign(
    campaign_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Delete a Telegram campaign"""
    collection = db["telegram_campaigns"]
    
    result = await collection.delete_one({
        "_id": ObjectId(campaign_id),
        "user_id": current_user.id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    return {"message": "Campaign deleted successfully"}

@router.post("/campaigns/{campaign_id}/send")
async def send_telegram_campaign(
    campaign_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Send a Telegram campaign"""
    campaigns_collection = db["telegram_campaigns"]
    contacts_collection = db["telegram_contacts"]
    messages_collection = db["telegram_messages"]
    
    # Get campaign
    campaign = await campaigns_collection.find_one({
        "_id": ObjectId(campaign_id),
        "user_id": current_user.id
    })
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Get active contacts
    contacts = await contacts_collection.find({
        "user_id": current_user.id,
        "is_active": True
    }).to_list(length=None)
    
    if not contacts:
        raise HTTPException(status_code=400, detail="No active contacts found")
    
    # Create messages for each contact
    messages = []
    for contact in contacts:
        message_doc = {
            "campaign_id": str(campaign["_id"]),
            "contact_id": str(contact["_id"]),
            "user_id": current_user.id,
            "message": campaign["message"],
            "status": "pending",
            "created_at": datetime.utcnow()
        }
        messages.append(message_doc)
    
    # Insert messages
    if messages:
        await messages_collection.insert_many(messages)
    
    # Update campaign status
    await campaigns_collection.update_one(
        {"_id": ObjectId(campaign_id)},
        {
            "$set": {
                "status": "sent",
                "sent_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {
        "message": "Campaign sent successfully",
        "sent_count": len(messages)
    }

# Start Campaign Endpoint
@router.post("/start-campaign")
async def start_telegram_campaign(
    campaign_data: dict,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Start a Telegram campaign"""
    try:
        import httpx
        
        campaigns_collection = db["telegram_campaigns"]
        
        # If campaignId is provided, update existing campaign
        if campaign_data.get("campaignId"):
            campaign_id = campaign_data["campaignId"]
            
            # Validate ObjectId format
            if not ObjectId.is_valid(campaign_id):
                raise HTTPException(status_code=400, detail="Invalid campaign ID format")
            
            # Check if campaign exists and belongs to user
            existing_campaign = await campaigns_collection.find_one({
                "_id": ObjectId(campaign_id),
                "user_id": current_user.id
            })
            
            if not existing_campaign:
                raise HTTPException(status_code=404, detail="Campaign not found")
            
            # Update campaign with new sent timestamp (keep current status)
            await campaigns_collection.update_one(
                {"_id": ObjectId(campaign_id)},
                {
                    "$set": {
                        "last_sent_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            campaign_name = existing_campaign["name"]
            campaign_message = existing_campaign["message"]
        else:
            # Create new campaign (legacy support)
            campaign_doc = {
                "name": campaign_data.get("name"),
                "message": campaign_data.get("message"),
                "urls": campaign_data.get("urls", []),
                "campaignType": campaign_data.get("campaignType", "manual"),
                "status": "sent",
                "user_id": current_user.id,
                "sent_at": datetime.utcnow(),
                "last_sent_at": datetime.utcnow(),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            result = await campaigns_collection.insert_one(campaign_doc)
            campaign_id = str(result.inserted_id)
            campaign_name = campaign_doc["name"]
            campaign_message = campaign_doc["message"]
        
        # Get URLs from campaign data
        urls = campaign_data.get("urls", [])
        
        # Call external Telegram API through proxy
        telegram_payload = {
            "urls": urls,
            "message": campaign_message
        }
        
        print(f"🚀 Starting Telegram campaign: {campaign_name}")
        print(f"📱 URLs: {urls}")
        print(f"💬 Message: {campaign_message}")
        print(f"🔄 Calling external Telegram API...")
        
        # Call external Telegram API
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(
                    "http://3.106.56.62:8000/telegram/send",
                    json=telegram_payload,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    print(f"✅ Telegram API call successful: {response.text}")
                    telegram_response = response.json()
                else:
                    print(f"❌ Telegram API call failed: {response.status_code} - {response.text}")
                    # Don't fail the campaign, just log the error
                    telegram_response = {"error": f"External API returned {response.status_code}"}
                    
            except Exception as api_error:
                print(f"❌ Error calling external Telegram API: {api_error}")
                # Don't fail the campaign, just log the error
                telegram_response = {"error": str(api_error)}
        
        return {
            "success": True,
            "message": "Campaign started successfully",
            "campaign_id": campaign_id,
            "urls_count": len(urls),
            "urls": urls,
            "telegram_response": telegram_response
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error starting campaign: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start campaign: {str(e)}")

# Telegram Proxy Endpoint (for testing)
@router.post("/proxy-send")
async def proxy_telegram_send(
    send_data: dict,
    current_user: UserResponse = Depends(get_current_user)
):
    """Proxy endpoint to call external Telegram API"""
    try:
        import httpx
        
        # Validate required fields
        if not send_data.get("urls") or not send_data.get("message"):
            raise HTTPException(status_code=400, detail="urls and message are required")
        
        telegram_payload = {
            "urls": send_data["urls"],
            "message": send_data["message"]
        }
        
        print(f"🔄 Proxying Telegram send request...")
        print(f"📱 URLs: {telegram_payload['urls']}")
        print(f"💬 Message: {telegram_payload['message']}")
        
        # Call external Telegram API
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(
                    "http://3.106.56.62:8000/telegram/send",
                    json=telegram_payload,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    print(f"✅ Telegram API call successful: {response.text}")
                    return {
                        "success": True,
                        "message": "Message sent successfully",
                        "external_response": response.json()
                    }
                else:
                    print(f"❌ Telegram API call failed: {response.status_code} - {response.text}")
                    raise HTTPException(
                        status_code=response.status_code, 
                        detail=f"External API error: {response.text}"
                    )
                    
            except httpx.TimeoutException:
                raise HTTPException(status_code=408, detail="External API timeout")
            except httpx.ConnectError:
                raise HTTPException(status_code=503, detail="External API unavailable")
            except Exception as api_error:
                print(f"❌ Error calling external Telegram API: {api_error}")
                raise HTTPException(status_code=500, detail=f"External API error: {str(api_error)}")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in proxy endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Proxy error: {str(e)}")

# Manual Send Endpoint
@router.post("/send", response_model=TelegramSendResponse)
async def send_telegram_message(
    send_data: TelegramManualSend,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Send messages manually to selected contacts"""
    contacts_collection = db["telegram_contacts"]
    messages_collection = db["telegram_messages"]
    
    # Get contacts
    contact_ids = [ObjectId(cid) for cid in send_data.contact_ids]
    contacts = await contacts_collection.find({
        "_id": {"$in": contact_ids},
        "user_id": current_user.id,
        "is_active": True
    }).to_list(length=None)
    
    if not contacts:
        raise HTTPException(status_code=400, detail="No valid contacts found")
    
    # Create messages
    messages = []
    sent_count = 0
    failed_count = 0
    details = []
    
    for contact in contacts:
        try:
            message_doc = {
                "contact_id": str(contact["_id"]),
                "user_id": current_user.id,
                "message": send_data.message,
                "status": "sent" if send_data.send_immediately else "pending",
                "sent_at": datetime.utcnow() if send_data.send_immediately else None,
                "created_at": datetime.utcnow()
            }
            
            result = await messages_collection.insert_one(message_doc)
            messages.append(message_doc)
            sent_count += 1
            
            details.append({
                "contact_id": str(contact["_id"]),
                "contact_name": f"{contact['first_name']} {contact.get('last_name', '')}".strip(),
                "status": "sent" if send_data.send_immediately else "pending"
            })
            
        except Exception as e:
            failed_count += 1
            details.append({
                "contact_id": str(contact["_id"]),
                "contact_name": f"{contact['first_name']} {contact.get('last_name', '')}".strip(),
                "status": "failed",
                "error": str(e)
            })
    
    return TelegramSendResponse(
        success=sent_count > 0,
        message=f"Sent {sent_count} messages successfully" if sent_count > 0 else "Failed to send messages",
        sent_count=sent_count,
        failed_count=failed_count,
        details=details
    )


@router.post("/profile/create")
async def create_telegram_profile(
    request: Optional[TelegramLoginRequest] = Body(default=None),
    current_user: UserResponse = Depends(get_current_user)
):
    """Create or refresh Telegram profile before login."""
    user_id = _resolve_user_id(request, current_user)
    return await _forward_telegram_login_request("/profile/create", {"user_id": user_id})


@router.post("/login")
async def login_telegram_account(
    request: Optional[TelegramLoginRequest] = Body(default=None),
    current_user: UserResponse = Depends(get_current_user)
):
    """Start Telegram login flow via backend proxy."""
    user_id = _resolve_user_id(request, current_user)
    return await _forward_telegram_login_request("/telegram/login", {"user_id": user_id})


@router.get("/app-config")
async def get_telegram_app_config(
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Return saved Telegram API credentials for the current user."""
    config = await db.telegram_app_configs.find_one({"user_id": current_user.id})
    if not config:
        return {"api_id": "", "api_hash": ""}

    return {
        "api_id": config.get("api_id", ""),
        "api_hash": config.get("api_hash", "")
    }


@router.post("/app-config")
async def save_telegram_app_config(
    request: TelegramAppConfigRequest,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Create or update Telegram API credentials for the current user."""
    api_id = request.api_id.strip()
    api_hash = request.api_hash.strip()

    if not api_id or not api_hash:
        raise HTTPException(status_code=400, detail="api_id and api_hash are required")

    now = datetime.utcnow()
    existing = await db.telegram_app_configs.find_one({"user_id": current_user.id})

    if existing:
        await db.telegram_app_configs.update_one(
            {"_id": existing["_id"]},
            {
                "$set": {
                    "api_id": api_id,
                    "api_hash": api_hash,
                    "updated_at": now
                }
            }
        )
    else:
        await db.telegram_app_configs.insert_one(
            {
                "user_id": current_user.id,
                "api_id": api_id,
                "api_hash": api_hash,
                "created_at": now,
                "updated_at": now
            }
        )

    return {"api_id": api_id, "api_hash": api_hash}
