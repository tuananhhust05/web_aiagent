"""
Encrypt/decrypt Google Calendar refresh_token at rest.
Uses Fernet (symmetric) when CALENDAR_REFRESH_TOKEN_ENCRYPTION_KEY is set.
"""
import base64
import hashlib
import logging
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


def _get_fernet_key() -> Optional[bytes]:
    """Derive a Fernet key from CALENDAR_REFRESH_TOKEN_ENCRYPTION_KEY or JWT_SECRET_KEY."""
    raw = (settings.CALENDAR_REFRESH_TOKEN_ENCRYPTION_KEY or settings.JWT_SECRET_KEY or "").encode()
    if not raw:
        return None
    digest = hashlib.sha256(raw).digest()
    return base64.urlsafe_b64encode(digest)


def encrypt_refresh_token(plain: str) -> str:
    """Encrypt refresh_token for storage. Returns plaintext if no key configured."""
    key = _get_fernet_key()
    if not key:
        return plain
    try:
        from cryptography.fernet import Fernet
        f = Fernet(key)
        return f.encrypt(plain.encode()).decode()
    except Exception as e:
        logger.warning("Calendar token encryption failed, storing plain: %s", e)
        return plain


def decrypt_refresh_token(encrypted: str) -> str:
    """Decrypt stored refresh_token. Returns as-is if not encrypted."""
    if not encrypted:
        return ""
    key = _get_fernet_key()
    if not key:
        return encrypted
    try:
        from cryptography.fernet import Fernet
        f = Fernet(key)
        return f.decrypt(encrypted.encode()).decode()
    except Exception:
        return encrypted
