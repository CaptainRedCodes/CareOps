# app/models/booking.py
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean, JSON, Integer, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime, UTC
from app.database import Base


class ServiceType(Base):
    """Service or meeting type that can be booked"""
    __tablename__ = "service_types"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(255), nullable=False)
    description = Column(Text)
    duration_minutes = Column(Integer, nullable=False)  # e.g., 30, 60
    
    # Location
    location_type = Column(String(50), nullable=False)  # "in_person", "phone", "video", "custom"
    location_details = Column(Text)  # Address or meeting link
    
    # Pricing (optional)
    price = Column(String(50))  # e.g., "$100", "Free"
    
    # Settings
    is_active = Column(Boolean, default=True)
    buffer_minutes = Column(Integer, default=0)  # Time between bookings
    max_advance_days = Column(Integer, default=30)  # How far in advance can book
    
    # Forms to send after booking
    forms_to_send = Column(JSON)  # Array of form IDs or URLs
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))
    
    # Relationships
    workspace = relationship("Workspace", back_populates="service_types")
    availability_rules = relationship("AvailabilityRule", back_populates="service_type", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="service_type")


class AvailabilityRule(Base):
    """Defines when a service can be booked"""
    __tablename__ = "availability_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    service_type_id = Column(UUID(as_uuid=True), ForeignKey("service_types.id", ondelete="CASCADE"), nullable=False)
    
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    
    is_active = Column(Boolean, default=True)
    
    # Relationships
    service_type = relationship("ServiceType", back_populates="availability_rules")


class Booking(Base):
    """A scheduled appointment/booking"""
    __tablename__ = "bookings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id", ondelete="CASCADE"), nullable=False)
    service_type_id = Column(UUID(as_uuid=True), ForeignKey("service_types.id", ondelete="CASCADE"), nullable=False)
    
    # Booking details
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    
    # Status tracking
    status = Column(String(50), default="scheduled")  # scheduled, completed, no_show, cancelled
    
    # Notes
    customer_notes = Column(Text)
    staff_notes = Column(Text)
    
    # Reminders
    reminder_sent_24h = Column(Boolean, default=False)
    reminder_sent_1h = Column(Boolean, default=False)
    
    # Completion
    completed_at = Column(DateTime(timezone=True), nullable=True)
    completed_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))
    
    # Relationships
    contact = relationship("Contact", back_populates="bookings")
    service_type = relationship("ServiceType", back_populates="bookings")
    inventory_usage = relationship("InventoryUsage", back_populates="booking", cascade="all, delete-orphan")
    form_submissions = relationship("FormSubmission", back_populates="booking", cascade="all, delete-orphan")