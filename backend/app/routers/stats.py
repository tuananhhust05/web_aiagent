from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timedelta
from typing import Dict, Any
from bson import ObjectId
from app.core.database import get_database
from app.core.auth import get_current_active_user
from app.models.user import UserResponse

router = APIRouter()

@router.get("/dashboard", response_model=Dict[str, Any])
async def get_dashboard_stats(
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Get dashboard statistics for the current user"""
    db = get_database()
    
    # Calculate date range for this month
    now = datetime.utcnow()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    try:
        # Get total contacts count
        total_contacts = await db.contacts.count_documents({
            "user_id": current_user.id
        })
        
        # Get calls count for this month
        calls_this_month = await db.calls.count_documents({
            "user_id": current_user.id,
            "created_at": {"$gte": start_of_month}
        })
        
        # Get active campaigns count
        active_campaigns = await db.campaigns.count_documents({
            "user_id": current_user.id,
            "status": "active"
        })
        
        # Get total campaigns count
        total_campaigns = await db.campaigns.count_documents({
            "user_id": current_user.id
        })
        
        # Get calls by status for this month
        calls_by_status = await db.calls.aggregate([
            {
                "$match": {
                    "user_id": current_user.id,
                    "created_at": {"$gte": start_of_month}
                }
            },
            {
                "$group": {
                    "_id": "$status",
                    "count": {"$sum": 1}
                }
            }
        ]).to_list(length=None)
        
        # Convert to dictionary
        calls_status_dict = {item["_id"]: item["count"] for item in calls_by_status}
        
        # Get recent activity (last 5 calls and campaigns)
        recent_calls = await db.calls.find({
            "user_id": current_user.id
        }).sort("created_at", -1).limit(5).to_list(length=5)
        
        recent_campaigns = await db.campaigns.find({
            "user_id": current_user.id
        }).sort("created_at", -1).limit(5).to_list(length=5)
        
        # Convert ObjectIds to strings for JSON serialization
        for call in recent_calls:
            call["id"] = str(call["_id"])
            del call["_id"]
        
        for campaign in recent_campaigns:
            campaign["id"] = str(campaign["_id"])
            del campaign["_id"]
        
        return {
            "total_contacts": total_contacts,
            "calls_this_month": calls_this_month,
            "active_campaigns": active_campaigns,
            "total_campaigns": total_campaigns,
            "calls_by_status": calls_status_dict,
            "recent_calls": recent_calls,
            "recent_campaigns": recent_campaigns,
            "month": now.strftime("%B %Y")
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch dashboard stats: {str(e)}"
        )

@router.get("/contacts", response_model=Dict[str, Any])
async def get_contacts_stats(
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Get contacts statistics for the current user"""
    db = get_database()
    
    try:
        # Get total contacts count
        total_contacts = await db.contacts.count_documents({
            "user_id": current_user.id
        })
        
        # Get contacts by status
        contacts_by_status = await db.contacts.aggregate([
            {
                "$match": {
                    "user_id": current_user.id
                }
            },
            {
                "$group": {
                    "_id": "$status",
                    "count": {"$sum": 1}
                }
            }
        ]).to_list(length=None)
        
        # Get contacts by source
        contacts_by_source = await db.contacts.aggregate([
            {
                "$match": {
                    "user_id": current_user.id
                }
            },
            {
                "$group": {
                    "_id": "$source",
                    "count": {"$sum": 1}
                }
            }
        ]).to_list(length=None)
        
        # Get contacts created this month
        now = datetime.utcnow()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        contacts_this_month = await db.contacts.count_documents({
            "user_id": current_user.id,
            "created_at": {"$gte": start_of_month}
        })
        
        # Convert to dictionaries
        status_dict = {item["_id"]: item["count"] for item in contacts_by_status}
        source_dict = {item["_id"]: item["count"] for item in contacts_by_source}
        
        return {
            "total_contacts": total_contacts,
            "contacts_this_month": contacts_this_month,
            "contacts_by_status": status_dict,
            "contacts_by_source": source_dict,
            "month": now.strftime("%B %Y")
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch contacts stats: {str(e)}"
        )
