# app/schemas/staff.py
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional


class StaffPermissions(BaseModel):
    """Staff permissions schema"""
    inbox: bool = True
    bookings: bool = True
    forms: bool = False
    inventory: bool = False


class StaffPermissionsUpdate(BaseModel):
    """Update staff permissions"""
    permissions: StaffPermissions


class StaffOut(BaseModel):
    """Staff member response"""
    id: UUID
    user_id: UUID
    workspace_id: UUID
    role: str
    permissions: dict
    created_at: datetime

    # Nested user info
    user_email: Optional[str] = None
    user_name: Optional[str] = None

    class Config:
        from_attributes = True
