# app/schemas/workspace_form.py
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional, List


class WorkspaceFormCreate(BaseModel):
    """Create a workspace form (intake/agreement/document)"""
    name: str = Field(..., min_length=1, max_length=255)
    form_type: str = Field(..., pattern="^(intake|agreement|document)$")
    description: Optional[str] = None
    file_url: Optional[str] = None
    is_required: bool = True


class WorkspaceFormUpdate(BaseModel):
    """Update a workspace form"""
    name: Optional[str] = None
    form_type: Optional[str] = None
    description: Optional[str] = None
    file_url: Optional[str] = None
    is_required: Optional[bool] = None
    is_active: Optional[bool] = None


class WorkspaceFormOut(BaseModel):
    """Workspace form response"""
    id: UUID
    workspace_id: UUID
    name: str
    form_type: str
    description: Optional[str]
    file_url: Optional[str]
    is_required: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FormSubmissionCreate(BaseModel):
    """Submit a form"""
    form_id: UUID
    booking_id: UUID
    file_url: Optional[str] = None


class FormSubmissionUpdate(BaseModel):
    """Update form submission status"""
    status: Optional[str] = Field(None, pattern="^(pending|completed|overdue)$")
    file_url: Optional[str] = None


class FormSubmissionOut(BaseModel):
    """Form submission response"""
    id: UUID
    form_id: UUID
    booking_id: UUID
    contact_id: UUID
    status: str
    submitted_at: Optional[datetime]
    file_url: Optional[str]
    reminder_sent: bool
    created_at: datetime
    updated_at: datetime

    # Nested data
    form: Optional[WorkspaceFormOut] = None

    class Config:
        from_attributes = True
