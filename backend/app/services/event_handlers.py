"""
Event Handlers - Automation Logic Layer

These handlers ONLY respond to logged events.
NO hidden triggers allowed.

Each handler is registered to handle ONE event type.
"""

import logging
from datetime import datetime, UTC
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.event_log import EventLog
from app.models.contact import Contact
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.booking import Booking, BookingReadinessStatus
from app.models.workspace_form import WorkspaceForm, FormSubmission
from app.models.inventory import InventoryItem, InventoryUsage

logger = logging.getLogger(__name__)


async def handle_contact_created(db: AsyncSession, event: EventLog):
    """
    When contact is created:
    1. Send welcome message (if configured) - either from form or default
    """
    contact_id = event.entity_id
    workspace_id = event.workspace_id
    event_data = event.event_data or {}

    result = await db.execute(select(Contact).where(Contact.id == contact_id))
    contact = result.scalar_one_or_none()
    if not contact:
        logger.error(f"Contact {contact_id} not found for event")
        return

    result = await db.execute(
        select(Conversation).where(
            Conversation.contact_id == contact_id, Conversation.status == "active"
        )
    )
    conversation = result.scalar_one_or_none()

    if not conversation:
        logger.warning(f"No active conversation for contact {contact_id}")
        return

    try:
        from app.services.communication_service import send_communication
        from app.models.contact_form import ContactForm

        channel = "email" if contact.email else "sms"
        recipient = contact.email or contact.phone

        welcome_message = None
        should_send_welcome = True

        # Check if this contact was created from a form
        form_slug = event_data.get("form_slug")
        if form_slug:
            # Get form's welcome message settings
            result = await db.execute(
                select(ContactForm).where(ContactForm.slug == form_slug)
            )
            form = result.scalar_one_or_none()
            if form:
                if not form.welcome_message_enabled:
                    should_send_welcome = False
                else:
                    welcome_message = form.welcome_message

        # If no form or form doesn't have custom message, use default
        if not welcome_message:
            welcome_message = f"Thank you for contacting us, {contact.name}! We will be in touch shortly."

        # Send welcome message only if enabled
        if should_send_welcome and recipient:
            await send_communication(
                db=db,
                workspace_id=workspace_id,
                channel=channel,
                recipient=recipient,
                subject="Thank you for reaching out!",
                message=welcome_message,
                sent_by_staff=False,
                automated=True,
            )

            msg = Message(
                conversation_id=conversation.id,
                channel=channel,
                direction="outbound",
                sender="System",
                recipient=recipient,
                subject="Thank you for reaching out!",
                body=welcome_message,
                sent_by_staff=False,
                automated=True,
                status="sent",
            )
            db.add(msg)

            conversation.last_message_from = "system"

            logger.info(f"Welcome message sent to contact {contact_id}")

    except Exception as e:
        logger.error(f"Failed to send welcome message: {e}")


async def handle_booking_created(db: AsyncSession, event: EventLog):
    """
    When booking is created, automation handlers must:
    1. Send booking confirmation
    2. Send linked forms (create form submissions)
    3. Reserve inventory
    """
    booking_id = event.entity_id
    workspace_id = event.workspace_id
    event_data = event.event_data or {}

    # Get the booking
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    if not booking:
        logger.error(f"Booking {booking_id} not found")
        return

    # Get contact
    result = await db.execute(select(Contact).where(Contact.id == booking.contact_id))
    contact = result.scalar_one_or_none()
    if not contact:
        logger.error(f"Contact {booking.contact_id} not found")
        return

    # 1. Send booking confirmation
    await _send_booking_confirmation(db, booking, contact, workspace_id)

    # 2. Send linked forms
    linked_form_ids = event_data.get("linked_form_ids", [])
    if linked_form_ids:
        await _send_linked_forms(db, booking, contact, linked_form_ids, workspace_id)
    else:
        # No forms - mark as ready
        booking.readiness_status = BookingReadinessStatus.READY.value

    # 3. Reserve inventory
    inventory_requirements = event_data.get("inventory_requirements", [])
    if inventory_requirements:
        await _reserve_inventory(db, booking, inventory_requirements, workspace_id)
    else:
        booking.inventory_reserved = True

    logger.info(f"Booking automation completed for {booking_id}")


