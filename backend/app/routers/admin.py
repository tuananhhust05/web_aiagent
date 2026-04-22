from fastapi import APIRouter, HTTPException, status, Depends, Request
from datetime import datetime, timedelta
from bson import ObjectId
from typing import Optional, List
import logging

from app.core.database import get_database
from app.core.auth import get_current_active_user, get_password_hash, verify_password, create_access_token
from app.models.user import UserResponse, UserRole, UserCreate, UserListResponse
from app.models.iam import AuditLogCreate, AuditAction
from app.routers.iam import write_audit_log

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Admin"])

@router.get("/users", response_model=UserListResponse)
async def list_users(
    skip: int = 0,
    limit: int = 50,
    role: Optional[UserRole] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
):
    db = get_database()

    query = {}
    if role:
        query["role"] = role.value
    if is_active is not None:
        query["is_active"] = is_active
    if search:
        query["$or"] = [
            {"email": {"$regex": search, "$options": "i"}},
            {"username": {"$regex": search, "$options": "i"}},
            {"first_name": {"$regex": search, "$options": "i"}},
            {"last_name": {"$regex": search, "$options": "i"}}
        ]

    users = await db.users.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents(query)

    return {"users": [UserResponse(**user) for user in users], "total": total}

@router.post("/users", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    request: Request,
    current_user: UserResponse = Depends(get_current_active_user)
):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only super admin can create users")

    db = get_database()

    existing = await db.users.find_one({
        "$or": [{"email": user_data.email}, {"username": user_data.username}]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Email or username already exists")

    user_id = str(ObjectId())

    user_doc = {
        "_id": user_id,
        "email": user_data.email,
        "username": user_data.username,
        "first_name": user_data.first_name or "User",
        "last_name": user_data.last_name or "-",
        "company_id": user_data.company_id,
        "industry": user_data.industry.value if user_data.industry else None,
        "hashed_password": get_password_hash(user_data.password),
        "role": user_data.role.value if user_data.role else UserRole.USER.value,
        "is_active": True,
        "is_verified": False,
        "gdpr_consent": True,
        "terms_accepted": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    await db.users.insert_one(user_doc)

    await write_audit_log(AuditLogCreate(
        user_id=current_user.id,
        action=AuditAction.USER_CREATE,
        resource_type="user",
        resource_id=user_id,
        ip_address=request.client.host if request.client else None,
        status="success",
        details={"email": user_data.email, "role": user_doc["role"]}
    ))

    return UserResponse(**user_doc)

@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    new_role: UserRole,
    request: Request,
    current_user: UserResponse = Depends(get_current_active_user)
):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only super admin can change roles")

    db = get_database()

    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    old_role = user.get("role")

    await db.users.update_one(
        {"_id": user_id},
        {"$set": {"role": new_role.value, "updated_at": datetime.utcnow()}}
    )

    await write_audit_log(AuditLogCreate(
        user_id=current_user.id,
        action=AuditAction.ROLE_CHANGE,
        resource_type="user",
        resource_id=user_id,
        ip_address=request.client.host if request.client else None,
        status="success",
        details={"old_role": old_role, "new_role": new_role.value}
    ))

    return {"updated": True, "old_role": old_role, "new_role": new_role.value}

@router.put("/users/{user_id}/deactivate")
async def deactivate_user(
    user_id: str,
    request: Request,
    current_user: UserResponse = Depends(get_current_active_user)
):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    db = get_database()

    await db.users.update_one(
        {"_id": user_id},
        {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
    )

    await db.sessions.delete_many({"user_id": user_id})

    await write_audit_log(AuditLogCreate(
        user_id=current_user.id,
        action=AuditAction.USER_LOCK,
        resource_type="user",
        resource_id=user_id,
        ip_address=request.client.host if request.client else None,
        status="success",
        details={"action": "deactivate"}
    ))

    return {"deactivated": True}

@router.put("/users/{user_id}/activate")
async def activate_user(
    user_id: str,
    request: Request,
    current_user: UserResponse = Depends(get_current_active_user)
):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    db = get_database()

    await db.users.update_one(
        {"_id": user_id},
        {"$set": {"is_active": True, "updated_at": datetime.utcnow()}}
    )

    await write_audit_log(AuditLogCreate(
        user_id=current_user.id,
        action=AuditAction.USER_UNLOCK,
        resource_type="user",
        resource_id=user_id,
        ip_address=request.client.host if request.client else None,
        status="success",
        details={"action": "activate"}
    ))

    return {"activated": True}

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    request: Request,
    current_user: UserResponse = Depends(get_current_active_user)
):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only super admin can delete users")

    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    db = get_database()

    result = await db.users.delete_one({"_id": user_id})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    await db.sessions.delete_many({"user_id": user_id})

    await write_audit_log(AuditLogCreate(
        user_id=current_user.id,
        action=AuditAction.USER_DELETE,
        resource_type="user",
        resource_id=user_id,
        ip_address=request.client.host if request.client else None,
        status="success"
    ))

    return {"deleted": True}

@router.post("/initialize-admin")
async def initialize_default_admin():
    db = get_database()

    existing_admin = await db.users.find_one({"username": "admin"})
    if existing_admin:
        return {"message": "Admin user already exists", "user_id": existing_admin["_id"]}

    admin_id = str(ObjectId())
    admin_doc = {
        "_id": admin_id,
        "email": "admin@forskale.com",
        "username": "admin",
        "first_name": "System",
        "last_name": "Administrator",
        "company_id": None,
        "industry": None,
        "hashed_password": get_password_hash("admin@123"),
        "role": UserRole.SUPER_ADMIN.value,
        "is_active": True,
        "is_verified": True,
        "gdpr_consent": True,
        "terms_accepted": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    await db.users.insert_one(admin_doc)

    await write_audit_log(AuditLogCreate(
        user_id=admin_id,
        action=AuditAction.USER_CREATE,
        resource_type="user",
        resource_id=admin_id,
        status="success",
        details={"action": "initialize_default_admin", "username": "admin"}
    ))

    default_policy = {
        "_id": str(ObjectId()),
        "min_length": 14,
        "min_zxcvbn_score": 3,
        "max_password_history": 12,
        "privileged_expiry_days": 30,
        "standard_expiry_days": 90,
        "lockout_attempts": 5,
        "lockout_duration_minutes": 30,
        "require_mfa_for_privileged": True,
        "updated_at": datetime.utcnow()
    }
    await db.password_policies.insert_one(default_policy)

    return {
        "message": "Default admin created successfully",
        "credentials": {"username": "admin", "password": "admin@123"},
        "user_id": admin_id
    }
