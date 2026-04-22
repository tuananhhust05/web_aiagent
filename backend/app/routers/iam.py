from fastapi import APIRouter, HTTPException, status, Depends, Request, BackgroundTasks
from datetime import datetime, timedelta
from bson import ObjectId
from typing import Optional, List
import hashlib
import secrets
import logging

from app.core.database import get_database
from app.core.auth import get_current_active_user, get_password_hash, verify_password
from app.models.user import UserResponse, UserRole
from app.models.iam import (
    AuditAction, AuditLog, AuditLogCreate, AuditLogListResponse, PasswordPolicy, MFASettings, MFAMethod,
    AccessReview, AccessReviewStatus, AccessReviewFrequency, Session, UserLockout,
    IAMStats, PasswordHistory
)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["IAM"])

async def get_audit_logs_collection():
    db = get_database()
    return db.audit_logs

async def get_password_policy_collection():
    db = get_database()
    return db.password_policies

async def get_mfa_settings_collection():
    db = get_database()
    return db.mfa_settings

async def get_access_reviews_collection():
    db = get_database()
    return db.access_reviews

async def get_sessions_collection():
    db = get_database()
    return db.sessions

async def get_user_lockouts_collection():
    db = get_database()
    return db.user_lockouts

async def get_password_history_collection():
    db = get_database()
    return db.password_history

async def write_audit_log(log_data: AuditLogCreate, request: Request = None):
    db = get_database()
    audit_collection = db.audit_logs

    last_log = await audit_collection.find_one(sort=[("timestamp", -1)])
    previous_hash = last_log.get("hash", "0" * 64) if last_log else "0" * 64

    log_doc = {
        **log_data.model_dump(),
        "_id": str(ObjectId()),
        "timestamp": datetime.utcnow(),
        "previous_hash": previous_hash,
        "hash": None
    }

    content_to_hash = f"{log_doc['timestamp'].isoformat()}{log_doc['user_id']}{log_doc['action']}{log_doc.get('status', '')}{previous_hash}"
    log_doc["hash"] = hashlib.sha256(content_to_hash.encode()).hexdigest()

    await audit_collection.insert_one(log_doc)
    return log_doc

async def check_password_history(user_id: str, plain_password: str, max_history: int = 12) -> bool:
    db = get_database()
    history_collection = db.password_history

    recent_passwords = await history_collection.find(
        {"user_id": user_id}
    ).sort("created_at", -1).limit(max_history).to_list(max_history)

    for pwd_doc in recent_passwords:
        if verify_password(plain_password, pwd_doc.get("hashed_password", "")):
            return False
    return True

async def add_password_to_history(user_id: str, hashed_password: str):
    db = get_database()
    history_collection = db.password_history

    history_doc = {
        "_id": str(ObjectId()),
        "user_id": user_id,
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow()
    }
    await history_collection.insert_one(history_doc)

    count = await history_collection.count_documents({"user_id": user_id})
    if count > 12:
        oldest = await history_collection.find_one(
            {"user_id": user_id},
            sort=[("created_at", 1)]
        )
        if oldest:
            await history_collection.delete_one({"_id": oldest["_id"]})

async def check_account_lockout(user_id: str) -> Optional[UserLockout]:
    db = get_database()
    lockout_collection = db.user_lockouts

    lockout = await lockout_collection.find_one({"user_id": user_id})
    if not lockout:
        return None

    if lockout.get("lockout_expires") and lockout["lockout_expires"] < datetime.utcnow():
        await lockout_collection.delete_one({"_id": lockout["_id"]})
        return None

    return lockout

async def record_failed_login(user_id: str, max_attempts: int = 5, lockout_minutes: int = 30):
    db = get_database()
    lockout_collection = db.user_lockouts

    lockout = await lockout_collection.find_one({"user_id": user_id})

    if not lockout:
        lockout_doc = {
            "_id": str(ObjectId()),
            "user_id": user_id,
            "failed_attempts": 1,
            "locked_at": datetime.utcnow(),
            "lockout_expires": datetime.utcnow() + timedelta(minutes=lockout_minutes),
            "updated_at": datetime.utcnow()
        }
        await lockout_collection.insert_one(lockout_doc)
    else:
        new_attempts = lockout.get("failed_attempts", 0) + 1
        update = {
            "$set": {
                "failed_attempts": new_attempts,
                "updated_at": datetime.utcnow()
            }
        }

        if new_attempts >= max_attempts:
            update["$set"]["locked_at"] = datetime.utcnow()
            update["$set"]["lockout_expires"] = datetime.utcnow() + timedelta(minutes=lockout_minutes)

        await lockout_collection.update_one({"_id": lockout["_id"]}, update)

