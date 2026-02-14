# app/schemas/automation.py
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional, List, Dict, Any, Literal


VALID_EVENT_TYPES = Literal[
    "contact.created",
    "booking.created",
    "form.completed",
    "inventory.updated",
    "inventory.low",
    "staff.replied",
]

VALID_ACTION_TYPES = Literal["send_email", "send_sms"]


class AutomationRuleCreate(BaseModel):
    """Create an automation rule."""

    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    event_type: VALID_EVENT_TYPES
    priority: int = Field(default=0)
    action_type: VALID_ACTION_TYPES
    action_config: Dict[str, Any] = Field(default_factory=dict)
    conditions: Optional[Dict[str, Any]] = None
    stop_on_reply: bool = Field(default=False)


class AutomationRuleUpdate(BaseModel):
    """Update an automation rule."""

    name: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[VALID_EVENT_TYPES] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = None
    action_type: Optional[VALID_ACTION_TYPES] = None
    action_config: Optional[Dict[str, Any]] = None
    conditions: Optional[Dict[str, Any]] = None
    stop_on_reply: Optional[bool] = None


class AutomationRuleOut(BaseModel):
    """Automation rule response."""

    id: UUID
    workspace_id: UUID
    name: str
    description: Optional[str]
    event_type: str
    is_active: bool
    priority: int
    action_type: str
    action_config: Dict[str, Any]
    conditions: Optional[Dict[str, Any]]
    stop_on_reply: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AutomationLogOut(BaseModel):
    """Automation log response."""

    id: UUID
    workspace_id: UUID
    rule_id: Optional[UUID]
    event_type: str
    trigger_data: Optional[Dict[str, Any]]
    action_type: str
    status: str
    recipient: Optional[str]
    subject: Optional[str]
    message: Optional[str]
    error_message: Optional[str]
    stopped: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Event types enum
class EventType:
    CONTACT_CREATED = "contact.created"
    BOOKING_CREATED = "booking.created"
    FORM_COMPLETED = "form.completed"
    INVENTORY_UPDATED = "inventory.updated"
    INVENTORY_LOW = "inventory.low"
    STAFF_REPLIED = "staff.replied"


# Action types enum
class ActionType:
    SEND_EMAIL = "send_email"
    SEND_SMS = "send_sms"
