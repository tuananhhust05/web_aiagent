from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from datetime import datetime
from bson import ObjectId
from typing import List, Optional
from app.core.database import get_database
from app.core.auth import get_current_active_user
from app.models.user import UserResponse
from app.models.email import (
    EmailCreate, EmailUpdate, EmailResponse, EmailSendRequest, 
    EmailStats, EmailStatus, EmailHistory, EmailHistoryResponse
)
from app.services.email_service import email_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/listemails", response_model=List[EmailResponse])
async def get_emails(
    skip: int = 0,
    limit: int = 50,
    status_filter: Optional[EmailStatus] = None,
    search: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Get list of emails with search and filtering"""
    try:
        db = get_database()
        
        # Build query filter
        query_filter = {"created_by": current_user.id}
        
        # Add status filter
        if status_filter:
            query_filter["status"] = status_filter
        
        # Add search filter
        if search:
            query_filter["$or"] = [
                {"subject": {"$regex": search, "$options": "i"}},
                {"content": {"$regex": search, "$options": "i"}},
                {"recipients.email": {"$regex": search, "$options": "i"}}
            ]
        
        # Get emails from database
        cursor = db.emails.find(query_filter).sort("created_at", -1).skip(skip).limit(limit)
        emails = await cursor.to_list(length=limit)
        
        # Convert to EmailResponse objects
        email_responses = []
        for email in emails:
            email["id"] = str(email["_id"])
            email_responses.append(EmailResponse(**email))
        
        logger.info(f"📧 [EMAIL] Retrieved {len(email_responses)} emails for user {current_user.id}")
        return email_responses
        
    except Exception as e:
        logger.error(f"Error getting emails: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get emails: {str(e)}"
        )

@router.get("/test")
async def test_email_endpoint():
    """Test endpoint to verify emails router is working"""
    return {"message": "Email router is working!", "status": "success", "timestamp": datetime.now().isoformat()}

@router.get("/health")
async def email_health_check():
    """Health check for email service"""
    return {
        "status": "healthy",
        "service": "email",
        "endpoints": ["/api/emails", "/api/emails/test", "/api/emails/health"]
    }

@router.get("/list")
async def get_emails_simple():
    """Simple endpoint to get emails without authentication for testing"""
    try:
        # Return mock data for now to avoid database issues
        mock_emails = [
            {
                "id": "1",
                "subject": "Test Email 1",
                "status": "sent",
                "created_at": "2024-01-01T00:00:00Z"
            },
            {
                "id": "2", 
                "subject": "Test Email 2",
                "status": "draft",
                "created_at": "2024-01-02T00:00:00Z"
            }
        ]
        return {
            "status": "success",
            "count": len(mock_emails),
            "emails": mock_emails
        }
    except Exception as e:
        logger.error(f"Error getting emails: {str(e)}")
        return {
            "status": "error",
            "message": str(e)
        }


@router.get("/{email_id}", response_model=EmailResponse)
async def get_email(
    email_id: str,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Get email by ID"""
    try:
        db = get_database()
        
        email = await db.emails.find_one({
            "_id": ObjectId(email_id),
            "created_by": current_user.id
        })
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Email not found"
            )
        
        email["id"] = str(email["_id"])
        return EmailResponse(**email)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting email: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get email: {str(e)}"
        )

