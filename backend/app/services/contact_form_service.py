# app/services/contact_form_service.py
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
import json

from app.models.contact_form import ContactForm
from app.models.contact import Contact
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.contact_form import ContactFormCreate, ContactFormUpdate, ContactFormSubmission
from app.services.communication_service import send_communication


async def create_contact_form(
    db: AsyncSession,
    workspace_id: UUID,
    data: ContactFormCreate
) -> ContactForm:
    """Create a new contact form"""
    
    # Check if slug already exists
    result = await db.execute(
        select(ContactForm).where(ContactForm.slug == data.slug)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A form with this slug already exists"
        )
    
    form = ContactForm(
        workspace_id=workspace_id,
        name=data.name,
        slug=data.slug,
        fields=[field.model_dump() for field in data.fields],
        welcome_message_enabled=data.welcome_message_enabled,
        welcome_message=data.welcome_message,
        welcome_channel=data.welcome_channel,
        submit_button_text=data.submit_button_text,
        success_message=data.success_message
    )
    
    db.add(form)
    await db.commit()
    await db.refresh(form)
    
    return form


async def get_contact_form_by_slug(db: AsyncSession, slug: str) -> ContactForm:
    """Get a contact form by slug (public endpoint)"""
    result = await db.execute(
        select(ContactForm).where(
            ContactForm.slug == slug,
            ContactForm.is_active == True
        )
    )
    form = result.scalar_one_or_none()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    return form


async def list_contact_forms(db: AsyncSession, workspace_id: UUID) -> list[ContactForm]:
    """List all contact forms for a workspace"""
    result = await db.execute(
        select(ContactForm)
        .where(ContactForm.workspace_id == workspace_id)
        .order_by(ContactForm.created_at.desc())
    )
    return result.scalars().all()


async def update_contact_form(
    db: AsyncSession,
    form_id: UUID,
    workspace_id: UUID,
    data: ContactFormUpdate
) -> ContactForm:
    """Update a contact form"""
    result = await db.execute(
        select(ContactForm).where(
            ContactForm.id == form_id,
            ContactForm.workspace_id == workspace_id
        )
    )
    form = result.scalar_one_or_none()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    # Update fields
    for field, value in data.model_dump(exclude_unset=True).items():
        if field == "fields" and value:
            value = [f.model_dump() if hasattr(f, 'model_dump') else f for f in value]
        setattr(form, field, value)
    
    await db.commit()
    await db.refresh(form)
    
    return form


async def submit_contact_form(
    db: AsyncSession,
    slug: str,
    submission: ContactFormSubmission
) -> dict:
    """
    Handle public form submission
    
    Flow:
    1. Validate form exists and is active
    2. Create contact
    3. Create conversation
    4. Send welcome message (if enabled)
    5. Return success response
    """
    
    # Get form
    form = await get_contact_form_by_slug(db, slug)
    
    # Extract required fields
    form_data = submission.form_data
    name = form_data.get("name")
    email = form_data.get("email")
    phone = form_data.get("phone")
    message = form_data.get("message")
    
    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Name is required"
        )
    
    if not email and not phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either email or phone is required"
        )
    
    # Create contact
    contact = Contact(
        workspace_id=form.workspace_id,
        name=name,
        email=email,
        phone=phone,
        message=message,
        form_data=json.dumps(form_data),
        status="new"
    )
    db.add(contact)
    await db.flush()
    
    # Create conversation
    conversation = Conversation(
        workspace_id=form.workspace_id,
        contact_id=contact.id,
        status="active",
        last_message_from="system"
    )
    db.add(conversation)
    await db.flush()
    
    # Send welcome message if enabled
    if form.welcome_message_enabled and form.welcome_message:
        recipient = email if form.welcome_channel == "email" else phone
        
        if recipient:
            try:
                # Send via communication service
                await send_communication(
                    db=db,
                    workspace_id=form.workspace_id,
                    channel=form.welcome_channel,
                    recipient=recipient,
                    subject=f"Welcome - {form.name}" if form.welcome_channel == "email" else None,
                    message=form.welcome_message,
                    sent_by_staff=False,
                    automated=True
                )
                
                # Create message record
                welcome_msg = Message(
                    conversation_id=conversation.id,
                    channel=form.welcome_channel,
                    direction="outbound",
                    sender="system",
                    recipient=recipient,
                    subject=f"Welcome - {form.name}" if form.welcome_channel == "email" else None,
                    body=form.welcome_message,
                    sent_by_staff=False,
                    automated=True,
                    status="sent"
                )
                db.add(welcome_msg)
                
            except Exception as e:
                # Log error but don't fail the submission
                print(f"Failed to send welcome message: {e}")
    
    await db.commit()
    
    return {
        "success": True,
        "message": form.success_message,
        "contact_id": contact.id
    }


async def delete_contact_form(
    db: AsyncSession,
    form_id: UUID,
    workspace_id: UUID
) -> None:
    """Delete a contact form"""
    result = await db.execute(
        select(ContactForm).where(
            ContactForm.id == form_id,
            ContactForm.workspace_id == workspace_id
        )
    )
    form = result.scalar_one_or_none()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    await db.delete(form)
    await db.commit()