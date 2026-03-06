"""
Router for Enablement / General Feedback
Provides cross-meeting, longitudinal feedback endpoints
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional
from app.core.database import get_database
from app.core.auth import get_current_active_user
from app.models.user import UserResponse
from app.models.enablement_feedback import EnablementFeedbackResponse
from app.services.enablement_feedback_service import EnablementFeedbackService
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter()


@router.get("/enablement-feedback", response_model=EnablementFeedbackResponse)
async def get_enablement_feedback(
    days: int = Query(30, ge=7, le=90, description="Number of days to analyze"),
    min_calls: int = Query(5, ge=1, le=50, description="Minimum calls required for analysis"),
    force_refresh: bool = Query(False, description="Force regeneration of metrics"),
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Get enablement feedback for the current user.
    
    This endpoint provides cross-meeting, longitudinal feedback including:
    - Observations: Neutral, descriptive patterns
    - Risk Signals: Potential impacts on deal quality
    - Improvement Suggestions: Actionable coaching
    
    The analysis is based on the last N days of calls and requires a minimum
    number of calls to generate meaningful insights.
    """
    service = EnablementFeedbackService(db)
    
    # If force_refresh, extract metrics from all recent meetings first
    if force_refresh:
        # Get recent meetings
        from datetime import datetime, timedelta
        window_start = datetime.utcnow() - timedelta(days=days)
        
        meetings_cursor = db.meetings.find({
            "user_id": current_user.id,
            "created_at": {"$gte": window_start}
        })
        
        meetings = await meetings_cursor.to_list(length=None)
        
        # Extract and store metrics for each meeting
        for meeting in meetings:
            try:
                await service.extract_and_store_metrics(
                    meeting_id=meeting["_id"],
                    user_id=current_user.id
                )
            except Exception as e:
                # Log error but continue with other meetings
                print(f"Error extracting metrics for meeting {meeting['_id']}: {e}")
    
    # Generate enablement feedback
    try:
        feedback = await service.generate_enablement_feedback(
            user_id=current_user.id,
            days=days,
            min_calls=min_calls
        )
        return feedback
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate enablement feedback: {str(e)}"
        )


@router.post("/enablement-feedback/extract-metrics/{meeting_id}")
async def extract_meeting_metrics(
    meeting_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Manually extract and store normalized metrics for a specific meeting.
    
    This is useful for:
    - Backfilling metrics for existing meetings
    - Updating metrics after meeting re-analysis
    """
    service = EnablementFeedbackService(db)
    
    try:
        metric = await service.extract_and_store_metrics(
            meeting_id=meeting_id,
            user_id=current_user.id
        )
        
        if not metric:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Meeting not found or no metrics available"
            )
        
        return {
            "message": "Metrics extracted and stored successfully",
            "meeting_id": meeting_id,
            "metrics": metric.dict(exclude={"id"})
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to extract metrics: {str(e)}"
        )


@router.post("/enablement-feedback/backfill")
async def backfill_all_metrics(
    days: int = Query(30, ge=7, le=90, description="Number of days to backfill"),
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Backfill normalized metrics for all meetings in the specified time window.
    
    This should be called once after deploying the enablement feedback feature
    to populate the normalized metrics layer with historical data.
    """
    from datetime import datetime, timedelta
    
    service = EnablementFeedbackService(db)
    window_start = datetime.utcnow() - timedelta(days=days)
    
    # Get all meetings in window
    meetings_cursor = db.meetings.find({
        "user_id": current_user.id,
        "created_at": {"$gte": window_start}
    })
    
    meetings = await meetings_cursor.to_list(length=None)
    
    success_count = 0
    error_count = 0
    errors = []
    
    for meeting in meetings:
        try:
            await service.extract_and_store_metrics(
                meeting_id=meeting["_id"],
                user_id=current_user.id
            )
            success_count += 1
        except Exception as e:
            error_count += 1
            errors.append({
                "meeting_id": meeting["_id"],
                "error": str(e)
            })
    
    return {
        "message": f"Backfill completed for {len(meetings)} meetings",
        "success_count": success_count,
        "error_count": error_count,
        "errors": errors[:10],  # Return first 10 errors
    }
