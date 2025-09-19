from fastapi import APIRouter, HTTPException, status
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.core.database import get_database
from app.models.call import CallStatus, SentimentType

router = APIRouter()

# Model for updating call by phone number
class CallUpdateByPhone(BaseModel):
    recording_url: Optional[str] = None
    transcript: Optional[str] = None
    sentiment: Optional[SentimentType] = None
    sentiment_score: Optional[float] = None
    feedback: Optional[str] = None
    meeting_booked: Optional[bool] = None
    meeting_date: Optional[datetime] = None
    notes: Optional[str] = None
    duration: Optional[int] = None
    status: Optional[CallStatus] = None

@router.put("/auto-update-latest")
async def auto_update_latest_call(
    update_data: CallUpdateByPhone
):
    """
    Auto update the most recent call record in the entire calls collection.
    This endpoint is designed for AI agents to update call data without authentication.
    Automatically finds and updates the latest call record regardless of phone number.
    """
    db = get_database()
    
    # Find the most recent call in the entire collection
    latest_call = await db.calls.find_one(
        {},
        sort=[("created_at", -1)]
    )
    
    if not latest_call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No calls found in the database"
        )
    
    # Build update data - focus on duration and recording_url
    update_fields = {"updated_at": datetime.utcnow()}
    for field, value in update_data.dict(exclude_unset=True).items():
        if value is not None:
            update_fields[field] = value
    
    # Update the call
    result = await db.calls.update_one(
        {"_id": latest_call["_id"]},
        {"$set": update_fields}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update call"
        )
    
    # Get updated call
    updated_call = await db.calls.find_one({"_id": latest_call["_id"]})
    
    return {
        "message": "Latest call updated successfully",
        "call_id": updated_call["_id"],
        "phone_number": updated_call.get("phone_number", "N/A"),
        "updated_fields": list(update_fields.keys())
    }
