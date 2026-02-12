# app/schemas/conversation.py
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, List


class MessageCreate(BaseModel):
    """Create a message (staff reply)"""
    channel: str  # email or sms
    body: str
    subject: Optional[str] = None


class MessageOut(BaseModel):
    """Message response"""
    id: UUID
    conversation_id: UUID
    channel: str
    direction: str
    sender: Optional[str]
    recipient: Optional[str]
    subject: Optional[str]
    body: str
    sent_by_staff: bool
    automated: bool
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class ConversationOut(BaseModel):
    """Conversation response"""
    id: UUID
    workspace_id: UUID
    contact_id: UUID
    status: str
    last_message_at: datetime
    last_message_from: Optional[str]
    automation_paused: bool
    created_at: datetime
    updated_at: datetime
    
    # Nested data
    contact: Optional[dict] = None
    messages: List[MessageOut] = []
    
    class Config:
        from_attributes = True


class ConversationWithContact(BaseModel):
    """Conversation with contact details for inbox"""
    conversation_id: UUID
    contact_id: UUID
    contact_name: str
    contact_email: Optional[str]
    contact_phone: Optional[str]
    status: str
    last_message_at: datetime
    last_message_from: Optional[str]
    unread_count: int = 0
    last_message_preview: Optional[str] = None
    
    class Config:
        from_attributes = True