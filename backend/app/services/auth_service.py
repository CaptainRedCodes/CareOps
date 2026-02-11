import secrets
from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.user import AuthProvider, User, UserRole
from app.schemas.auth import LoginRequest, RegisterRequest
from app.services.email_service import send_password_reset_email, send_verification_email
from app.utils import hash_password, verify_password
from app.utils.security import create_access_token, create_refresh_token, decode_token

settings = get_settings()


def _normalize_email(email: str) -> str:
    """Lowercase and strip whitespace from email addresses."""
    return email.strip().lower()


def _generate_token() -> str:
    """Generate a cryptographically secure URL-safe token."""
    return secrets.token_urlsafe(32)


async def register_user(db: AsyncSession, payload: RegisterRequest) -> User:
    """Create a new admin user with email verification. Raises 409 if email already taken."""
    email = _normalize_email(payload.email)

    existing = await db.execute(select(User).where(User.email == email))
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    verification_token = _generate_token()

    user = User(
        email=email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name.strip(),
        role=UserRole.ADMIN,
        auth_provider=AuthProvider.LOCAL,
        is_email_verified=False,
        email_verification_token=verification_token,
        email_verification_expires=datetime.now(UTC)
        + timedelta(hours=settings.EMAIL_TOKEN_EXPIRE_HOURS),
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    # Send verification email (fire-and-forget; don't block registration)
    await send_verification_email(email, verification_token)

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

    # Check email verification for local accounts
    if user.auth_provider == AuthProvider.LOCAL and not user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email address before logging in.",
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
        "must_change_password": user.must_change_password,
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


async def verify_email(db: AsyncSession, token: str) -> User:
    """Verify a user's email using the token from the verification email."""
    result = await db.execute(
        select(User).where(User.email_verification_token == token)
    )
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification token.",
        )

    if user.email_verification_expires and user.email_verification_expires < datetime.now(UTC):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification token has expired. Please request a new one.",
        )

    user.is_email_verified = True
    user.email_verification_token = None
    user.email_verification_expires = None
    await db.flush()

    return user


async def resend_verification(db: AsyncSession, email: str) -> None:
    """Regenerate verification token and resend email. Silent if email not found."""
    email = _normalize_email(email)
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()

    if not user or user.is_email_verified:
        # Don't reveal whether the email exists
        return

    token = _generate_token()
    user.email_verification_token = token
    user.email_verification_expires = datetime.now(UTC) + timedelta(
        hours=settings.EMAIL_TOKEN_EXPIRE_HOURS
    )
    await db.flush()
    await send_verification_email(email, token)



async def request_password_reset(db: AsyncSession, email: str) -> None:
    """Generate a password reset token and send email. Silent if email not found."""
    email = _normalize_email(email)
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()

    if not user or user.auth_provider != AuthProvider.LOCAL:
        # Don't reveal whether account exists — prevents email enumeration
        return

    token = _generate_token()
    user.password_reset_token = token
    user.password_reset_expires = datetime.now(UTC) + timedelta(
        hours=settings.EMAIL_TOKEN_EXPIRE_HOURS
    )
    await db.flush()
    await send_password_reset_email(email, token)


async def reset_password(db: AsyncSession, token: str, new_password: str) -> None:
    """Validate reset token and set new password."""
    result = await db.execute(
        select(User).where(User.password_reset_token == token)
    )
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset token.",
        )

    if user.password_reset_expires and user.password_reset_expires < datetime.now(UTC):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired. Please request a new one.",
        )

    user.hashed_password = hash_password(new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    user.failed_login_attempts = 0
    user.locked_until = None
    await db.flush()


async def change_password(
    db: AsyncSession, user: User, current_password: str, new_password: str
) -> None:
    """Change password for an authenticated user."""
    if not user.hashed_password or not verify_password(current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )

    user.hashed_password = hash_password(new_password)
    await db.flush()


async def force_change_password(
    db: AsyncSession, user: User, new_password: str
) -> None:
    """Clear must_change_password flag and set new password (staff first login)."""
    if not user.must_change_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password change is not required.",
        )

    user.hashed_password = hash_password(new_password)
    user.must_change_password = False
    await db.flush()


async def update_profile(db: AsyncSession, user: User, full_name: str) -> User:
    """Update user profile fields."""
    user.full_name = full_name.strip()
    await db.flush()
    await db.refresh(user)
    return user
