# app/schemas/contact.py
from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from typing import Optional


class ContactCreate(BaseModel):
    """Create a contact"""
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    message: Optional[str] = None
    form_data: Optional[dict] = None


class ContactUpdate(BaseModel):
    """Update contact"""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    status: Optional[str] = None
    form_data: Optional[dict] = None


class ContactOut(BaseModel):
    """Contact response"""
    id: UUID
    workspace_id: UUID
    name: str
    email: Optional[str]
    phone: Optional[str]
    message: Optional[str]
    form_data: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True