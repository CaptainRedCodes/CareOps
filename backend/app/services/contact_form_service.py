from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID
from datetime import datetime
from slugify import slugify  # pip install python-slugify
from fastapi import HTTPException, status

from app.models.contact_form import ContactForm
from app.models.contact import Contact
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.contact_form import (
    ContactFormCreate, ContactFormUpdate, ContactFormOut,
    ContactFormSubmission, ContactFormSubmissionResponse
)


async def create_contact_form(
    db: AsyncSession,
    workspace_id: UUID,
    data: ContactFormCreate
) -> ContactForm:
    """Create a new contact form with auto-generated slug"""
    
    # Generate slug if not provided
    if not data.slug:
        data.slug = slugify(data.name)
    
    # Check if slug already exists
    existing = await db.execute(
        select(ContactForm).where(
            ContactForm.workspace_id == workspace_id,
            ContactForm.slug == data.slug
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Form with slug '{data.slug}' already exists"
        )
    
    form = ContactForm(
        workspace_id=workspace_id,
        **data.model_dump()
    )
    db.add(form)
    await db.commit()
    await db.refresh(form)
    return form


async def list_contact_forms(
    db: AsyncSession,
    workspace_id: UUID
) -> list[ContactFormOut]:
    """List all forms with computed stats"""
    
    result = await db.execute(
        select(ContactForm)
        .where(ContactForm.workspace_id == workspace_id)
        .order_by(ContactForm.created_at.desc())
    )
    forms = result.scalars().all()
    
    # Add computed fields
    forms_out = []
    for form in forms:
        # Count submissions (contacts created via this form)
        submission_count = await db.execute(
            select(func.count(Contact.id))
            .where(
                Contact.workspace_id == workspace_id,
                Contact.source == f"form:{form.slug}"
            )
        )
        submissions = submission_count.scalar() or 0
        
        # Calculate last active (last submission)
        last_contact = await db.execute(
            select(Contact.created_at)
            .where(
                Contact.workspace_id == workspace_id,
                Contact.source == f"form:{form.slug}"
            )
            .order_by(Contact.created_at.desc())
            .limit(1)
        )
        last_active_date = last_contact.scalar_one_or_none()
        last_active = format_time_ago(last_active_date) if last_active_date else "Never"
        
        form_dict = {
            **form.__dict__,
            "submissions": submissions,
            "conversion_rate": f"{min(submissions * 2, 100)}%",  # Mock conversion
            "last_active": last_active
        }
        forms_out.append(ContactFormOut(**form_dict))
    
    return forms_out


async def get_contact_form_by_slug(
    db: AsyncSession,
    slug: str
) -> ContactForm:
    """Get form by slug (public access)"""
    
    result = await db.execute(
        select(ContactForm).where(
            ContactForm.slug == slug,
            ContactForm.status == "active"  # Only active forms
        )
    )
    form = result.scalar_one_or_none()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found or inactive"
        )
    
    return form


async def update_contact_form(
    db: AsyncSession,
    form_id: UUID,
    workspace_id: UUID,
    data: ContactFormUpdate
) -> ContactForm:
    """Update contact form"""
    
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
    
    # Check slug uniqueness if changing
    if data.slug and data.slug != form.slug:
        existing = await db.execute(
            select(ContactForm).where(
                ContactForm.workspace_id == workspace_id,
                ContactForm.slug == data.slug,
                ContactForm.id != form_id
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Form with slug '{data.slug}' already exists"
            )
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(form, key, value)
    
    form.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(form)
    return form


async def delete_contact_form(
    db: AsyncSession,
    form_id: UUID,
    workspace_id: UUID
):
    """Delete contact form"""
    
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


async def submit_contact_form(
    db: AsyncSession,
    slug: str,
    submission: ContactFormSubmission
) -> ContactFormSubmissionResponse:
    """
    Handle form submission:
    1. Find or Create Contact
    2. Start Conversation
    3. Create Inbound Message (from User)
    4. Send Welcome Message (automated Outbound)
    """
    from sqlalchemy import or_
    
    # Get form
    form = await get_contact_form_by_slug(db, slug)
    
    # Validate at least email or phone
    if not submission.email and not submission.phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either email or phone is required"
        )
    
    # Check for existing contact
    existing_contact_query = select(Contact).where(
        Contact.workspace_id == form.workspace_id,
        or_(
            Contact.email == submission.email if submission.email else False,
            Contact.phone == submission.phone if submission.phone else False
        )
    )
    result = await db.execute(existing_contact_query)
    contact = result.scalar_one_or_none()
    
    if contact:
        # Update existing contact info if provided
        if submission.name:
            contact.name = submission.name
        if submission.email and not contact.email:
            contact.email = submission.email
        if submission.phone and not contact.phone:
            contact.phone = submission.phone
        # Update custom fields merging logic could be complex, for now we just keep existing or overwrite?
        # Let's simple append/overwrite for now
        if submission.custom_fields:
            contact.custom_fields = {**(contact.custom_fields or {}), **submission.custom_fields}
    else:
        # Create New Contact
        contact = Contact(
            workspace_id=form.workspace_id,
            name=submission.name,
            email=submission.email,
            phone=submission.phone,
            source=f"form:{form.slug}",
            custom_fields=submission.custom_fields or {}
        )
        db.add(contact)
    
    await db.flush()  # Get contact ID
    
    # Create Conversation
    conversation = Conversation(
        workspace_id=form.workspace_id,
        contact_id=contact.id,
        status="active",
        automation_paused=False,
        last_message_from="contact"
    )
    db.add(conversation)
    await db.flush()
    
    # 1. Create Inbound Message (User's inquiry)
    # Even if message is empty, we might want to record that they submitted the form
    user_message_content = submission.message or f"Submitted form: {form.name}"
    
    inbound_message = Message(
        conversation_id=conversation.id,
        channel="email" if submission.email else "sms",
        direction="inbound",
        sender=submission.email or submission.phone,
        recipient="System",
        body=user_message_content,
        created_at=datetime.now(UTC),
        status="delivered"
    )
    db.add(inbound_message)
    
    # 2. Send Welcome Message (Automated Outbound)
    if form.welcome_message_enabled and form.welcome_message:
        welcome_message = Message(
            conversation_id=conversation.id,
            channel=form.welcome_channel or ("email" if submission.email else "sms"),
            direction="outbound",
            sender="System",
            recipient=submission.email or submission.phone,
            body=form.welcome_message,
            subject=f"Re: {form.name}",
            automated=True,
            sent_by_staff=False,
            created_at=datetime.now(UTC), # slightly after inbound
            status="sent"
        )
        db.add(welcome_message)
        
        # Update conversation last message
        conversation.last_message_from = "system"
    
    # TODO: Trigger integration (Email/SMS sending)
    
    await db.commit()
    
    return ContactFormSubmissionResponse(
        success=True,
        contact_id=contact.id,
        conversation_id=conversation.id,
        message=form.success_message or "Thank you! We'll be in touch soon."
    )


def format_time_ago(dt: datetime) -> str:
    """Format datetime to human-readable 'time ago'"""
    if not dt:
        return "Never"
    
    now = datetime.utcnow()
    diff = now - dt
    
    if diff.days == 0:
        hours = diff.seconds // 3600
        if hours == 0:
            minutes = diff.seconds // 60
            return f"{minutes} minutes ago" if minutes > 1 else "Just now"
        return f"{hours} hours ago" if hours > 1 else "1 hour ago"
    elif diff.days == 1:
        return "Yesterday"
    elif diff.days < 7:
        return f"{diff.days} days ago"
    else:
        return dt.strftime("%b %d, %Y")