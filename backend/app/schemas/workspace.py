from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class WorkspaceCreate(BaseModel):
    """Payload for creating a new workspace."""
    business_name: str = Field(min_length=1, max_length=255)
    address: str = Field(min_length=1)
    timezone: str = Field(min_length=1, max_length=50, examples=["Asia/Kolkata", "America/New_York"])
    contact_email: EmailStr


class WorkspaceResponse(BaseModel):
    """Public workspace representation."""
    id: UUID
    owner_id: UUID
    business_name: str
    address: str
    timezone: str
    contact_email: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
