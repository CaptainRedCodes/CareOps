# app/routers/form_webhooks.py
"""
Generic Webhook Endpoint for 3rd Party Forms

Accepts submissions from any form provider (Typeform, JotForm, Google Forms, etc.)
and converts them into leads in the inbox.
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Optional, Dict, Any
from datetime import datetime, UTC
import logging
import json

from app.database import get_db
from app.models.workspace import Workspace
from app.models.contact import Contact
from app.models.conversation import Conversation
from app.models.message import Message
from app.services.event_service import emit_contact_created
from app.schemas.form_webhook import FormWebhookPayload, WebhookResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/public/webhooks", tags=["Form Webhooks"])


@router.post("/form/{workspace_id}", response_model=WebhookResponse)
async def receive_form_webhook(
    workspace_id: UUID,
    payload: Dict[str, Any],
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Generic webhook endpoint for form submissions from any provider.

    Accepts JSON payload and creates a lead in the inbox.

    Expected payload format:
    {
        "source": "typeform|jotform|custom",  // Optional: identifies the source
        "submitted_at": "2024-01-01T12:00:00Z",  // Optional: submission timestamp
        "contact": {
            "name": "John Doe",  // Required
            "email": "john@example.com",  // Optional (email OR phone required)
            "phone": "+1234567890"  // Optional
        },
        "form_data": {  // All other form fields
            "service_interest": "Consultation",
            "message": "I'm interested in your services",
            "custom_field_1": "value"
        }
    }
    """

    # Validate workspace exists and is active
    result = await db.execute(
        select(Workspace).where(
            Workspace.id == workspace_id, Workspace.is_activated == True
        )
    )
    workspace = result.scalar_one_or_none()

    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found or inactive",
        )

    # Extract contact info
    contact_data = payload.get("contact", {})
    name = contact_data.get("name", "")
    email = contact_data.get("email")
    phone = contact_data.get("phone")

    # Validate required fields
    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Contact name is required"
        )

    if not email and not phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contact email or phone is required",
        )

    # Extract form data
    form_data = payload.get("form_data", {})
    source = payload.get("source", "webhook")
    submitted_at = payload.get("submitted_at")

    try:
        # Find or create contact
        from sqlalchemy import select as sa_select

        query = sa_select(Contact).where(Contact.workspace_id == workspace_id)
        if email:
            query = query.where(Contact.email == email)
        elif phone:
            query = query.where(Contact.phone == phone)

        result = await db.execute(query)
        existing_contact = result.scalar_one_or_none()

        is_new_contact = False

        if existing_contact:
            contact = existing_contact
            # Update contact info if needed
            if name and not contact.name:
                contact.name = name
        else:
            is_new_contact = True
            contact = Contact(
                workspace_id=workspace_id,
                name=name,
                email=email,
                phone=phone,
                form_data=json.dumps(form_data),
                source=f"webhook:{source}",
                status="new",
            )
            db.add(contact)
            await db.flush()

        # Find or create conversation
        result = await db.execute(
            sa_select(Conversation).where(
                Conversation.contact_id == contact.id, Conversation.status == "active"
            )
        )
        conversation = result.scalar_one_or_none()

        if not conversation:
            conversation = Conversation(
                workspace_id=workspace_id,
                contact_id=contact.id,
                status="active",
                last_message_from="customer",
                automation_paused=False,
            )
            db.add(conversation)
            await db.flush()

        # Create message with form data
        message_content = f"New form submission from {source}\n\n"
        message_content += f"Name: {name}\n"
        if email:
            message_content += f"Email: {email}\n"
        if phone:
            message_content += f"Phone: {phone}\n"

        if form_data:
            message_content += "\nForm Data:\n"
            for key, value in form_data.items():
                message_content += f"{key}: {value}\n"

        message = Message(
            conversation_id=conversation.id,
            channel="email" if email else "sms",
            direction="inbound",
            sender=name,
            recipient=workspace.contact_email,
            body=message_content,
            sent_by_staff=False,
            automated=False,
            status="received",
        )
        db.add(message)

        # Update conversation
        conversation.last_message_at = datetime.now(UTC)
        conversation.last_message_from = "customer"

        await db.commit()

        # Emit event for automation (welcome message)
        if is_new_contact:
            await emit_contact_created(
                db=db,
                workspace_id=workspace_id,
                contact_id=contact.id,
                contact_data={
                    "name": contact.name,
                    "email": contact.email,
                    "phone": contact.phone,
                    "source": f"webhook:{source}",
                    "form_data": form_data,
                    "is_new_contact": True,
                },
            )

        return {
            "success": True,
            "message": "Form submission received",
            "contact_id": str(contact.id),
            "conversation_id": str(conversation.id),
            "is_new_contact": is_new_contact,
        }

    except Exception as e:
        logger.error(f"Error processing form webhook: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process form submission",
        )


@router.post("/form/{workspace_id}/simple")
async def receive_simple_form_webhook(
    workspace_id: UUID,
    name: str,
    email: Optional[str] = None,
    phone: Optional[str] = None,
    message: Optional[str] = None,
    background_tasks: BackgroundTasks = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Simple webhook endpoint for basic form submissions.

    Use query parameters for simple integrations:
    POST /public/webhooks/form/{workspace_id}/simple?name=John&email=john@example.com&message=Hello
    """
    payload = {
        "source": "simple_webhook",
        "contact": {"name": name, "email": email, "phone": phone},
        "form_data": {"message": message} if message else {},
    }

    return await receive_form_webhook(workspace_id, payload, background_tasks, db)


@router.get("/form/{workspace_id}/docs")
async def get_webhook_documentation(workspace_id: UUID):
    """
    Get documentation for the webhook endpoint.
    Shows example payloads and integration instructions.
    """
    webhook_url = f"/public/webhooks/form/{workspace_id}"

    return {
        "endpoint": webhook_url,
        "method": "POST",
        "content_type": "application/json",
        "description": "Receive form submissions from any form provider",
        "examples": {
            "typeform": {
                "source": "typeform",
                "contact": {
                    "name": "{{field:name}}",
                    "email": "{{field:email}}",
                    "phone": "{{field:phone}}",
                },
                "form_data": {"message": "{{field:message}}"},
            },
            "generic": {
                "source": "your_form_provider",
                "contact": {
                    "name": "Customer Name",
                    "email": "customer@example.com",
                    "phone": "+1234567890",
                },
                "form_data": {
                    "any_field": "any_value",
                    "service_interest": "Consultation",
                },
            },
        },
        "notes": [
            "Contact name is required",
            "At least one contact method (email or phone) is required",
            "All fields in form_data are stored and displayed in the inbox",
            "New contacts automatically receive a welcome message",
            "Form submissions create or update conversations in the inbox",
        ],
    }
