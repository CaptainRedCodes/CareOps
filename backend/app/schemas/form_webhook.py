# app/schemas/form_webhook.py
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from uuid import UUID


class ContactInfo(BaseModel):
    """Contact information from form submission"""

    name: str = Field(..., description="Contact name")
    email: Optional[str] = Field(None, description="Contact email")
    phone: Optional[str] = Field(None, description="Contact phone")


class FormWebhookPayload(BaseModel):
    """Generic webhook payload for form submissions"""

    source: str = Field(default="webhook", description="Form provider/source")
    submitted_at: Optional[str] = Field(
        None, description="Submission timestamp (ISO 8601)"
    )
    contact: ContactInfo
    form_data: Dict[str, Any] = Field(
        default_factory=dict, description="Additional form fields"
    )


class WebhookResponse(BaseModel):
    """Webhook response"""

    success: bool
    message: str
    contact_id: UUID
    conversation_id: UUID
    is_new_contact: bool
