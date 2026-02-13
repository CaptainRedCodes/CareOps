from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional, List, Dict


class ContactFormCreate(BaseModel):
    name: str
    description: Optional[str] = None
    slug: Optional[str] = None  # Auto-generated if not provided
    fields: List[Dict] = []
    status: str = "draft"  # draft, active, archived
    welcome_message_enabled: bool = True
    welcome_message: Optional[str] = ""
    welcome_channel: str = "email"
    submit_button_text: str = "Submit"
    success_message: Optional[str] = ""


class ContactFormUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    slug: Optional[str] = None
    fields: Optional[List[Dict]] = None
    status: Optional[str] = None
    welcome_message_enabled: Optional[bool] = None
    welcome_message: Optional[str] = None
    welcome_channel: Optional[str] = None
    submit_button_text: Optional[str] = None
    success_message: Optional[str] = None


class ContactFormOut(BaseModel):
    id: UUID
    workspace_id: UUID
    name: str
    description: Optional[str] = None
    slug: str
    fields: List[Dict] = []
    status: str = "draft"
    welcome_message_enabled: bool = True
    welcome_message: Optional[str] = ""
    welcome_channel: str = "email"
    submit_button_text: str = "Submit"
    success_message: Optional[str] = ""
    is_active: bool = False  # Computed: status == "active"
    created_at: datetime
    updated_at: datetime

    # Computed fields for frontend
    submissions: int = 0
    conversion_rate: Optional[str] = None
    last_active: Optional[str] = None

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_with_computed(cls, form):
        data = {**form.__dict__}
        data["is_active"] = form.status == "active"
        # Ensure string fields are not None
        data.setdefault("welcome_message", "")
        data.setdefault("success_message", "")
        data.setdefault("submit_button_text", "Submit")
        data.setdefault("welcome_channel", "email")
        return cls(**data)


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