async def clear_lockout(user_id: str):
    db = get_database()
    lockout_collection = db.user_lockouts
    await lockout_collection.delete_one({"user_id": user_id})

@router.post("/audit-logs", response_model=AuditLog)
async def create_audit_log(
    log_data: AuditLogCreate,
    request: Request,
    current_user: UserResponse = Depends(get_current_active_user)
):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    log_doc = await write_audit_log(log_data, request)
    return AuditLog(**log_doc)

@router.get("/audit-logs", response_model=AuditLogListResponse)
async def list_audit_logs(
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[str] = None,
    action: Optional[AuditAction] = None,
    current_user: UserResponse = Depends(get_current_active_user)
):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    db = get_database()
    audit_collection = db.audit_logs

    query = {}
    if user_id:
        query["user_id"] = user_id
    if action:
        query["action"] = action.value

    logs = await audit_collection.find(query).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)

    total = await audit_collection.count_documents(query)

    user_ids = list(set(log.get("user_id") for log in logs if log.get("user_id")))
    users_data = {}
    if user_ids:
        users_cursor = db.users.find({"_id": {"$in": user_ids}}, {"email": 1, "username": 1})
        async for user in users_cursor:
            users_data[user["_id"]] = {"email": user.get("email"), "username": user.get("username")}

    enriched_logs = []
    for log in logs:
        user_info = users_data.get(log.get("user_id"), {})
        log["username"] = user_info.get("username")
        log["email"] = user_info.get("email")
        enriched_logs.append(AuditLog(**log))

    return {"logs": enriched_logs, "total": total}

@router.get("/audit-logs/verify")
async def verify_audit_log_integrity(
    current_user: UserResponse = Depends(get_current_active_user)
):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    db = get_database()
    audit_collection = db.audit_logs

    logs = await audit_collection.find().sort("timestamp", 1).to_list(10000)

    chain_valid = True
    broken_at = None

    for i, log in enumerate(logs):
        if i == 0:
            expected_prev = "0" * 64
        else:
            expected_prev = logs[i-1].get("hash", "")

        if log.get("previous_hash") != expected_prev:
            chain_valid = False
            broken_at = i
            break

    return {
        "total_logs": len(logs),
        "chain_valid": chain_valid,
        "broken_at": broken_at
    }

