from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ---------- Integration Schemas ----------


class IntegrationBase(BaseModel):
    channel: str = Field(..., examples=["email", "sms"])
    provider: str = Field(..., examples=["gmail", "sendgrid", "twilio"])


class IntegrationUpdate(BaseModel):
    is_active: bool


class IntegrationResponse(IntegrationBase):
    id: UUID
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Communication Log Schemas ----------


class CommunicationLogResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    channel: str
    recipient: str
    subject: Optional[str]
    status: str
    error_message: Optional[str]
    sent_at: datetime

    class Config:
        from_attributes = True


class IntegrationCreate(BaseModel):
    channel: str = Field(..., pattern="^(email|sms)$")
    provider: str
    config: dict


class IntegrationOut(BaseModel):
    id: UUID
    channel: str
    provider: str
    is_active: bool

    class Config:
        from_attributes = True


class SendMessageIn(BaseModel):
    channel: str = Field(..., pattern="^(email|sms)$")
    recipient: str
    subject: Optional[str] = None
    message: str


class CommunicationLogOut(BaseModel):
    id: UUID
    channel: str
    recipient: str
    subject: Optional[str]
    status: str
    error_message: Optional[str]


class VerificationRequest(BaseModel):
    channel: str = Field(..., pattern="^(email|sms)$")
    test_recipient: str = Field(
        ..., description="Email or phone number to send test message"
    )


class VerificationResponse(BaseModel):
    success: bool
    message: str
    channel: str
    error: Optional[str] = None
