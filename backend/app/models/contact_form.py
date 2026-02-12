# app/models/contact_form.py
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime, UTC
from app.database import Base


class ContactForm(Base):
    """Customizable contact form configuration"""
    __tablename__ = "contact_forms"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False, unique=True)  # for public URL
    description = Column(Text, nullable=True)
    # Form configuration
    fields = Column(JSON, nullable=False)  # Array of field definitions
    
    # Welcome automation
    welcome_message_enabled = Column(Boolean, default=True)
    welcome_message = Column(Text)
    welcome_channel = Column(String(50), default="email")  # "email" or "sms"
    
    # Settings
    is_active = Column(Boolean, default=True)
    status = Column(String(50), default="draft")  # draft, active, archived
    submit_button_text = Column(String(100), default="Submit")
    success_message = Column(Text, default="Thank you! We'll be in touch soon.")
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))
    status = Column(
        String(50),
        default="draft",
        nullable=False
    ) 
    # Relationships
    workspace = relationship("Workspace", back_populates="contact_forms")