from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

class AuditAction(str, Enum):
    LOGIN = "login"
    LOGIN_FAILED = "login_failed"
    LOGOUT = "logout"
    MFA_VERIFY = "mfa_verify"
    MFA_ENABLE = "mfa_enable"
    MFA_DISABLE = "mfa_disable"
    PASSWORD_CHANGE = "password_change"
    PASSWORD_RESET = "password_reset"
    USER_CREATE = "user_create"
    USER_UPDATE = "user_update"
    USER_DELETE = "user_delete"
    USER_LOCK = "user_lock"
    USER_UNLOCK = "user_unlock"
    ROLE_CHANGE = "role_change"
    ACCESS_REVIEW_CREATE = "access_review_create"
    ACCESS_REVIEW_COMPLETE = "access_review_complete"
    ACCESS_REVIEW_APPROVE = "access_review_approve"
    ACCESS_REVIEW_REJECT = "access_review_reject"
    SESSION_CREATE = "session_create"
    SESSION_EXPIRE = "session_expire"
    PERMISSION_GRANT = "permission_grant"
    PERMISSION_REVOKE = "permission_revoke"

class AccessReviewStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXPIRED = "expired"

class AccessReviewFrequency(str, Enum):
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUALLY = "annually"

class MFAMethod(str, Enum):
    TOTP = "totp"
    FIDO2 = "fido2"
    EMAIL = "email"
    SMS = "sms"

class AuditLog(BaseModel):
    id: str = Field(alias="_id")
    timestamp: datetime
    user_id: str
    username: Optional[str] = None
    email: Optional[str] = None
    action: AuditAction
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    status: str
    details: Optional[dict] = None
    previous_hash: Optional[str] = None
    hash: Optional[str] = None

class AuditLogCreate(BaseModel):
    user_id: str
    action: AuditAction
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    status: str = "success"
    details: Optional[dict] = None

class AuditLogListResponse(BaseModel):
    logs: List[AuditLog]
    total: int

class PasswordPolicy(BaseModel):
    id: str = Field(alias="_id")
    min_length: int = 14
    min_zxcvbn_score: int = 3
    max_password_history: int = 12
    privileged_expiry_days: int = 30
    standard_expiry_days: int = 90
    lockout_attempts: int = 5
    lockout_duration_minutes: int = 30
    require_mfa_for_privileged: bool = True
    updated_at: datetime

class MFASettings(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    method: MFAMethod
    enabled: bool = True
    totp_secret: Optional[str] = None
    fido2_credentials: List[dict] = []
    backup_codes: List[str] = []
    created_at: datetime
    updated_at: datetime

class AccessReview(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    reviewer_id: str
    status: AccessReviewStatus = AccessReviewStatus.PENDING
    frequency: AccessReviewFrequency
    due_date: datetime
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class Session(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    token: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime
    expires_at: datetime
    is_active: bool = True

class UserLockout(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    failed_attempts: int = 0
    locked_at: Optional[datetime] = None
    lockout_expires: Optional[datetime] = None
    updated_at: datetime

class IAMStats(BaseModel):
    total_users: int = 0
    active_sessions: int = 0
    mfa_coverage: float = 0.0
    pending_access_reviews: int = 0
    locked_accounts: int = 0
    recent_audit_logs: List[AuditLog] = []

class PasswordHistory(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    hashed_password: str
    created_at: datetime
