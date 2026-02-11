from fastapi import APIRouter, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import (
    ChangePasswordRequest,
    ForceChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    ProfileResponse,
    RefreshRequest,
    RegisterRequest,
    ResendVerificationRequest,
    ResetPasswordRequest,
    TokenResponse,
    UpdateProfileRequest,
    UserResponse,
    VerifyEmailRequest,
)
from app.services.auth_service import (
    authenticate_user,
    change_password,
    force_change_password,
    generate_tokens,
    refresh_access_token,
    register_user,
    request_password_reset,
    resend_verification,
    reset_password,
    update_profile,
    verify_email,
)

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=201)
@limiter.limit("3/minute")
async def register(
    request: Request,
    payload: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Register a new admin account. A verification email is sent. Rate limited: 3 req/min."""
    user = await register_user(db, payload)
    return user


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(
    request: Request,
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate and return access + refresh tokens. Rate limited: 5 req/min."""
    user = await authenticate_user(db, payload)
    return generate_tokens(user)


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("10/minute")
async def refresh(
    request: Request,
    payload: RefreshRequest,
    db: AsyncSession = Depends(get_db),
):
    """Exchange a valid refresh token for a new token pair."""
    return await refresh_access_token(db, payload.refresh_token)


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return current_user


# ── Email Verification ──────────────────────────────────────────────────────


@router.post("/verify-email", response_model=MessageResponse)
async def verify_email_endpoint(
    payload: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db),
):
    """Verify user's email using the token from the verification email."""
    await verify_email(db, payload.token)
    return {"message": "Email verified successfully. You can now sign in."}


@router.post("/resend-verification", response_model=MessageResponse)
@limiter.limit("2/minute")
async def resend_verification_endpoint(
    request: Request,
    payload: ResendVerificationRequest,
    db: AsyncSession = Depends(get_db),
):
    """Resend verification email. Rate limited: 2 req/min."""
    await resend_verification(db, payload.email)
    return {"message": "If an unverified account exists, a new verification email has been sent."}


# ── Password Reset ──────────────────────────────────────────────────────────


@router.post("/forgot-password", response_model=MessageResponse)
@limiter.limit("3/minute")
async def forgot_password(
    request: Request,
    payload: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Send password reset email. Always returns success to prevent email enumeration."""
    await request_password_reset(db, payload.email)
    return {"message": "If an account with that email exists, a password reset link has been sent."}


@router.post("/reset-password", response_model=MessageResponse)
@limiter.limit("5/minute")
async def reset_password_endpoint(
    request: Request,
    payload: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Reset password using the token from the reset email."""
    await reset_password(db, payload.token, payload.new_password)
    return {"message": "Password has been reset successfully. You can now sign in."}


# ── Profile Management ──────────────────────────────────────────────────────


@router.get("/profile", response_model=ProfileResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    """Return the full profile of the current user."""
    return current_user


@router.put("/profile", response_model=ProfileResponse)
async def update_profile_endpoint(
    payload: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the current user's profile (full_name)."""
    return await update_profile(db, current_user, payload.full_name)


@router.put("/change-password", response_model=MessageResponse)
async def change_password_endpoint(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change password for an authenticated user."""
    await change_password(db, current_user, payload.current_password, payload.new_password)
    return {"message": "Password changed successfully."}


@router.put("/force-change-password", response_model=MessageResponse)
async def force_change_password_endpoint(
    payload: ForceChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change password on first login (staff with must_change_password flag)."""
    await force_change_password(db, current_user, payload.new_password)
    return {"message": "Password updated. Welcome to CareOps!"}