@router.post("/sendmail", response_model=EmailResponse)
async def create_email(
    email_data: EmailCreate,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Create new email"""
    try:
        db = get_database()
        
        # Get contacts from groups if specified
        all_recipients = email_data.recipients.copy()
        
        if email_data.group_ids:
            groups = await db.groups.find({"_id": {"$in": email_data.group_ids}}).to_list(length=None)
            for group in groups:
                contacts = await db.contacts.find({"_id": {"$in": group.get("member_ids", [])}}).to_list(length=None)
                for contact in contacts:
                    if contact.get("email"):
                        recipient = {
                            "email": contact["email"],
                            "name": f"{contact.get('first_name', '')} {contact.get('last_name', '')}".strip(),
                            "contact_id": str(contact["_id"])
                        }
                        all_recipients.append(recipient)
        
        # Add individual contacts if specified
        if email_data.contact_ids:
            contacts = await db.contacts.find({"_id": {"$in": email_data.contact_ids}}).to_list(length=None)
            for contact in contacts:
                if contact.get("email"):
                    recipient = {
                        "email": contact["email"],
                        "name": f"{contact.get('first_name', '')} {contact.get('last_name', '')}".strip(),
                        "contact_id": str(contact["_id"])
                    }
                    all_recipients.append(recipient)
        
        # Remove duplicates
        unique_recipients = []
        seen_emails = set()
        for recipient in all_recipients:
            if recipient.get("email") not in seen_emails:
                unique_recipients.append(recipient)
                seen_emails.add(recipient.get("email"))
        
        email_doc = {
            "subject": email_data.subject,
            "content": email_data.content,
            "is_html": email_data.is_html,
            "status": EmailStatus.DRAFT,
            "recipients": unique_recipients,
            "attachments": email_data.attachments,
            "sent_count": 0,
            "failed_count": 0,
            "total_recipients": len(unique_recipients),
            "created_by": current_user.id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "sent_at": None
        }
        
        result = await db.emails.insert_one(email_doc)
        email_doc["_id"] = result.inserted_id
        email_doc["id"] = str(result.inserted_id)
        
        # Save creation history
        history_doc = {
            "email_id": result.inserted_id,
            "action": "created",
            "status": "success",
            "email_subject": email_doc["subject"],
            "sent_at": datetime.utcnow(),
            "created_by": current_user.id
        }
        await db.email_history.insert_one(history_doc)
        
        logger.info(f"📧 [EMAIL] Created email: {email_doc['id']} with {len(unique_recipients)} recipients")
        
        return EmailResponse(**email_doc)
        
    except Exception as e:
        logger.error(f"Error creating email: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create email: {str(e)}"
        )

@router.put("/{email_id}", response_model=EmailResponse)
async def update_email(
    email_id: str,
    email_data: EmailUpdate,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Update email"""
    try:
        db = get_database()
        
        # Check if email exists and belongs to user
        existing_email = await db.emails.find_one({
            "_id": ObjectId(email_id),
            "created_by": current_user.id
        })
        
        if not existing_email:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Email not found"
            )
        
        # Check if email is already sent
        if existing_email.get("status") == EmailStatus.SENT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot update sent email"
            )
        
        # Prepare update data
        update_data = {k: v for k, v in email_data.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        # Update email
        result = await db.emails.update_one(
            {"_id": ObjectId(email_id), "created_by": current_user.id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Email not found"
            )
        
        # Get updated email
        updated_email = await db.emails.find_one({"_id": ObjectId(email_id)})
        updated_email["id"] = str(updated_email["_id"])
        
        # Save update history
        history_doc = {
            "email_id": ObjectId(email_id),
            "action": "updated",
            "status": "success",
            "email_subject": updated_email.get("subject", ""),
            "sent_at": datetime.utcnow(),
            "created_by": current_user.id
        }
        await db.email_history.insert_one(history_doc)
        
        logger.info(f"📧 [EMAIL] Updated email: {email_id}")
        
        return EmailResponse(**updated_email)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating email: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update email: {str(e)}"
        )

@router.post("/{email_id}/send", response_model=dict)
async def send_email(
    email_id: str,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Send email and save history"""
    try:
        db = get_database()
        
        # Get email
        email = await db.emails.find_one({
            "_id": ObjectId(email_id),
            "created_by": current_user.id
        })
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Email not found"
            )
        
        if email["status"] == EmailStatus.SENT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already sent"
            )
        
        # Update status to sending
        await db.emails.update_one(
            {"_id": ObjectId(email_id)},
            {
                "$set": {
                    "status": EmailStatus.SENDING,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Send email
        result = await email_service.send_email_async(
            subject=email["subject"],
            content=email["content"],
            is_html=email["is_html"],
            recipients=email["recipients"],
            attachments=email.get("attachments", [])
        )
        
        # Update email status and save history
        if result["success"]:
            await db.emails.update_one(
                {"_id": ObjectId(email_id)},
                {
                    "$set": {
                        "status": EmailStatus.SENT,
                        "sent_count": result["sent_count"],
                        "failed_count": result["failed_count"],
                        "sent_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            # Save email history
            history_doc = {
                "email_id": ObjectId(email_id),
                "action": "sent",
                "status": "success",
                "sent_count": result["sent_count"],
                "failed_count": result["failed_count"],
                "recipients": email["recipients"],
                "sent_at": datetime.utcnow(),
                "created_by": current_user.id
            }
            await db.email_history.insert_one(history_doc)
            
            logger.info(f"📧 [EMAIL] Successfully sent email: {email_id}")
        else:
            await db.emails.update_one(
                {"_id": ObjectId(email_id)},
                {
                    "$set": {
                        "status": EmailStatus.FAILED,
                        "failed_count": result["failed_count"],
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            # Save failed email history
            history_doc = {
                "email_id": ObjectId(email_id),
                "action": "send_failed",
                "status": "failed",
                "error": result.get("error", "Unknown error"),
                "failed_count": result["failed_count"],
                "recipients": email["recipients"],
                "sent_at": datetime.utcnow(),
                "created_by": current_user.id
            }
            await db.email_history.insert_one(history_doc)
            
            logger.error(f"📧 [EMAIL] Failed to send email: {email_id} - {result['error']}")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        # Update status to failed
        try:
            await db.emails.update_one(
                {"_id": ObjectId(email_id)},
                {
                    "$set": {
                        "status": EmailStatus.FAILED,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            # Save exception history
            history_doc = {
                "email_id": ObjectId(email_id),
                "action": "send_exception",
                "status": "failed",
                "error": str(e),
                "sent_at": datetime.utcnow(),
                "created_by": current_user.id
            }
            await db.email_history.insert_one(history_doc)
        except:
            pass
        
        logger.error(f"📧 [EMAIL] Exception sending email: {email_id} - {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send email: {str(e)}"
        )

@router.delete("/{email_id}")
async def delete_email(
    email_id: str,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Delete email"""
    try:
        db = get_database()
        
        # Check if email exists and belongs to user
        email = await db.emails.find_one({
            "_id": ObjectId(email_id),
            "created_by": current_user.id
        })
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Email not found"
            )
        
        # Check if email is already sent
        if email.get("status") == EmailStatus.SENT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete sent email"
            )
        
        # Delete email
        result = await db.emails.delete_one({
            "_id": ObjectId(email_id),
            "created_by": current_user.id
        })
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Email not found"
            )
        
        # Save deletion history
        history_doc = {
            "email_id": ObjectId(email_id),
            "action": "deleted",
            "status": "success",
            "email_subject": email.get("subject", ""),
            "deleted_at": datetime.utcnow(),
            "created_by": current_user.id
        }
        await db.email_history.insert_one(history_doc)
        
        logger.info(f"📧 [EMAIL] Deleted email: {email_id}")
        return {"message": "Email deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting email: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete email: {str(e)}"
        )

