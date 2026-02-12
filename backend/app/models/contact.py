# app/models/contact.py
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.database import Base


class Contact(Base):
    """Customer/Lead who has filled out contact form"""
    __tablename__ = "contacts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    
    message = Column(Text, nullable=True)
    form_data = Column(Text, nullable=True)  # JSON field for custom form fields
    
    status = Column(String(50), default="new")  # new, contacted, qualified, converted
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    source = Column(String(100), nullable=True)
    
    workspace = relationship("Workspace", back_populates="contacts")
    conversations = relationship("Conversation", back_populates="contact", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="contact", cascade="all, delete-orphan")
    form_submissions = relationship("FormSubmission", back_populates="contact", cascade="all, delete-orphan")