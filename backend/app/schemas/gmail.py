# app/schemas/gmail.py
"""
Gmail Integration Schemas
"""

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class GmailAuthUrl(BaseModel):
    """Gmail OAuth URL response"""

    auth_url: str


class GmailStatus(BaseModel):
    """Gmail connection status"""

    connected: bool
    email: Optional[str]
    sync_enabled: bool
    last_sync: Optional[str]


class GmailSyncResponse(BaseModel):
    """Gmail sync response"""

    success: bool
    message: str
    count: int


class EmailSendRequest(BaseModel):
    """Send email request"""

    to_email: EmailStr
    subject: str
    body: str
    html_body: Optional[str] = None


class EmailSendResponse(BaseModel):
    """Send email response"""

    success: bool
    message: str
    message_id: Optional[str]


class EmailMessageOut(BaseModel):
    """Email message output"""

    id: str
    from_email: str
    to_email: str
    subject: Optional[str]
    received_at: Optional[str]
