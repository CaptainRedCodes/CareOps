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


class UserResponse(BaseModel):
    """Public-facing user representation."""
    id: UUID
    email: str
    full_name: str
    role: str
    is_active: bool
    auth_provider: str = "local"

    model_config = {"from_attributes": True}
