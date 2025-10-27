from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from app.core.database import get_database
from app.core.auth import get_current_active_user
from app.models.user import UserResponse
from app.models.renewal import (
    RenewalCreate, 
    RenewalUpdate, 
    RenewalResponse, 
    RenewalListResponse,
    RenewalStats,
    RenewalStatus,
    RenewalType
)

router = APIRouter()

@router.get("", response_model=RenewalListResponse)
async def get_renewals(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    status: Optional[RenewalStatus] = Query(None, description="Filter by status"),
    renewal_type: Optional[RenewalType] = Query(None, description="Filter by renewal type"),
    search: Optional[str] = Query(None, description="Search in contact name, email, or notes"),
    current_user: UserResponse = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Get renewals with optional filtering and pagination"""
    try:
        # Build filter query
        filter_query = {"user_id": current_user.id}
        
        if status:
            filter_query["status"] = status.value
        
        if renewal_type:
            filter_query["renewal_type"] = renewal_type.value
        
        if search:
            filter_query["$or"] = [
                {"contact_name": {"$regex": search, "$options": "i"}},
                {"contact_email": {"$regex": search, "$options": "i"}},
                {"notes": {"$regex": search, "$options": "i"}}
            ]
        
        # Calculate skip
        skip = (page - 1) * limit
        
        # Get renewals
        renewals_cursor = db.renewals.find(filter_query).skip(skip).limit(limit)
        renewals = await renewals_cursor.to_list(length=limit)
        
        # Get total count
        total = await db.renewals.count_documents(filter_query)
        
        # Convert to response format
        renewal_responses = []
        for renewal in renewals:
            renewal_dict = dict(renewal)
            renewal_dict['id'] = str(renewal_dict['_id'])
            del renewal_dict['_id']
            renewal_responses.append(RenewalResponse(**renewal_dict))
        
        return RenewalListResponse(
            renewals=renewal_responses,
            total=total,
            page=page,
            limit=limit
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch renewals: {str(e)}"
        )

@router.post("", response_model=RenewalResponse)
async def create_renewal(
    renewal_data: RenewalCreate,
    current_user: UserResponse = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Create a new renewal"""
    try:
        # Get contact information
        contact = await db.contacts.find_one({"_id": ObjectId(renewal_data.contact_id)})
        if not contact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contact not found"
            )
        
        # Prepare renewal document
        renewal_doc = {
            "user_id": current_user.id,
            "contact_id": renewal_data.contact_id,
            "contact_name": f"{contact.get('first_name', '')} {contact.get('last_name', '')}".strip(),
            "contact_email": contact.get('email'),
            "contact_phone": contact.get('phone'),
            "renewal_type": renewal_data.renewal_type.value,
            "current_expiry_date": renewal_data.current_expiry_date,
            "renewal_date": renewal_data.renewal_date,
            "amount": renewal_data.amount,
            "currency": renewal_data.currency,
            "status": renewal_data.status.value,
            "notes": renewal_data.notes,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Insert renewal
        result = await db.renewals.insert_one(renewal_doc)
        
        # Get the created renewal
        created_renewal = await db.renewals.find_one({"_id": result.inserted_id})
        created_renewal['id'] = str(created_renewal['_id'])
        del created_renewal['_id']
        
        return RenewalResponse(**created_renewal)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create renewal: {str(e)}"
        )

@router.get("/{renewal_id}", response_model=RenewalResponse)
async def get_renewal(
    renewal_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Get a specific renewal by ID"""
    try:
        renewal = await db.renewals.find_one({
            "_id": ObjectId(renewal_id),
            "user_id": current_user.id
        })
        
        if not renewal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Renewal not found"
            )
        
        renewal['id'] = str(renewal['_id'])
        del renewal['_id']
        
        return RenewalResponse(**renewal)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch renewal: {str(e)}"
        )

@router.put("/{renewal_id}", response_model=RenewalResponse)
async def update_renewal(
    renewal_id: str,
    renewal_data: RenewalUpdate,
    current_user: UserResponse = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Update a renewal"""
    try:
        # Check if renewal exists
        existing_renewal = await db.renewals.find_one({
            "_id": ObjectId(renewal_id),
            "user_id": current_user.id
        })
        
        if not existing_renewal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Renewal not found"
            )
        
        # Prepare update data
        update_data = {k: v for k, v in renewal_data.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        # If contact_id is being updated, get new contact info
        if "contact_id" in update_data:
            contact = await db.contacts.find_one({"_id": ObjectId(update_data["contact_id"])})
            if not contact:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Contact not found"
                )
            update_data["contact_name"] = f"{contact.get('first_name', '')} {contact.get('last_name', '')}".strip()
            update_data["contact_email"] = contact.get('email')
            update_data["contact_phone"] = contact.get('phone')
        
        # Update renewal
        await db.renewals.update_one(
            {"_id": ObjectId(renewal_id)},
            {"$set": update_data}
        )
        
        # Get updated renewal
        updated_renewal = await db.renewals.find_one({"_id": ObjectId(renewal_id)})
        updated_renewal['id'] = str(updated_renewal['_id'])
        del updated_renewal['_id']
        
        return RenewalResponse(**updated_renewal)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update renewal: {str(e)}"
        )

@router.delete("/{renewal_id}")
async def delete_renewal(
    renewal_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Delete a renewal"""
    try:
        result = await db.renewals.delete_one({
            "_id": ObjectId(renewal_id),
            "user_id": current_user.id
        })
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Renewal not found"
            )
        
        return {"message": "Renewal deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete renewal: {str(e)}"
        )

@router.get("/stats/summary", response_model=RenewalStats)
async def get_renewal_stats(
    current_user: UserResponse = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Get renewal statistics"""
    try:
        # Get all renewals for the user
        renewals = await db.renewals.find({"user_id": current_user.id}).to_list(length=None)
        
        total_renewals = len(renewals)
        pending_renewals = len([r for r in renewals if r.get("status") == "pending"])
        overdue_renewals = len([r for r in renewals if r.get("status") == "overdue"])
        completed_renewals = len([r for r in renewals if r.get("status") == "completed"])
        cancelled_renewals = len([r for r in renewals if r.get("status") == "cancelled"])
        
        total_amount = sum(r.get("amount", 0) for r in renewals)
        average_amount = total_amount / total_renewals if total_renewals > 0 else 0
        
        return RenewalStats(
            total_renewals=total_renewals,
            pending_renewals=pending_renewals,
            overdue_renewals=overdue_renewals,
            completed_renewals=completed_renewals,
            cancelled_renewals=cancelled_renewals,
            total_amount=total_amount,
            average_amount=average_amount
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch renewal stats: {str(e)}"
        )
