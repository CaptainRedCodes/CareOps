# app/schemas/booking.py
from pydantic import BaseModel, Field, field_validator
from uuid import UUID
from datetime import datetime, time
from typing import Optional, List


class AvailabilityRuleCreate(BaseModel):
    """Create availability rule"""
    day_of_week: int = Field(..., ge=0, le=6)  # 0=Monday, 6=Sunday
    start_time: time
    end_time: time
    
    @field_validator('end_time')
    @classmethod
    def validate_times(cls, v, info):
        if 'start_time' in info.data and v <= info.data['start_time']:
            raise ValueError('end_time must be after start_time')
        return v


class AvailabilityRuleOut(BaseModel):
    """Availability rule response"""
    id: UUID
    service_type_id: UUID
    day_of_week: int
    start_time: time
    end_time: time
    is_active: bool
    
    class Config:
        from_attributes = True


class ServiceTypeCreate(BaseModel):
    """Create a service type"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    duration_minutes: int = Field(..., gt=0)
    location_type: str = Field(..., pattern="^(in_person|phone|video|custom)$")
    location_details: Optional[str] = None
    price: Optional[str] = None
    buffer_minutes: int = Field(default=0, ge=0)
    max_advance_days: int = Field(default=30, ge=1)
    forms_to_send: Optional[List[str]] = None
    availability_rules: List[AvailabilityRuleCreate]


class ServiceTypeUpdate(BaseModel):
    """Update service type"""
    name: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    location_type: Optional[str] = None
    location_details: Optional[str] = None
    price: Optional[str] = None
    is_active: Optional[bool] = None
    buffer_minutes: Optional[int] = None
    max_advance_days: Optional[int] = None
    forms_to_send: Optional[List[str]] = None


class ServiceTypeOut(BaseModel):
    """Service type response"""
    id: UUID
    workspace_id: UUID
    name: str
    description: Optional[str]
    duration_minutes: int
    location_type: str
    location_details: Optional[str]
    price: Optional[str]
    is_active: bool
    buffer_minutes: int
    max_advance_days: int
    forms_to_send: Optional[List[str]]
    created_at: datetime
    updated_at: datetime
    availability_rules: List[AvailabilityRuleOut] = []
    
    class Config:
        from_attributes = True


class TimeSlot(BaseModel):
    """Available time slot"""
    start_time: datetime
    end_time: datetime


class AvailableSlotsResponse(BaseModel):
    """Available slots for a service"""
    service_type_id: UUID
    service_name: str
    date: datetime
    slots: List[TimeSlot]


class BookingCreate(BaseModel):
    """Create a booking (public endpoint)"""
    service_type_id: UUID
    start_time: datetime
    contact_data: dict  # name, email/phone
    customer_notes: Optional[str] = None


class BookingUpdate(BaseModel):
    """Update booking (staff only)"""
    status: Optional[str] = Field(None, pattern="^(scheduled|completed|no_show|cancelled)$")
    staff_notes: Optional[str] = None


class BookingOut(BaseModel):
    """Booking response"""
    id: UUID
    workspace_id: UUID
    contact_id: UUID
    service_type_id: UUID
    start_time: datetime
    end_time: datetime
    status: str
    customer_notes: Optional[str]
    staff_notes: Optional[str]
    reminder_sent_24h: bool
    reminder_sent_1h: bool
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    # Nested data
    service_type: Optional[ServiceTypeOut] = None
    contact: Optional[dict] = None  # Basic contact info
    
    class Config:
        from_attributes = True


class BookingCreateResponse(BaseModel):
    """Response after creating a booking"""
    success: bool
    message: str
    booking_id: Optional[UUID] = None
    contact_id: Optional[UUID] = None