"""
Booking Reminder Scheduler - Background Job

This module provides a background scheduler that checks for upcoming bookings
and sends reminder emails/SMS at configured intervals (24h, 1h before).
"""

import asyncio
import logging
from datetime import datetime, timedelta, UTC, time
from uuid import UUID

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.booking import Booking, BookingStatus
from app.models.contact import Contact
from app.database import async_session

logger = logging.getLogger(__name__)


async def check_and_send_reminders():
    """
    Background task that checks for bookings needing reminders.
    Runs every 15 minutes.
    """
    logger.info("Running booking reminder check...")

    async with async_session() as db:
        try:
            now = datetime.now(UTC)

            # Find bookings that need 24h reminder (between 23-24 hours from now)
            reminder_24h_start = now + timedelta(hours=23)
            reminder_24h_end = now + timedelta(hours=24)

            result_24h = await db.execute(
                select(Booking).where(
                    Booking.status.in_(
                        [BookingStatus.SCHEDULED.value, BookingStatus.CONFIRMED.value]
                    ),
                    Booking.start_time >= reminder_24h_start,
                    Booking.start_time < reminder_24h_end,
                    Booking.reminder_sent_24h == False,
                )
            )
            bookings_24h = result_24h.scalars().all()

            for booking in bookings_24h:
                await _send_reminder(db, booking, "24h")
                booking.reminder_sent_24h = True

            # Find bookings that need 1h reminder (between 30-60 minutes from now)
            reminder_1h_start = now + timedelta(minutes=30)
            reminder_1h_end = now + timedelta(minutes=60)

            result_1h = await db.execute(
                select(Booking).where(
                    Booking.status.in_(
                        [BookingStatus.SCHEDULED.value, BookingStatus.CONFIRMED.value]
                    ),
                    Booking.start_time >= reminder_1h_start,
                    Booking.start_time < reminder_1h_end,
                    Booking.reminder_sent_1h == False,
                )
            )
            bookings_1h = result_1h.scalars().all()

            for booking in bookings_1h:
                await _send_reminder(db, booking, "1h")
                booking.reminder_sent_1h = True

            await db.commit()

            sent_24h = len(bookings_24h)
            sent_1h = len(bookings_1h)
            if sent_24h > 0 or sent_1h > 0:
                logger.info(f"Sent reminders: {sent_24h} (24h), {sent_1h} (1h)")
            else:
                logger.debug("No reminders needed at this time")

        except Exception as e:
            logger.error(f"Error in reminder scheduler: {str(e)}")
            await db.rollback()


async def _send_reminder(db: AsyncSession, booking, reminder_type: str):
    """Send reminder for a booking"""
    from app.services.automation_service import trigger_automation
    from app.services.booking_service import get_booking_type

    booking_type = await get_booking_type(db, booking.booking_type_id)

    result = await db.execute(select(Contact).where(Contact.id == booking.contact_id))
    contact = result.scalar_one_or_none()

    if not contact:
        logger.warning(
            f"Contact {booking.contact_id} not found for booking {booking.id}"
        )
        return

    booking_date = booking.start_time.strftime("%B %d, %Y")
    booking_time = booking.start_time.strftime("%I:%M %p")

    trigger_data = {
        "contact_id": str(contact.id),
        "contact_name": contact.name,
        "contact_email": contact.email,
        "contact_phone": contact.phone,
        "booking_id": str(booking.id),
        "service_name": booking_type.name,
        "booking_date": booking_date,
        "booking_time": booking_time,
        "reminder_type": reminder_type,
    }

    try:
        await trigger_automation(
            db=db,
            workspace_id=booking.workspace_id,
            event_type="booking.reminder",
            trigger_data=trigger_data,
        )
        logger.info(f"Sent {reminder_type} reminder for booking {booking.id}")
    except Exception as e:
        logger.error(f"Failed to send reminder for booking {booking.id}: {str(e)}")


async def start_scheduler(app):
    """Start the background scheduler"""

    async def run_scheduler():
        while True:
            try:
                await check_and_send_reminders()
            except Exception as e:
                logger.error(f"Scheduler error: {str(e)}")
            await asyncio.sleep(900)  # Run every 15 minutes

    task = asyncio.create_task(run_scheduler())
    return task


async def stop_scheduler(app):
    """Stop the background scheduler"""
    logger.info("Stopping booking reminder scheduler...")
