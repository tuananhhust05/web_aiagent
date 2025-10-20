from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime

from app.core.database import get_database
from app.core.auth import get_current_active_user
from app.models.user import UserResponse
from app.models.inbox import InboxResponseCreate, InboxResponse


router = APIRouter()


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


