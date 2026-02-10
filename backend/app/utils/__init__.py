"""
Password hashing and verification using bcrypt directly.
"""

import bcrypt


def hash_password(plain: str) -> str:
    """Return a bcrypt hash of *plain*. Truncates to 72 bytes (bcrypt limit)."""
    # bcrypt has a 72-byte limit on the input password length.
    # Truncate to 72 bytes before hashing.
    password_bytes = plain.encode("utf-8")
    truncated_bytes = password_bytes[:72]
    
    # Generate salt and hash
    salt = bcrypt.gensalt()
    hashed_bytes = bcrypt.hashpw(truncated_bytes, salt)
    
    # Return as string for storage
    return hashed_bytes.decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Return ``True`` if *plain* matches *hashed*. Truncates to 72 bytes."""
    password_bytes = plain.encode("utf-8")
    truncated_bytes = password_bytes[:72]
    
    hashed_bytes = hashed.encode("utf-8")
    
    return bcrypt.checkpw(truncated_bytes, hashed_bytes)
