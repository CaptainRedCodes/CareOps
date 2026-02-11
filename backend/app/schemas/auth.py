from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    """Payload for creating a new admin account."""
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=150)


class LoginRequest(BaseModel):
    """Payload for authenticating an existing user."""
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    """Payload for refreshing an access token."""
    refresh_token: str


class TokenResponse(BaseModel):
    """Returned after successful login or refresh."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    must_change_password: bool = False


class UserResponse(BaseModel):
    """Public-facing user representation."""
    id: UUID
    email: str
    full_name: str
    role: str
    is_active: bool
    auth_provider: str = "local"
    is_email_verified: bool = False
    must_change_password: bool = False

    model_config = {"from_attributes": True}


class ProfileResponse(BaseModel):
    """Extended user profile response."""
    id: UUID
    email: str
    full_name: str
    role: str
    is_active: bool
    auth_provider: str
    is_email_verified: bool
    must_change_password: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ForgotPasswordRequest(BaseModel):
    """Payload to request a password reset email."""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Payload to reset password using a token."""
    token: str
    new_password: str = Field(min_length=8, max_length=128)


class ChangePasswordRequest(BaseModel):
    """Payload to change password (authenticated user)."""
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class ForceChangePasswordRequest(BaseModel):
    """Payload for staff first-login password change."""
    new_password: str = Field(min_length=8, max_length=128)


class UpdateProfileRequest(BaseModel):
    """Payload to update user profile."""
    full_name: str = Field(min_length=1, max_length=150)


class VerifyEmailRequest(BaseModel):
    """Payload to verify email address."""
    token: str


class ResendVerificationRequest(BaseModel):
    """Payload to resend verification email."""
    email: EmailStr


class MessageResponse(BaseModel):
    """Generic success message."""
    message: str
