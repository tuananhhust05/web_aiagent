from fastapi import APIRouter, Depends, HTTPException, Query, Body
from typing import List, Optional
from datetime import datetime
from pathlib import Path
from bson import ObjectId
import httpx
import logging
import os
import glob
from pydantic import BaseModel
from telethon import TelegramClient
from telethon.errors import (
    PhoneCodeExpiredError,
    PhoneCodeInvalidError,
    PhoneNumberInvalidError,
    SessionPasswordNeededError,
    AuthKeyDuplicatedError,
)
from app.core.auth import get_current_user
from app.models.user import UserResponse
from app.models.telegram import (
    TelegramContactCreate, TelegramContactUpdate, TelegramContactResponse,
    TelegramCampaignCreate, TelegramCampaignUpdate, TelegramCampaignResponse,
    TelegramManualSend, TelegramSendResponse,
    TelegramContactListResponse, TelegramCampaignListResponse
)
from app.core.database import get_database
from app.services.telegram_listener import telegram_listener

router = APIRouter(prefix="/api/telegram", tags=["telegram"])
TELEGRAM_LOGIN_API_BASE = "http://3.106.56.62:8000"
TELEGRAM_SESSION_DIR = Path("session_telegram")

logger = logging.getLogger(__name__)


class TelegramLoginRequest(BaseModel):
    user_id: Optional[str] = None


class TelegramAppConfigRequest(BaseModel):
    api_id: str
    api_hash: str
    phone_number: Optional[str] = None


class TelegramOtpRequest(BaseModel):
    phone_number: Optional[str] = None


class TelegramOtpVerifyRequest(BaseModel):
    code: str


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


def _get_session_path(user_id: str) -> str:
    """Get the full path to the Telegram session file."""
    try:
        # Ensure directory exists and is writable
        TELEGRAM_SESSION_DIR.mkdir(parents=True, exist_ok=True)
        
        # Check if directory is writable
        if not os.access(TELEGRAM_SESSION_DIR, os.W_OK):
            raise PermissionError(f"Directory {TELEGRAM_SESSION_DIR} is not writable")
        
        # TelegramClient expects a file path with .session extension, not just directory
        session_file = TELEGRAM_SESSION_DIR / f"{user_id}.session"
        session_path_str = str(session_file)
        
        # Ensure parent directory exists (should already exist, but double-check)
        session_file.parent.mkdir(parents=True, exist_ok=True)
        
        return session_path_str
    except Exception as e:
        logger.error(f"Error creating session path for user_id={user_id}: {str(e)}", exc_info=True)
        raise


def _delete_session_files(session_path: str) -> None:
    """Delete all session files for a given session path.
    
    Args:
        session_path: Full path to the .session file (e.g., session_telegram/user_id.session)
    """
    try:
        # session_path is now a full file path ending with .session
        # Delete the main session file and all related files (.session-journal, etc.)
        # Pattern will match: user_id.session, user_id.session-journal, etc.
        pattern = f"{session_path}*"
        deleted_files = []
        for file_path in glob.glob(pattern):
            try:
                if os.path.isfile(file_path):
                    os.remove(file_path)
                    deleted_files.append(file_path)
                    logger.debug(f"Deleted session file: {file_path}")
            except Exception as e:
                logger.warning(f"Failed to delete session file {file_path}: {str(e)}")
        if deleted_files:
            logger.info(f"Deleted {len(deleted_files)} session file(s): {deleted_files}")
        else:
            logger.debug(f"No session files found to delete for pattern: {pattern}")
    except Exception as e:
        logger.error(f"Error deleting session files for {session_path}: {str(e)}", exc_info=True)


async def _get_app_config(db, user_id: str) -> Optional[dict]:
    return await db.telegram_app_configs.find_one({"user_id": user_id})