@router.get("/history/{email_id}", response_model=EmailHistoryResponse)
async def get_email_history(
    email_id: str,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Get email history"""
    try:
        db = get_database()
        
        # Check if email belongs to user
        email = await db.emails.find_one({
            "_id": ObjectId(email_id),
            "created_by": current_user.id
        })
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Email not found"
            )
        
        # Get history
        history_cursor = db.email_history.find({
            "email_id": ObjectId(email_id)
        }).sort("sent_at", -1)
        
        history = await history_cursor.to_list(length=None)
        
        # Convert ObjectId to string and create EmailHistory objects
        history_objects = []
        for item in history:
            item["id"] = str(item["_id"])
            item["email_id"] = str(item["email_id"])
            history_objects.append(EmailHistory(**item))
        
        return EmailHistoryResponse(
            email_id=email_id,
            email_subject=email.get("subject", ""),
            history=history_objects
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting email history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get email history: {str(e)}"
        )

@router.get("/history")
async def get_all_email_history(
    skip: int = 0,
    limit: int = 50,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Get all email history for user"""
    try:
        db = get_database()
        
        # Get history
        history_cursor = db.email_history.find({
            "created_by": current_user.id
        }).sort("sent_at", -1).skip(skip).limit(limit)
        
        history = await history_cursor.to_list(length=limit)
        
        # Get total count
        total_count = await db.email_history.count_documents({
            "created_by": current_user.id
        })
        
        # Convert ObjectId to string and create EmailHistory objects
        history_objects = []
        for item in history:
            item["id"] = str(item["_id"])
            item["email_id"] = str(item["email_id"])
            history_objects.append(EmailHistory(**item))
        
        return {
            "history": history_objects,
            "total": total_count,
            "skip": skip,
            "limit": limit
        }
        
    except Exception as e:
        logger.error(f"Error getting email history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get email history: {str(e)}"
        )

@router.get("/search")
async def search_emails(
    q: str,
    status_filter: Optional[EmailStatus] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Advanced email search"""
    try:
        db = get_database()
        
        # Build query filter
        query_filter = {"created_by": current_user.id}
        
        # Add search query
        if q:
            query_filter["$or"] = [
                {"subject": {"$regex": q, "$options": "i"}},
                {"content": {"$regex": q, "$options": "i"}},
                {"recipients.email": {"$regex": q, "$options": "i"}},
                {"recipients.name": {"$regex": q, "$options": "i"}}
            ]
        
        # Add status filter
        if status_filter:
            query_filter["status"] = status_filter
        
        # Add date filters
        if date_from or date_to:
            date_filter = {}
            if date_from:
                date_filter["$gte"] = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
            if date_to:
                date_filter["$lte"] = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
            query_filter["created_at"] = date_filter
        
        # Get emails
        cursor = db.emails.find(query_filter).sort("created_at", -1).skip(skip).limit(limit)
        emails = await cursor.to_list(length=limit)
        
        # Get total count
        total_count = await db.emails.count_documents(query_filter)
        
        # Convert to response format
        email_responses = []
        for email in emails:
            email["id"] = str(email["_id"])
            email_responses.append(EmailResponse(**email))
        
        return {
            "emails": email_responses,
            "total": total_count,
            "skip": skip,
            "limit": limit,
            "query": q
        }
        
    except Exception as e:
        logger.error(f"Error searching emails: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search emails: {str(e)}"
        )

@router.get("/stats/summary", response_model=EmailStats)
async def get_email_stats(
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Get email statistics"""
    try:
        db = get_database()
        
        pipeline = [
            {"$match": {"created_by": current_user.id}},
            {
                "$group": {
                    "_id": None,
                    "total_emails": {"$sum": 1},
                    "sent_emails": {
                        "$sum": {"$cond": [{"$eq": ["$status", "sent"]}, 1, 0]}
                    },
                    "failed_emails": {
                        "$sum": {"$cond": [{"$eq": ["$status", "failed"]}, 1, 0]}
                    },
                    "draft_emails": {
                        "$sum": {"$cond": [{"$eq": ["$status", "draft"]}, 1, 0]}
                    },
                    "total_recipients": {"$sum": "$total_recipients"},
                    "successful_deliveries": {"$sum": "$sent_count"},
                    "failed_deliveries": {"$sum": "$failed_count"}
                }
            }
        ]
        
        result = await db.emails.aggregate(pipeline).to_list(length=1)
        
        if result:
            stats = result[0]
            return EmailStats(**stats)
        else:
            return EmailStats(
                total_emails=0,
                sent_emails=0,
                failed_emails=0,
                draft_emails=0,
                total_recipients=0,
                successful_deliveries=0,
                failed_deliveries=0
            )
            
    except Exception as e:
        logger.error(f"Error getting email stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get email stats: {str(e)}"
        )