async def _send_booking_confirmation(
    db: AsyncSession, booking: Booking, contact: Contact, workspace_id: UUID
):
    """Send booking confirmation via communication service"""
    try:
        from app.services.communication_service import send_communication

        channel = "email" if contact.email else "sms"
        recipient = contact.email or contact.phone

        from app.models.booking import BookingType

        result = await db.execute(
            select(BookingType).where(BookingType.id == booking.booking_type_id)
        )
        booking_type = result.scalar_one_or_none()

        confirmation_message = f"""Booking Confirmed!

Service: {booking_type.name if booking_type else "Appointment"}
Date: {booking.start_time.strftime("%B %d, %Y")}
Time: {booking.start_time.strftime("%I:%M %p")}
Duration: {booking_type.duration_minutes if booking_type else "N/A"} minutes

We look forward to seeing you!
"""

        await send_communication(
            db=db,
            workspace_id=workspace_id,
            channel=channel,
            recipient=recipient,
            subject=f"Booking Confirmation - {booking_type.name if booking_type else 'Appointment'}",
            message=confirmation_message,
            sent_by_staff=False,
            automated=True,
        )

        # Get or create conversation to log message
        result = await db.execute(
            select(Conversation)
            .where(
                Conversation.contact_id == contact.id, Conversation.status == "active"
            )
            .limit(1)
        )
        conversation = result.scalar_one_or_none()

        if conversation:
            msg = Message(
                conversation_id=conversation.id,
                channel=channel,
                direction="outbound",
                sender="System",
                recipient=recipient,
                subject=f"Booking Confirmation - {booking_type.name if booking_type else 'Appointment'}",
                body=confirmation_message,
                sent_by_staff=False,
                automated=True,
                status="sent",
            )
            db.add(msg)

        logger.info(f"Booking confirmation sent for {booking.id}")

    except Exception as e:
        logger.error(f"Failed to send booking confirmation: {e}")


async def _send_linked_forms(
    db: AsyncSession,
    booking: Booking,
    contact: Contact,
    form_ids: list,
    workspace_id: UUID,
):
    """Create form submissions and send form links to contact"""
    from app.services.communication_service import send_communication
    import secrets

    forms_sent = []

    for form_id in form_ids:
        result = await db.execute(
            select(WorkspaceForm).where(
                WorkspaceForm.id == form_id, WorkspaceForm.workspace_id == workspace_id
            )
        )
        form = result.scalar_one_or_none()

        if not form or not form.is_active:
            continue

        # Generate secure access token
        access_token = secrets.token_urlsafe(32)

        # Create form submission record
        submission = FormSubmission(
            form_id=form.id,
            booking_id=booking.id,
            contact_id=contact.id,
            status="pending",
            access_token=access_token,
        )
        db.add(submission)
        await db.flush()

        forms_sent.append(
            {
                "form_name": form.name,
                "form_id": form.id,
                "submission_id": submission.id,
            }
        )

        logger.info(
            f"Form submission created for booking {booking.id}, form {form.name}"
        )

    # If forms were created, send them to contact
    if forms_sent and (contact.email or contact.phone):
        channel = "email" if contact.email else "sms"
        recipient = contact.email or contact.phone

        forms_list = "\n".join([f"- {f['form_name']}" for f in forms_sent])

        message = f"""Hello {contact.name},

Your appointment has been booked. Please complete the following forms before your appointment:

{forms_list}

We look forward to seeing you!
"""

        try:
            await send_communication(
                db=db,
                workspace_id=workspace_id,
                channel=channel,
                recipient=recipient,
                subject="Please complete your booking forms",
                message=message,
                sent_by_staff=False,
                automated=True,
            )
        except Exception as e:
            logger.error(f"Failed to send form links: {e}")

    # If no forms linked, mark as ready
    if not forms_sent:
        booking.readiness_status = BookingReadinessStatus.READY.value


async def _reserve_inventory(
    db: AsyncSession, booking: Booking, requirements: list, workspace_id: UUID
):
    """Reserve inventory for booking — only marks reserved if ALL items succeed"""
    all_reserved = True

    for req in requirements:
        item_id = req.get("item_id")
        quantity_needed = req.get("quantity", 1)

        result = await db.execute(
            select(InventoryItem).where(
                InventoryItem.id == item_id, InventoryItem.workspace_id == workspace_id
            )
        )
        item = result.scalar_one_or_none()

        if not item:
            logger.warning(f"Inventory item {item_id} not found")
            all_reserved = False
            continue

        if item.quantity < quantity_needed:
            logger.warning(
                f"Insufficient inventory for {item.name}: needed {quantity_needed}, available {item.quantity}"
            )
            all_reserved = False
            continue

        # Deduct inventory
        item.quantity -= quantity_needed

        # Record usage
        usage = InventoryUsage(
            item_id=item.id,
            booking_id=booking.id,
            workspace_id=workspace_id,
            quantity_used=quantity_needed,
            notes=f"Reserved for booking {booking.id}",
        )
        db.add(usage)

        # Check threshold and emit inventory.low
        if item.quantity <= item.low_stock_threshold:
            from app.services.event_service import emit_inventory_low

            await emit_inventory_low(
                db=db,
                workspace_id=workspace_id,
                item_id=item.id,
                inventory_data={
                    "item_name": item.name,
                    "quantity_before": item.quantity + quantity_needed,
                    "quantity_after": item.quantity,
                    "quantity_used": quantity_needed,
                    "unit": item.unit,
                    "low_stock_threshold": item.low_stock_threshold,
                    "vendor_email": item.vendor_email,
                    "booking_id": str(booking.id),
                },
            )

        logger.info(
            f"Inventory reserved: {item.name} x{quantity_needed} for booking {booking.id}"
        )

    booking.inventory_reserved = all_reserved
    if not all_reserved:
        logger.warning(f"Partial inventory reservation for booking {booking.id}")


