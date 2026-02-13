# app/models/lead.py
"""
Lead Model - Tracks form submissions and lead sources
"""

import uuid
from datetime import UTC, datetime
from typing import Optional

from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean, JSON, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.database import Base
import enum


class LeadStatus(str, enum.Enum):
    """Lead status lifecycle"""

    NEW = "new"  # Just submitted
    CONTACTED = "contacted"  # Staff has reached out
    QUALIFIED = "qualified"  # Determined to be a good fit
    CONVERTED = "converted"  # Became a customer
    LOST = "lost"  # Not interested or not a fit


class LeadSource(str, enum.Enum):
    """Source of the lead"""

    CONTACT_FORM = "contact_form"  # Your own contact form
    BOOKING_FORM = "booking_form"  # Booking page
    WEBHOOK = "webhook"  # 3rd party form
    MANUAL = "manual"  # Manually entered
    REFERRAL = "referral"  # Word of mouth
    OTHER = "other"


class Lead(Base):
    """
    A lead represents a potential customer who submitted a form.

    Leads are linked to contacts and track the journey from
    initial inquiry to conversion or loss.
    """

    __tablename__ = "leads"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
    )
    contact_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("contacts.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Lead info
    source: Mapped[str] = mapped_column(
        Enum(LeadSource), default=LeadSource.CONTACT_FORM, nullable=False
    )
    source_detail: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )  # e.g., "contact_form:summer-campaign" or "webhook:typeform"

    # Form data
    form_data: Mapped[Optional[dict]] = mapped_column(
        JSON, nullable=True
    )  # All form fields stored as JSON

    # Status tracking
    status: Mapped[str] = mapped_column(
        Enum(LeadStatus), default=LeadStatus.NEW, nullable=False
    )

    # Assignment
    assigned_to_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )

    # Value tracking
    estimated_value: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )  # e.g., "$500-$1000"
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Timestamps
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
    first_contacted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    converted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    # Relationships
    workspace = relationship("Workspace", back_populates="leads")
    contact = relationship("Contact", back_populates="leads")
    assigned_to = relationship("User", back_populates="assigned_leads")


class LeadActivity(Base):
    """
    Tracks all activities related to a lead
    (calls, emails, status changes, notes, etc.)
    """

    __tablename__ = "lead_activities"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    lead_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Activity info
    activity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    # Types: "status_change", "note", "call", "email", "meeting", "form_submission"

    description: Mapped[str] = mapped_column(Text, nullable=False)

    # Who performed the activity
    performed_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )

    # For status changes
    old_status: Mapped[Optional[str]] = mapped_column(Enum(LeadStatus), nullable=True)
    new_status: Mapped[Optional[str]] = mapped_column(Enum(LeadStatus), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )

    # Relationships
    lead = relationship("Lead", back_populates="activities")
    workspace = relationship("Workspace", back_populates="lead_activities")
    performed_by = relationship("User", back_populates="lead_activities")
