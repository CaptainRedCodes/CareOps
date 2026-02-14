"""
Event Service - The ONE SOURCE OF TRUTH for all events.

This service is responsible for:
1. Logging all events to EventLog
2. Dispatching events to registered handlers
3. Ensuring NO hidden automation triggers

Valid Events (ALLOWED AUTOMATION TRIGGERS):
- contact.created
- booking.created
- form.completed
- inventory.updated
- staff.replied

No other triggers allowed.
"""

from typing import Callable, Any, Optional
from uuid import UUID
from datetime import UTC, datetime
import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.event_log import EventLog, EventType, EventStatus

logger = logging.getLogger(__name__)


# Event Handlers Registry
# Maps event_type -> list of handler functions
EVENT_HANDLERS: dict[EventType, list[Callable]] = {}


def register_handler(event_type: EventType, handler: Callable):
    """
    Register an event handler.

    Handler signature: async def handler(db, event: EventLog) -> None
    """
    if event_type not in EVENT_HANDLERS:
        EVENT_HANDLERS[event_type] = []
    EVENT_HANDLERS[event_type].append(handler)
    logger.info(f"Registered handler for {event_type.value}")


async def log_event(
    db: AsyncSession,
    event_type: EventType,
    workspace_id: UUID,
    entity_type: Optional[str] = None,
    entity_id: Optional[UUID] = None,
    event_data: Optional[dict] = None,
) -> EventLog:
    """
    Log an event to the EventLog table.
    This is the ONLY way to record state changes.
    """
    event = EventLog(
        event_type=event_type,
        workspace_id=workspace_id,
        entity_type=entity_type,
        entity_id=entity_id,
        event_data=event_data or {},
        status=EventStatus.PENDING,
    )

    db.add(event)
    await db.flush()

    logger.info(f"Event logged: {event_type.value} for workspace {workspace_id}")

    return event


async def dispatch_event(db: AsyncSession, event: EventLog) -> None:
    """
    Dispatch an event to all registered handlers.
    Handlers are called AFTER the event is logged.
    """
    handlers = EVENT_HANDLERS.get(event.event_type, [])

    if not handlers:
        logger.debug(f"No handlers registered for {event.event_type.value}")

    logger.info(f"Dispatching {event.event_type.value} to {len(handlers)} handler(s)")

    for handler in handlers:
        try:
            await handler(db, event)
            event.status = EventStatus.PROCESSED
            event.processed_at = datetime.now(UTC)
        except Exception as e:
            logger.error(f"Handler failed for {event.event_type.value}: {str(e)}")
            event.status = EventStatus.FAILED
            event.error_message = str(e)

        await db.flush()

    await _trigger_automation_rules(db, event)


async def process_event(
    db: AsyncSession,
    event_type: EventType,
    workspace_id: UUID,
    entity_type: Optional[str] = None,
    entity_id: Optional[UUID] = None,
    event_data: Optional[dict] = None,
) -> EventLog:
    """
    Complete event pipeline:
    1. Log the event
    2. Dispatch to handlers
    3. Commit the transaction
    """
    event = await log_event(
        db=db,
        event_type=event_type,
        workspace_id=workspace_id,
        entity_type=entity_type,
        entity_id=entity_id,
        event_data=event_data,
    )

    await dispatch_event(db, event)

    return event


# Convenience functions for each event type
async def emit_contact_created(
    db: AsyncSession,
    workspace_id: UUID,
    contact_id: UUID,
    contact_data: dict,
) -> EventLog:
    """Emit contact.created event"""
    return await process_event(
        db=db,
        event_type=EventType.CONTACT_CREATED,
        workspace_id=workspace_id,
        entity_type="contact",
        entity_id=contact_id,
        event_data=contact_data,
    )


async def emit_booking_created(
    db: AsyncSession,
    workspace_id: UUID,
    booking_id: UUID,
    booking_data: dict,
) -> EventLog:
    """Emit booking.created event"""
    return await process_event(
        db=db,
        event_type=EventType.BOOKING_CREATED,
        workspace_id=workspace_id,
        entity_type="booking",
        entity_id=booking_id,
        event_data=booking_data,
    )


async def emit_form_completed(
    db: AsyncSession,
    workspace_id: UUID,
    form_id: UUID,
    booking_id: UUID,
    form_data: dict,
) -> EventLog:
    """Emit form.completed event"""
    return await process_event(
        db=db,
        event_type=EventType.FORM_COMPLETED,
        workspace_id=workspace_id,
        entity_type="form_submission",
        entity_id=form_id,
        event_data={"booking_id": str(booking_id), **form_data},
    )


async def emit_inventory_updated(
    db: AsyncSession,
    workspace_id: UUID,
    item_id: UUID,
    inventory_data: dict,
) -> EventLog:
    """Emit inventory.updated event"""
    return await process_event(
        db=db,
        event_type=EventType.INVENTORY_UPDATED,
        workspace_id=workspace_id,
        entity_type="inventory_item",
        entity_id=item_id,
        event_data=inventory_data,
    )


async def emit_inventory_low(
    db: AsyncSession,
    workspace_id: UUID,
    item_id: UUID,
    inventory_data: dict,
) -> EventLog:
    """Emit inventory.low event when stock drops below threshold"""
    return await process_event(
        db=db,
        event_type=EventType.INVENTORY_LOW,
        workspace_id=workspace_id,
        entity_type="inventory_item",
        entity_id=item_id,
        event_data=inventory_data,
    )


async def emit_staff_replied(
    db: AsyncSession,
    workspace_id: UUID,
    conversation_id: UUID,
    reply_data: dict,
) -> EventLog:
    """Emit staff.replied event"""
    return await process_event(
        db=db,
        event_type=EventType.STAFF_REPLIED,
        workspace_id=workspace_id,
        entity_type="conversation",
        entity_id=conversation_id,
        event_data=reply_data,
    )


async def _trigger_automation_rules(db: AsyncSession, event: EventLog) -> None:
    """
    Trigger automation rules from the automation tab for this event.
    All automation now happens through user-defined rules in the automation tab.
    """
    try:
        from app.services.automation_service import trigger_automation

        trigger_data = {
            "contact_id": str(event.entity_id)
            if event.entity_type == "contact"
            else None,
            "event_type": event.event_type.value,
            **event.event_data,
        }

        await trigger_automation(
            db=db,
            workspace_id=event.workspace_id,
            event_type=event.event_type.value,
            trigger_data=trigger_data,
        )
    except Exception as e:
        logger.error(f"Failed to trigger automation rules: {e}")
