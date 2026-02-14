from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any


class WorkingHoursSlot(BaseModel):
    """A single time slot for working hours."""

    start_time: str
    end_time: str


class DaySchedule(BaseModel):
    """Schedule for a single day."""

    is_open: bool
    slots: List[WorkingHoursSlot] = []


class WorkingHoursData(BaseModel):
    """Working hours schedule for the entire week."""

    monday: DaySchedule
    tuesday: DaySchedule
    wednesday: DaySchedule
    thursday: DaySchedule
    friday: DaySchedule
    saturday: DaySchedule
    sunday: DaySchedule


class WorkingHoursUpdate(BaseModel):
    """Payload for updating working hours."""

    schedule: Dict[str, Dict[str, Any]]


class WorkingHoursResponse(BaseModel):
    """Working hours response."""

    id: UUID
    workspace_id: UUID
    schedule: Dict[str, Dict[str, Any]]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WorkspaceCreate(BaseModel):
    """Payload for creating a new workspace."""

    business_name: str = Field(min_length=1, max_length=255)
    address: str = Field(min_length=1)
    timezone: str = Field(
        min_length=1, max_length=50, examples=["Asia/Kolkata", "America/New_York"]
    )
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
    pending_forms: int = 0

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
