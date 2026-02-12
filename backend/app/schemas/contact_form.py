# app/schemas/contact_form.py
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional, List, Any


class FormField(BaseModel):
    """Field definition in a contact form"""
    name: str
    type: str  # text, email, tel, textarea, select, checkbox
    required: bool = False
    label: str
    placeholder: Optional[str] = None
    options: Optional[List[str]] = None  # for select fields


class ContactFormCreate(BaseModel):
    """Create a new contact form"""
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=255, pattern="^[a-z0-9-]+$")
    fields: List[FormField]
    welcome_message_enabled: bool = True
    welcome_message: Optional[str] = None
    welcome_channel: str = "email"
    submit_button_text: str = "Submit"
    success_message: str = "Thank you! We'll be in touch soon."


class ContactFormUpdate(BaseModel):
    """Update contact form"""
    name: Optional[str] = None
    fields: Optional[List[FormField]] = None
    welcome_message_enabled: Optional[bool] = None
    welcome_message: Optional[str] = None
    welcome_channel: Optional[str] = None
    is_active: Optional[bool] = None
    submit_button_text: Optional[str] = None
    success_message: Optional[str] = None


class ContactFormOut(BaseModel):
    """Contact form response"""
    id: UUID
    workspace_id: UUID
    name: str
    slug: str
    fields: List[dict]
    welcome_message_enabled: bool
    welcome_message: Optional[str]
    welcome_channel: str
    is_active: bool
    submit_button_text: str
    success_message: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ContactFormSubmission(BaseModel):
    """Public form submission"""
    form_data: dict  # Key-value pairs matching form fields
    
    class Config:
        json_schema_extra = {
            "example": {
                "form_data": {
                    "name": "John Doe",
                    "email": "john@example.com",
                    "phone": "+1234567890",
                    "message": "I'd like to learn more about your services"
                }
            }
        }


class ContactFormSubmissionResponse(BaseModel):
    """Response after form submission"""
    success: bool
    message: str
    contact_id: Optional[UUID] = None