@router.get("/password-policy", response_model=PasswordPolicy)
async def get_password_policy(current_user: UserResponse = Depends(get_current_active_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    db = get_database()
    policy_collection = db.password_policies

    policy = await policy_collection.find_one({})
    if not policy:
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
        await policy_collection.insert_one(default_policy)
        return PasswordPolicy(**default_policy)

    return PasswordPolicy(**policy)

@router.put("/password-policy", response_model=PasswordPolicy)
async def update_password_policy(
    policy_data: PasswordPolicy,
    current_user: UserResponse = Depends(get_current_active_user)
):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    db = get_database()
    policy_collection = db.password_policies

    await policy_collection.update_one(
        {"_id": policy_data.id},
        {"$set": {**policy_data.model_dump(exclude={"id"}), "updated_at": datetime.utcnow()}},
        upsert=True
    )

    return policy_data

@router.post("/mfa/setup", response_model=MFASettings)
async def setup_mfa(
    method: MFAMethod,
    current_user: UserResponse = Depends(get_current_active_user)
):
    db = get_database()
    mfa_collection = db.mfa_settings

    totp_secret = None
    if method == MFAMethod.TOTP:
        import pyotp
        totp_secret = pyotp.random_base32()

    mfa_doc = {
        "_id": str(ObjectId()),
        "user_id": current_user.id,
        "method": method.value,
        "enabled": True,
        "totp_secret": totp_secret,
        "fido2_credentials": [],
        "backup_codes": [secrets.token_hex(8) for _ in range(10)],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    await mfa_collection.update_one(
        {"user_id": current_user.id},
        {"$set": mfa_doc},
        upsert=True
    )

    await write_audit_log(AuditLogCreate(
        user_id=current_user.id,
        action=AuditAction.MFA_ENABLE,
        status="success",
        details={"method": method.value}
    ))

    return MFASettings(**mfa_doc)

@router.get("/mfa/status", response_model=MFASettings)
async def get_mfa_status(current_user: UserResponse = Depends(get_current_active_user)):
    db = get_database()
    mfa_collection = db.mfa_settings

    mfa = await mfa_collection.find_one({"user_id": current_user.id})
    if not mfa:
        raise HTTPException(status_code=404, detail="MFA not configured")

    return MFASettings(**mfa)

@router.post("/mfa/verify")
async def verify_mfa(
    code: str,
    current_user: UserResponse = Depends(get_current_active_user)
):
    db = get_database()
    mfa_collection = db.mfa_settings

    mfa = await mfa_collection.find_one({"user_id": current_user.id})
    if not mfa:
        raise HTTPException(status_code=404, detail="MFA not configured")

    method = MFAMethod(mfa["method"])

    if method == MFAMethod.TOTP:
        import pyotp
        totp = pyotp.TOTP(mfa["totp_secret"])
        if not totp.verify(code):
            raise HTTPException(status_code=401, detail="Invalid TOTP code")
    elif method == MFAMethod.EMAIL:
        if code != mfa.get("last_email_code"):
            raise HTTPException(status_code=401, detail="Invalid email code")
    else:
        raise HTTPException(status_code=400, detail="Unsupported MFA method")

    await write_audit_log(AuditLogCreate(
        user_id=current_user.id,
        action=AuditAction.MFA_VERIFY,
        status="success"
    ))

    return {"verified": True}

@router.delete("/mfa/disable")
async def disable_mfa(current_user: UserResponse = Depends(get_current_active_user)):
    db = get_database()
    mfa_collection = db.mfa_settings

    result = await mfa_collection.delete_one({"user_id": current_user.id})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="MFA not configured")

    await write_audit_log(AuditLogCreate(
        user_id=current_user.id,
        action=AuditAction.MFA_DISABLE,
        status="success"
    ))

    return {"disabled": True}

@router.post("/access-reviews", response_model=AccessReview)
async def create_access_review(
    user_id: str,
    frequency: AccessReviewFrequency,
    due_date: datetime,
    current_user: UserResponse = Depends(get_current_active_user)
):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    db = get_database()
    review_doc = {
        "_id": str(ObjectId()),
        "user_id": user_id,
        "reviewer_id": current_user.id,
        "status": AccessReviewStatus.PENDING.value,
        "frequency": frequency.value,
        "due_date": due_date,
        "completed_at": None,
        "notes": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    db.access_reviews.insert_one(review_doc)

    await write_audit_log(AuditLogCreate(
        user_id=current_user.id,
        action=AuditAction.ACCESS_REVIEW_CREATE,
        resource_type="user",
        resource_id=user_id,
        status="success"
    ))

    return AccessReview(**review_doc)

@router.get("/access-reviews", response_model=List[AccessReview])
async def list_access_reviews(
    status: Optional[AccessReviewStatus] = None,
    current_user: UserResponse = Depends(get_current_active_user)
):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    db = get_database()
    query = {}
    if status:
        query["status"] = status.value

    reviews = await db.access_reviews.find(query).sort("due_date", 1).to_list(100)
    return [AccessReview(**r) for r in reviews]

@router.put("/access-reviews/{review_id}", response_model=AccessReview)
async def update_access_review(
    review_id: str,
    review_status: AccessReviewStatus,
    notes: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_active_user)
):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    db = get_database()

    action = AuditAction.ACCESS_REVIEW_APPROVE if review_status == AccessReviewStatus.APPROVED else AuditAction.ACCESS_REVIEW_REJECT

    await db.access_reviews.update_one(
        {"_id": review_id},
        {"$set": {
            "status": review_status.value,
            "completed_at": datetime.utcnow(),
            "notes": notes,
            "updated_at": datetime.utcnow()
        }}
    )

    review = await db.access_reviews.find_one({"_id": review_id})

    await write_audit_log(AuditLogCreate(
        user_id=current_user.id,
        action=action,
        resource_type="access_review",
        resource_id=review_id,
        status="success",
        details={"reviewed_user_id": review.get("user_id")}
    ))

    return AccessReview(**review)

@router.get("/stats", response_model=IAMStats)
async def get_iam_stats(current_user: UserResponse = Depends(get_current_active_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    db = get_database()

    total_users = await db.users.count_documents({})

    active_sessions = await db.sessions.count_documents({
        "is_active": True,
        "expires_at": {"$gt": datetime.utcnow()}
    })

    users_with_mfa = await db.mfa_settings.count_documents({"enabled": True})
    mfa_coverage = (users_with_mfa / total_users * 100) if total_users > 0 else 0

    pending_reviews = await db.access_reviews.count_documents({
        "status": AccessReviewStatus.PENDING.value
    })

    locked_accounts = await db.user_lockouts.count_documents({
        "lockout_expires": {"$gt": datetime.utcnow()}
    })

    recent_logs = await db.audit_logs.find().sort("timestamp", -1).limit(10).to_list(10)

    return IAMStats(
        total_users=total_users,
        active_sessions=active_sessions,
        mfa_coverage=mfa_coverage,
        pending_access_reviews=pending_reviews,
        locked_accounts=locked_accounts,
        recent_audit_logs=[AuditLog(**log) for log in recent_logs]
    )

@router.get("/sessions", response_model=List[Session])
async def list_sessions(current_user: UserResponse = Depends(get_current_active_user)):
    db = get_database()

    query = {"user_id": current_user.id, "is_active": True, "expires_at": {"$gt": datetime.utcnow()}}
    if current_user.role == UserRole.SUPER_ADMIN:
        query = {"is_active": True, "expires_at": {"$gt": datetime.utcnow()}}

    sessions = await db.sessions.find(query).sort("created_at", -1).to_list(100)
    return [Session(**s) for s in sessions]

@router.delete("/sessions/{session_id}")
async def revoke_session(session_id: str, current_user: UserResponse = Depends(get_current_active_user)):
    db = get_database()

    session = await db.sessions.find_one({"_id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session["user_id"] != current_user.id and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Cannot revoke other user's session")

    await db.sessions.update_one(
        {"_id": session_id},
        {"$set": {"is_active": False}}
    )

    await write_audit_log(AuditLogCreate(
        user_id=current_user.id,
        action=AuditAction.SESSION_EXPIRE,
        resource_type="session",
        resource_id=session_id,
        status="success"
    ))

    return {"revoked": True}

@router.get("/users/locked")
async def list_locked_users(current_user: UserResponse = Depends(get_current_active_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    db = get_database()

    lockouts = await db.user_lockouts.find({
        "lockout_expires": {"$gt": datetime.utcnow()}
    }).to_list(100)

    return [UserLockout(**lockout) for lockout in lockouts]

@router.post("/users/{user_id}/unlock")
async def unlock_user(
    user_id: str,
    current_user: UserResponse = Depends(get_current_active_user)
):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    await clear_lockout(user_id)

    await write_audit_log(AuditLogCreate(
        user_id=current_user.id,
        action=AuditAction.USER_UNLOCK,
        resource_type="user",
        resource_id=user_id,
        status="success"
    ))

    return {"unlocked": True}

@router.post("/users/{user_id}/lock")
async def lock_user(
    user_id: str,
    current_user: UserResponse = Depends(get_current_active_user)
):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    db = get_database()

    await db.user_lockouts.update_one(
        {"user_id": user_id},
        {"$set": {
            "user_id": user_id,
            "failed_attempts": 999,
            "locked_at": datetime.utcnow(),
            "lockout_expires": datetime.utcnow() + timedelta(days=365),
            "updated_at": datetime.utcnow()
        }},
        upsert=True
    )

    await write_audit_log(AuditLogCreate(
        user_id=current_user.id,
        action=AuditAction.USER_LOCK,
        resource_type="user",
        resource_id=user_id,
        status="success"
    ))

    return {"locked": True}
