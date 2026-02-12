"""
JWT token creation and decoding.
"""

from datetime import UTC, datetime, timedelta
import json
from cryptography.fernet import Fernet
from jose import JWTError, jwt

from app.config import get_settings

settings = get_settings()
fernet = Fernet(settings.COMMUNICATION_ENCRYPTION_KEY.encode())

def create_access_token(data: dict) -> str:
    """Create a short-lived access JWT."""
    to_encode = data.copy()
    expire = datetime.now(UTC) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(data: dict) -> str:
    """Create a long-lived refresh JWT."""
    to_encode = data.copy()
    expire = datetime.now(UTC) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict | None:
    """Decode and validate a JWT. Returns payload dict or None on failure."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None

def encrypt(data: dict) -> dict:
    """
    Encrypts a dict and returns a JSON-safe dict.
    """
    json_str = json.dumps(data)
    encrypted_bytes = fernet.encrypt(json_str.encode())
    return {"_encrypted": encrypted_bytes.decode()}


def decrypt(encrypted_data: dict) -> dict:
    """
    Decrypts the encrypted dict back to original dict.
    """
    if not encrypted_data or "_encrypted" not in encrypted_data:
        return encrypted_data or {}

    decrypted_bytes = fernet.decrypt(encrypted_data["_encrypted"].encode())
    return json.loads(decrypted_bytes.decode())