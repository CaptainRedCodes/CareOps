"""
Event Handlers - Logging Only

These handlers ONLY log events for audit purposes.
ALL automation now happens through the automation tab via trigger_automation().

No hidden automation triggers allowed.
"""

import logging
from datetime import datetime, UTC
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.event_log import EventLog
from app.models.contact import Contact
from app.models.conversation import Conversation

logger = logging.getLogger(__name__)


async def handle_contact_created(db: AsyncSession, event: EventLog):
    """
    Log contact created event for audit purposes.
    Automation is handled via automation tab rules.
    """
    contact_id = event.entity_id
    workspace_id = event.workspace_id
    event_data = event.event_data or {}

    result = await db.execute(select(Contact).where(Contact.id == contact_id))
    contact = result.scalar_one_or_none()
    if not contact:
        logger.error(f"Contact {contact_id} not found for event")
        return

    logger.info(f"Contact created: {contact_id} in workspace {workspace_id}")


async def handle_booking_created(db: AsyncSession, event: EventLog):
    """
    Log booking created event for audit purposes.
    Automation is handled via automation tab rules.
    """
    booking_id = event.entity_id
    workspace_id = event.workspace_id
    event_data = event.event_data or {}

    logger.info(f"Booking created: {booking_id} in workspace {workspace_id}")


async def handle_form_completed(db: AsyncSession, event: EventLog):
    """
    Handle form completed event - update booking readiness status.
    """
    form_data = event.event_data or {}
    booking_id = form_data.get("booking_id")

    if not booking_id:
        logger.warning(f"Form completed event missing booking_id")
        return

    from app.models.booking import Booking, BookingReadinessStatus
    from app.models.workspace_form import FormSubmission

    booking_uuid = UUID(booking_id) if isinstance(booking_id, str) else booking_id

    result = await db.execute(select(Booking).where(Booking.id == booking_uuid))
    booking = result.scalar_one_or_none()

    if not booking:
        logger.error(f"Booking {booking_id} not found for form completion")
        return

    pending_result = await db.execute(
        select(FormSubmission).where(
            FormSubmission.booking_id == booking_uuid,
            FormSubmission.status == "pending",
        )
    )
    pending_forms = pending_result.scalars().all()

    if not pending_forms:
        booking.readiness_status = BookingReadinessStatus.READY.value
        logger.info(
            f"All forms completed for booking {booking_id}, booking is now ready"
        )
    else:
        booking.readiness_status = BookingReadinessStatus.PENDING_FORMS.value
        logger.info(
            f"Booking {booking_id} still has {len(pending_forms)} pending forms"
        )

    logger.info(f"Form completed: {event.entity_id} for booking {booking_id}")


async def handle_inventory_updated(db: AsyncSession, event: EventLog):
    """
    Log inventory updated event for audit purposes.
    Automation is handled via automation tab rules.
    """
    item_id = event.entity_id
    event_data = event.event_data or {}

    logger.info(f"Inventory updated: {item_id}")


async def handle_inventory_low(db: AsyncSession, event: EventLog):
    """
    Handle low inventory event - send alert email to vendor.
    """
    item_id = event.entity_id
    event_data = event.event_data or {}

    if not item_id:
        logger.warning(f"Inventory low event missing item_id")
        return

    item_name = event_data.get("item_name", "Unknown Item")
    current_quantity = event_data.get("current_quantity", 0)
    threshold = event_data.get("threshold", 0)
    unit = event_data.get("unit", "units")
    vendor_email = event_data.get("vendor_email")

    logger.warning(
        f"Low inventory alert: {item_name} - {current_quantity} {unit} (threshold: {threshold})"
    )

    if vendor_email:
        try:
            from app.services.communication_service import send_communication

            message = f"""Low Stock Alert

The following item is running low:

Item: {item_name}
Current Quantity: {current_quantity} {unit}
Threshold: {threshold} {unit}

Please restock this item as soon as possible.

---
This is an automated alert from CareOps
"""

            await send_communication(
                db=db,
                workspace_id=event.workspace_id,
                channel="email",
                recipient=vendor_email,
                subject=f"Low Stock Alert: {item_name}",
                message=message,
            )
            logger.info(
                f"Low stock alert sent to vendor {vendor_email} for item {item_name}"
            )
        except Exception as e:
            logger.error(f"Failed to send low stock alert email: {str(e)}")


async def handle_staff_replied(db: AsyncSession, event: EventLog):
    """
    Log staff replied event for audit purposes.
    Automation is handled via automation tab rules.
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

    logger.info(f"Staff replied to conversation {conversation_id}, automation paused")


def register_all_handlers():
    """
    Register all event handlers with the event service.
    Handlers now only log events - automation is via automation tab.
    """
    from app.services.event_service import register_handler
    from app.models.event_log import EventType

    register_handler(EventType.CONTACT_CREATED, handle_contact_created)
    register_handler(EventType.BOOKING_CREATED, handle_booking_created)
    register_handler(EventType.FORM_COMPLETED, handle_form_completed)
    register_handler(EventType.INVENTORY_UPDATED, handle_inventory_updated)
    register_handler(EventType.INVENTORY_LOW, handle_inventory_low)
    register_handler(EventType.STAFF_REPLIED, handle_staff_replied)

    logger.info("All event handlers registered (logging only)")
