from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List


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
    is_activated: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ActivationCheck(BaseModel):
    """Individual activation check result"""
    name: str
    passed: bool
    detail: str


class ActivationStatusResponse(BaseModel):
    """Workspace activation status"""
    is_activated: bool
    can_activate: bool
    checks: List[ActivationCheck]
