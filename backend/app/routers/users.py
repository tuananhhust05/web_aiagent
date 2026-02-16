from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime
from app.core.database import get_database
from app.core.auth import get_current_active_user
from app.models.user import UserResponse, UserUpdate, UserRole
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: UserResponse = Depends(get_current_active_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: UserResponse = Depends(get_current_active_user)
):
    db = get_database()
    
    # Build update document
    update_data = {"updated_at": datetime.utcnow()}
    if user_update.first_name is not None:
        update_data["first_name"] = user_update.first_name
    if user_update.last_name is not None:
        update_data["last_name"] = user_update.last_name
    if user_update.company_name is not None:
        update_data["company_name"] = user_update.company_name
    if user_update.industry is not None:
        update_data["industry"] = user_update.industry
    if user_update.tone is not None:
        update_data["tone"] = user_update.tone
    if user_update.language is not None:
        update_data["language"] = user_update.language
    if user_update.phone is not None:
        update_data["phone"] = user_update.phone
    if user_update.role is not None:
        update_data["role"] = user_update.role.value
    
    # Update user
    await db.users.update_one(
        {"_id": current_user.id},
        {"$set": update_data}
    )
    
    # Get updated user
    updated_user = await db.users.find_one({"_id": current_user.id})
    return UserResponse(**updated_user)

@router.delete("/me")
async def delete_current_user(current_user: UserResponse = Depends(get_current_active_user)):
    """
    Delete user account and ALL associated data permanently.
    This is a hard delete - all user data will be removed from the database.
    """
    db = get_database()
    user_id = current_user.id
    
    # Check if user is company owner/admin
    is_company_owner = (
        current_user.workspace_role == "owner" or 
        current_user.role == UserRole.COMPANY_ADMIN.value
    )
    if current_user.company_id and not is_company_owner:
        company = await db.companies.find_one({"_id": current_user.company_id})
        if company and company.get("admin_user_id") == user_id:
            is_company_owner = True
    
    # Delete all user-related data
    collections_to_delete = [
        "calls",
        "contacts",
        "meetings",
        "campaigns",
        "workflows",
        "deals",
        "emails",
        "email_credentials",
        "telegram_app_configs",
        "whatsapp_conversations",
        "whatsapp_contacts",
        "rag_documents",
        "prioritized_prospects",
        "pipelines",
        "groups",
        "integrations",
        "renewals",
        "csm",
        "upsell",
        "campaign_goals",
        "campaign_workflow_scripts",
        "playbook_templates",
        "calendar_events",
        "atlas_qna",
        "atlas_knowledge",
        "atlas_todo",
        "atlas_insights",
        "atlas_meeting_participants",
        "atlas_meeting_history",
        "atlas_meeting_contexts",
        "contacts_import",
        "convention_activities",
    ]
    
    deleted_counts = {}
    for collection_name in collections_to_delete:
        try:
            result = await db[collection_name].delete_many({"user_id": user_id})
            deleted_counts[collection_name] = result.deleted_count
            if result.deleted_count > 0:
                logger.info(f"Deleted {result.deleted_count} records from {collection_name} for user {user_id}")
        except Exception as e:
            # Collection might not exist or other error - log and continue
            logger.warning(f"Error deleting from {collection_name} for user {user_id}: {e}")
            deleted_counts[collection_name] = f"error: {str(e)}"
    
    # Delete company if user is owner/admin
    if is_company_owner and current_user.company_id:
        try:
            # Delete all company members first (except current user, will be deleted later)
            members_result = await db.users.delete_many({
                "company_id": current_user.company_id,
                "_id": {"$ne": user_id}
            })
            # Delete company
            company_result = await db.companies.delete_one({"_id": current_user.company_id})
            deleted_counts["company"] = 1 if company_result.deleted_count > 0 else 0
            deleted_counts["company_members"] = members_result.deleted_count
            logger.info(f"Deleted company {current_user.company_id} and {members_result.deleted_count} members")
        except Exception as e:
            logger.error(f"Error deleting company: {e}")
            deleted_counts["company"] = f"error: {str(e)}"
    
    # Remove user from company if member (decrement employee_count)
    if current_user.company_id and not is_company_owner:
        try:
            await db.companies.update_one(
                {"_id": current_user.company_id},
                {"$inc": {"employee_count": -1}, "$set": {"updated_at": datetime.utcnow()}}
            )
        except Exception:
            pass
    
    # Finally, delete the user record
    await db.users.delete_one({"_id": user_id})
    
    return {
        "message": "Account and all associated data deleted successfully",
        "deleted_counts": deleted_counts
    } 