def _parse_api_id(raw_api_id: Optional[str]) -> int:
    try:
        return int(raw_api_id)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="api_id must be a numeric value")

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
    config = await _get_app_config(db, current_user.id)
    if not config:
        return {
            "api_id": "",
            "api_hash": "",
            "phone_number": "",
            "is_verified": False,
        }

    return {
        "api_id": config.get("api_id", ""),
        "api_hash": config.get("api_hash", ""),
        "phone_number": config.get("phone_number", ""),
        "is_verified": config.get("is_verified", False),
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
    phone_number = (request.phone_number or "").strip()

    if not api_id or not api_hash:
        raise HTTPException(status_code=400, detail="api_id and api_hash are required")

    now = datetime.utcnow()
    existing = await _get_app_config(db, current_user.id)

    if existing:
        await db.telegram_app_configs.update_one(
            {"_id": existing["_id"]},
            {
                "$set": {
                    "api_id": api_id,
                    "api_hash": api_hash,
                    "phone_number": phone_number or existing.get("phone_number"),
                    "phone_code_hash": None if phone_number else existing.get("phone_code_hash"),
                    "is_verified": False if phone_number else existing.get("is_verified", False),
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
                "phone_number": phone_number,
                "phone_code_hash": None,
                "is_verified": False,
                "created_at": now,
                "updated_at": now
            }
        )

    final_config = await _get_app_config(db, current_user.id)
    return {
        "api_id": final_config.get("api_id", api_id),
        "api_hash": final_config.get("api_hash", api_hash),
        "phone_number": final_config.get("phone_number", phone_number),
        "is_verified": final_config.get("is_verified", False),
    }


@router.post("/otp/request")
async def request_telegram_otp(
    request: TelegramOtpRequest,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Send an OTP code to the configured Telegram phone number."""
    logger.info(f"[OTP Request] Starting OTP request for user_id={current_user.id}, phone_number={request.phone_number}")
    client = None
    phone_code_hash = None
    
    try:
        # Step 1: Get app config from database
        try:
            config = await _get_app_config(db, current_user.id)
            logger.debug(f"[OTP Request] Config retrieved for user_id={current_user.id}, has_config={config is not None}")
        except Exception as e:
            logger.error(f"[OTP Request] Failed to get app config from database for user_id={current_user.id}, error={str(e)}", exc_info=True)
            raise HTTPException(
                status_code=500, 
                detail=f"Database error: Failed to retrieve Telegram app configuration. Error: {str(e)}"
            )
        
        if not config or not config.get("api_id") or not config.get("api_hash"):
            logger.warning(f"[OTP Request] Missing api_id or api_hash for user_id={current_user.id}, config={config is not None}")
            raise HTTPException(
                status_code=400, 
                detail="Please save api_id and api_hash before requesting OTP. Go to Telegram settings and configure your app credentials first."
            )

        # Step 2: Resolve phone number
        try:
            phone_number = (request.phone_number or config.get("phone_number") or "").strip()
            logger.debug(f"[OTP Request] Phone number resolved: {phone_number[:3]}*** (from request: {request.phone_number}, from config: {config.get('phone_number')})")
        except Exception as e:
            logger.error(f"[OTP Request] Error resolving phone number for user_id={current_user.id}, error={str(e)}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail=f"Error processing phone number: {str(e)}"
            )
        
        if not phone_number:
            logger.warning(f"[OTP Request] Phone number is required but not provided for user_id={current_user.id}")
            raise HTTPException(
                status_code=400, 
                detail="phone_number is required to request OTP. Please provide a phone number in the request or save it in your Telegram app configuration."
            )

        # Step 3: Parse API ID and create session path
        try:
            api_id_int = _parse_api_id(config.get("api_id"))
            logger.debug(f"[OTP Request] API ID parsed successfully: {api_id_int}")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"[OTP Request] Error parsing API ID for user_id={current_user.id}, api_id={config.get('api_id')}, error={str(e)}", exc_info=True)
            raise HTTPException(
                status_code=400,
                detail=f"Invalid API ID format. Expected numeric value, got: {config.get('api_id')}. Error: {str(e)}"
            )
        
        try:
            session_path = _get_session_path(str(current_user.id))
            logger.debug(f"[OTP Request] Session path created: {session_path}")
        except Exception as e:
            logger.error(f"[OTP Request] Error creating session path for user_id={current_user.id}, error={str(e)}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create session directory. Error: {str(e)}"
            )
        
        # Step 4: Create Telegram client
        try:
            logger.debug(f"[OTP Request] Creating TelegramClient with api_id={api_id_int}, session_path={session_path}")
            client = TelegramClient(session_path, api_id_int, config.get("api_hash"))
        except Exception as e:
            logger.error(f"[OTP Request] Error creating TelegramClient for user_id={current_user.id}, error={str(e)}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail=f"Failed to initialize Telegram client. Please check your api_id and api_hash. Error: {str(e)}"
            )

        # Step 5: Connect and send OTP
        # Try to connect, if AuthKeyDuplicatedError occurs, delete session and retry once
        max_retries = 2
        retry_count = 0
        connected = False
        
        while retry_count < max_retries and not connected:
            try:
                if retry_count > 0:
                    logger.info(f"[OTP Request] Retrying connection (attempt {retry_count + 1}/{max_retries}) for user_id={current_user.id}")
                    # Disconnect previous client if exists
                    try:
                        if client:
                            await client.disconnect()
                    except:
                        pass
                    # Create new client with fresh session
                    client = TelegramClient(session_path, api_id_int, config.get("api_hash"))
                
                logger.info(f"[OTP Request] Connecting to Telegram for user_id={current_user.id} (attempt {retry_count + 1}/{max_retries})")
                await client.connect()
                logger.info(f"[OTP Request] Connected successfully, sending code request to {phone_number[:3]}***")
                connected = True
                
            except AuthKeyDuplicatedError as e:
                retry_count += 1
                logger.error(f"[OTP Request] AuthKeyDuplicatedError for user_id={current_user.id}, session_path={session_path}, attempt={retry_count}, error={str(e)}")
                
                # Session file is invalid, delete it
                try:
                    _delete_session_files(session_path)
                    logger.info(f"[OTP Request] Deleted invalid session files for user_id={current_user.id}")
                except Exception as del_err:
                    logger.error(f"[OTP Request] Failed to delete session files: {str(del_err)}", exc_info=True)
                
                # If this was the last retry, raise error
                if retry_count >= max_retries:
                    logger.error(f"[OTP Request] AuthKeyDuplicatedError persists after {max_retries} attempts for user_id={current_user.id}")
                    raise HTTPException(
                        status_code=400,
                        detail="The Telegram session file is invalid or was used from a different location. The session has been reset. Please wait a few seconds and try requesting OTP again. If the problem persists, there may be another process using this Telegram account."
                    )
                
                # Otherwise, continue loop to retry
                logger.info(f"[OTP Request] Will retry connection after deleting session files for user_id={current_user.id}")
                continue
                
            except Exception as e:
                logger.error(f"[OTP Request] Error connecting to Telegram for user_id={current_user.id}, error={str(e)}", exc_info=True)
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to connect to Telegram servers. Please check your internet connection and try again. Error: {str(e)}"
                )
        
        try:
            sent = await client.send_code_request(phone_number)
            phone_code_hash = sent.phone_code_hash
            logger.info(f"[OTP Request] OTP code sent successfully, phone_code_hash={phone_code_hash[:10]}***")
        except PhoneNumberInvalidError as e:
            logger.error(f"[OTP Request] Invalid phone number for user_id={current_user.id}, phone={phone_number[:3]}***, error={str(e)}")
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid Telegram phone number: {phone_number}. Please check the phone number format (e.g., +1234567890). Error: {str(e)}"
            )
        except Exception as e:
            logger.error(f"[OTP Request] Error sending OTP code request for user_id={current_user.id}, phone={phone_number[:3]}***, error={str(e)}", exc_info=True)
            error_msg = str(e)
            if "flood" in error_msg.lower() or "rate limit" in error_msg.lower():
                raise HTTPException(
                    status_code=429,
                    detail=f"Too many requests. Please wait a few minutes before requesting another OTP code. Error: {error_msg}"
                )
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to send OTP code request to Telegram. Error: {error_msg}"
            )
        finally:
            try:
                if client:
                    logger.debug(f"[OTP Request] Disconnecting Telegram client for user_id={current_user.id}")
                    await client.disconnect()
            except Exception as e:
                logger.warning(f"[OTP Request] Error disconnecting client for user_id={current_user.id}, error={str(e)}")

        # Step 6: Update database
        if not phone_code_hash:
            logger.error(f"[OTP Request] phone_code_hash is None after sending OTP for user_id={current_user.id}")
            raise HTTPException(
                status_code=500,
                detail="OTP was sent but phone_code_hash is missing. Please try again."
            )
        
        now = datetime.utcnow()
        update_doc = {
            "phone_number": phone_number,
            "phone_code_hash": phone_code_hash,
            "is_verified": False,
            "session_file": session_path,
            "updated_at": now,
        }
        logger.debug(f"[OTP Request] Preparing to update database for user_id={current_user.id}")
        
        try:
            if config:
                logger.debug(f"[OTP Request] Updating existing config for user_id={current_user.id}")
                result = await db.telegram_app_configs.update_one(
                    {"user_id": current_user.id},
                    {"$set": update_doc},
                    upsert=True
                )
                logger.debug(f"[OTP Request] Update result: matched={result.matched_count}, modified={result.modified_count}")
            else:
                logger.debug(f"[OTP Request] Inserting new config for user_id={current_user.id}")
                await db.telegram_app_configs.insert_one(
                    {
                        "user_id": current_user.id,
                        "api_id": str(api_id_int),
                        "api_hash": config.get("api_hash"),
                        **update_doc,
                        "created_at": now,
                    }
                )
            logger.info(f"[OTP Request] Database updated successfully for user_id={current_user.id}")
        except Exception as e:
            logger.error(f"[OTP Request] Error updating database for user_id={current_user.id}, error={str(e)}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail=f"OTP was sent successfully, but failed to save configuration to database. Please try verifying the OTP code. Database error: {str(e)}"
            )

        # Step 7: Stop existing session
        try:
            logger.debug(f"[OTP Request] Stopping user session for user_id={current_user.id}")
            await telegram_listener.stop_user_session(str(current_user.id))
        except Exception as e:
            logger.warning(f"[OTP Request] Error stopping user session for user_id={current_user.id}, error={str(e)}", exc_info=True)
            # Don't fail the request if stopping session fails, just log it

        logger.info(f"[OTP Request] OTP request completed successfully for user_id={current_user.id}")
        return {
            "message": "OTP sent successfully. Please check your Telegram app.",
            "phone_code_hash": phone_code_hash,
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"[OTP Request] Unexpected error in OTP request for user_id={current_user.id}, error={str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail=f"An unexpected error occurred while requesting OTP: {str(e)}. Please check the logs for more details."
        )


@router.post("/otp/verify")
async def verify_telegram_otp(
    request: TelegramOtpVerifyRequest,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Verify OTP code and finalize Telegram session."""
    config = await _get_app_config(db, current_user.id)
    if not config or not config.get("api_id") or not config.get("api_hash"):
        raise HTTPException(status_code=400, detail="Please configure Telegram App credentials first.")

    phone_number = config.get("phone_number")
    phone_code_hash = config.get("phone_code_hash")
    if not phone_number or not phone_code_hash:
        raise HTTPException(status_code=400, detail="No OTP request found. Please request a new OTP.")

    code = request.code.strip()
    if not code:
        raise HTTPException(status_code=400, detail="OTP code is required.")

    api_id_int = _parse_api_id(config.get("api_id"))
    session_path = _get_session_path(str(current_user.id))
    client = TelegramClient(session_path, api_id_int, config.get("api_hash"))

    try:
        await client.connect()
        await client.sign_in(
            phone=phone_number,
            code=code,
            phone_code_hash=phone_code_hash
        )
    except PhoneCodeInvalidError:
        raise HTTPException(status_code=400, detail="Invalid OTP code. Please try again.")
    except PhoneCodeExpiredError:
        raise HTTPException(status_code=400, detail="OTP code has expired. Please request a new one.")
    except SessionPasswordNeededError:
        raise HTTPException(
            status_code=401,
            detail="Two-factor password is enabled on this Telegram account. Please disable it temporarily."
        )
    except Exception as e:
        print(f"❌ Error verifying Telegram OTP: {e}")
        raise HTTPException(status_code=500, detail="Failed to verify OTP. Please try again.")
    finally:
        await client.disconnect()

    await db.telegram_app_configs.update_one(
        {"user_id": current_user.id},
        {
            "$set": {
                "is_verified": True,
                "phone_code_hash": None,
                "session_file": session_path,
                "updated_at": datetime.utcnow()
            }
        }
    )

    await telegram_listener.reload_user_session(str(current_user.id))

    return {"message": "Telegram session verified successfully.", "session_file": session_path}
