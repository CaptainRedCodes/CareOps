from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.user import AuthProvider, User, UserRole
from app.schemas.auth import LoginRequest, RegisterRequest
from app.utils import hash_password, verify_password
from app.utils.security import create_access_token, create_refresh_token, decode_token

settings = get_settings()


def _normalize_email(email: str) -> str:
    """Lowercase and strip whitespace from email addresses."""
    return email.strip().lower()


async def register_user(db: AsyncSession, payload: RegisterRequest) -> User:
    """Create a new admin user. Raises 409 if email already taken."""
    email = _normalize_email(payload.email)

    existing = await db.execute(select(User).where(User.email == email))
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = User(
        email=email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name.strip(),
        role=UserRole.ADMIN,
        auth_provider=AuthProvider.LOCAL,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


def _check_lockout(user: User) -> None:
    """Raise 423 if user account is currently locked."""
    if user.locked_until and user.locked_until > datetime.now(UTC):
        remaining = int((user.locked_until - datetime.now(UTC)).total_seconds() / 60) + 1
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"Account temporarily locked. Try again in {remaining} minute(s).",
        )


async def authenticate_user(db: AsyncSession, payload: LoginRequest) -> User:
    """Validate credentials with lockout and failed-attempt tracking."""
    email = _normalize_email(payload.email)

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    # Check lockout
    _check_lockout(user)

    # Verify password (OAuth-only users cannot log in with password)
    if not user.hashed_password or not verify_password(payload.password, user.hashed_password):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= settings.MAX_LOGIN_ATTEMPTS:
            user.locked_until = datetime.now(UTC) + timedelta(
                minutes=settings.LOCKOUT_DURATION_MINUTES
            )
            user.failed_login_attempts = 0
        await db.flush()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated.",
        )

    # Reset failed attempts on successful login
    if user.failed_login_attempts > 0:
        user.failed_login_attempts = 0
        user.locked_until = None
        await db.flush()

    return user


def generate_tokens(user: User) -> dict:
    """Return a dict with access + refresh tokens for *user*."""
    token_data = {"sub": str(user.id), "role": user.role.value}
    return {
        "access_token": create_access_token(token_data),
        "refresh_token": create_refresh_token(token_data),
        "token_type": "bearer",
    }


async def refresh_access_token(db: AsyncSession, refresh_token: str) -> dict:
    """Validate a refresh token and issue a fresh pair. Raises 401 on failure."""
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
        )

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalars().first()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or deactivated.",
        )

    return generate_tokens(user)


async def get_user_by_id(db: AsyncSession, user_id: UUID) -> User | None:
    """Fetch a user by primary key."""
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalars().first()
