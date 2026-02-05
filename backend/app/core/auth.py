from datetime import datetime, timedelta
from typing import Optional
from bson import ObjectId
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings
from app.models.user import UserResponse
from app.core.database import get_database

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
security_optional = HTTPBearer(auto_error=False)


async def _find_user_by_id(db, user_id: str):
    """Find user by _id trying string then ObjectId so we match regardless of storage type."""
    uid_str = str(user_id) if user_id else ""
    user = await db.users.find_one({"_id": uid_str})
    if user:
        return user
    if len(uid_str) == 24 and all(c in "0123456789abcdefABCDEF" for c in uid_str):
        try:
            user = await db.users.find_one({"_id": ObjectId(uid_str)})
            if user:
                return user
        except Exception:
            pass
    return None

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserResponse:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    db = get_database()
    user = await _find_user_by_id(db, user_id)
    if user is None:
        raise credentials_exception
    # Normalize _id to str for UserResponse so id is always string
    if isinstance(user.get("_id"), ObjectId):
        user = {**user, "_id": str(user["_id"])}
    return UserResponse(**user)

async def get_current_active_user(current_user: UserResponse = Depends(get_current_user)) -> UserResponse:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def get_current_user_optional(credentials: HTTPAuthorizationCredentials = Depends(security_optional)) -> Optional[UserResponse]:
    """Get current user if token is provided, otherwise return None"""
    if not credentials:
        return None
    
    try:
        payload = jwt.decode(credentials.credentials, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
    except JWTError:
        return None
    
    db = get_database()
    user = await _find_user_by_id(db, user_id)
    if user is None:
        return None
    if isinstance(user.get("_id"), ObjectId):
        user = {**user, "_id": str(user["_id"])}
    return UserResponse(**user)