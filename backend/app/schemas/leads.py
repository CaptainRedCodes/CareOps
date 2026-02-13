# app/schemas/leads.py
"""
Schemas for Lead Management
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime

from app.models.lead import LeadStatus, LeadSource


# ============== Lead Schemas ==============


class LeadBase(BaseModel):
    """Base lead schema"""

    source: LeadSource = LeadSource.CONTACT_FORM
    source_detail: Optional[str] = None
    estimated_value: Optional[str] = None
    notes: Optional[str] = None


class LeadCreate(LeadBase):
    """Create a new lead"""

    contact_id: UUID
    form_data: Optional[Dict[str, Any]] = None


class LeadUpdate(BaseModel):
    """Update lead"""

    status: Optional[LeadStatus] = None
    assigned_to_user_id: Optional[UUID] = None
    estimated_value: Optional[str] = None
    notes: Optional[str] = None


class LeadOut(BaseModel):
    """Lead response"""

    id: UUID
    workspace_id: UUID
    contact_id: UUID
    source: LeadSource
    source_detail: Optional[str]
    form_data: Optional[Dict[str, Any]]
    status: LeadStatus
    assigned_to_user_id: Optional[UUID]
    estimated_value: Optional[str]
    notes: Optional[str]
    submitted_at: datetime
    first_contacted_at: Optional[datetime]
    converted_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    # Nested data
    contact: Optional[Dict[str, Any]] = None
    assigned_to: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class LeadListResponse(BaseModel):
    """List of leads with pagination"""

    leads: List[LeadOut]
    total: int
    page: int
    per_page: int


class LeadStats(BaseModel):
    """Lead statistics"""

    total_leads: int
    new_leads: int
    contacted_leads: int
    qualified_leads: int
    converted_leads: int
    lost_leads: int
    conversion_rate: float


# ============== Lead Activity Schemas ==============


class LeadActivityCreate(BaseModel):
    """Create lead activity"""

    activity_type: str  # "status_change", "note", "call", "email", "meeting"
    description: str
    old_status: Optional[LeadStatus] = None
    new_status: Optional[LeadStatus] = None


class LeadActivityOut(BaseModel):
    """Lead activity response"""

    id: UUID
    lead_id: UUID
    activity_type: str
    description: str
    performed_by_user_id: Optional[UUID]
    old_status: Optional[LeadStatus]
    new_status: Optional[LeadStatus]
    created_at: datetime

    performed_by: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class LeadWithActivities(BaseModel):
    """Lead with all activities"""

    lead: LeadOut
    activities: List[LeadActivityOut]


# ============== Lead Filters ==============


class LeadFilter(BaseModel):
    """Filter leads"""

    status: Optional[LeadStatus] = None
    source: Optional[LeadSource] = None
    assigned_to: Optional[UUID] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    search: Optional[str] = None