async def handle_form_completed(db: AsyncSession, event: EventLog):
    """
    When form is completed:
    1. Update form submission status
    2. Check if all forms for booking are completed
    3. Update booking readiness status
    """
    form_data = event.event_data or {}
    booking_id = form_data.get("booking_id")
    submission_id = form_data.get("submission_id")

    if not booking_id:
        logger.warning("No booking_id in form.completed event")
        return

    # Get the booking
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()

    if not booking:
        logger.error(f"Booking {booking_id} not found")
        return

    # Check all form submissions for this booking
    result = await db.execute(
        select(FormSubmission).where(FormSubmission.booking_id == booking_id)
    )
    submissions = result.scalars().all()

    if not submissions:
        logger.warning(f"No form submissions found for booking {booking_id}")
        return

    # Check if all are completed
    all_completed = all(sub.status == "completed" for sub in submissions)

    if all_completed:
        booking.readiness_status = BookingReadinessStatus.READY.value
        logger.info(f"All forms completed for booking {booking_id}, marked as ready")
    else:
        pending_count = sum(1 for sub in submissions if sub.status == "pending")
        logger.info(f"Booking {booking_id}: {pending_count} forms still pending")


async def handle_inventory_updated(db: AsyncSession, event: EventLog):
    """
    When inventory is manually updated (e.g., restocked):
    1. Log the update
    """
    item_id = event.entity_id
    event_data = event.event_data or {}

    result = await db.execute(select(InventoryItem).where(InventoryItem.id == item_id))
    item = result.scalar_one_or_none()

    if not item:
        logger.error(f"Inventory item {item_id} not found")
        return

    logger.info(f"Inventory updated: {item.name} (now {item.quantity} {item.unit})")


async def handle_inventory_low(db: AsyncSession, event: EventLog):
    """
    When inventory drops below threshold:
    1. Log low-stock alert
    2. Send email to vendor if configured
    """
    item_id = event.entity_id
    event_data = event.event_data or {}

    result = await db.execute(select(InventoryItem).where(InventoryItem.id == item_id))
    item = result.scalar_one_or_none()

    if not item:
        logger.error(f"Inventory item {item_id} not found")
        return

    logger.warning(
        f"LOW STOCK ALERT: {item.name} — {item.quantity} {item.unit} remaining "
        f"(threshold: {item.low_stock_threshold})"
    )

    # Send email to vendor if configured
    vendor_email = event_data.get("vendor_email") or item.vendor_email
    if vendor_email:
        try:
            from app.services.communication_service import send_communication

            message = f"""Low Stock Alert

Item: {item.name}
Current Quantity: {item.quantity} {item.unit}
Threshold: {item.low_stock_threshold} {item.unit}

Please restock this item.

---
Automated message from CareOps
"""

            await send_communication(
                db=db,
                workspace_id=event.workspace_id,
                channel="email",
                recipient=vendor_email,
                subject=f"Low Stock Alert: {item.name}",
                message=message,
                automated=True,
            )

            logger.info(
                f"Low stock email sent to vendor {vendor_email} for item {item.name}"
            )

        except Exception as e:
            logger.error(f"Failed to send low stock email to vendor: {e}")


async def handle_staff_replied(db: AsyncSession, event: EventLog):
    """
    When staff replies to a conversation:
    1. Pause automation for that conversation
    """
    conversation_id = event.entity_id

    result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conversation = result.scalar_one_or_none()

    if not conversation:
        logger.error(f"Conversation {conversation_id} not found")
        return

    conversation.automation_paused = True

    logger.info(f"Automation paused for conversation {conversation_id}")


def register_all_handlers():
    """Register all event handlers with the event service"""
    from app.services.event_service import register_handler
    from app.models.event_log import EventType

    register_handler(EventType.CONTACT_CREATED, handle_contact_created)
    register_handler(EventType.BOOKING_CREATED, handle_booking_created)
    register_handler(EventType.FORM_COMPLETED, handle_form_completed)
    register_handler(EventType.INVENTORY_UPDATED, handle_inventory_updated)
    register_handler(EventType.INVENTORY_LOW, handle_inventory_low)
    register_handler(EventType.STAFF_REPLIED, handle_staff_replied)

    logger.info("All event handlers registered")
