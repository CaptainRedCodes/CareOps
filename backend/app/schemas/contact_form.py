from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional, List, Dict

class ContactFormCreate(BaseModel):
    name: str
    description: Optional[str] = None
    slug: Optional[str] = None  # Auto-generated if not provided
    fields: List[Dict]  # JSON schema for form fields
    status: str = "draft"  # draft, active, archived

class ContactFormUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    slug: Optional[str] = None
    fields: Optional[List[Dict]] = None
    status: Optional[str] = None

class ContactFormOut(BaseModel):
    id: UUID
    workspace_id: UUID
    name: str
    description: Optional[str]
    slug: str
    fields: List[Dict]
    status: str
    created_at: datetime
    updated_at: datetime
    
    # Computed fields for frontend
    submissions: int = 0
    conversion_rate: Optional[str] = None
    last_active: Optional[str] = None
    
    class Config:
        from_attributes = True

class ContactFormSubmission(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    message: Optional[str] = None
    custom_fields: Optional[Dict] = {}  # For additional form fields

class ContactFormSubmissionResponse(BaseModel):
    success: bool
    contact_id: UUID
    conversation_id: UUID
    message: str = "Thank you! We'll be in touch soon."