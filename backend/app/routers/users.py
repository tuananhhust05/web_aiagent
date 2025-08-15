from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime
from app.core.database import get_database
from app.core.auth import get_current_active_user
from app.models.user import UserResponse, UserUpdate

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
    db = get_database()
    
    # Soft delete - mark as inactive
    await db.users.update_one(
        {"_id": current_user.id},
        {
            "$set": {
                "is_active": False,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": "Account deactivated successfully"} 