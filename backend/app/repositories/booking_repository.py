from datetime import datetime
from uuid import UUID
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_

from app.models.booking import Booking, BookingType, BookingStatus
from app.repositories.base import BaseRepository

class BookingRepository(BaseRepository[Booking]):
    """
    Repository for Booking entities.
    Handles booking-specific logic like overlap detection and locking.
    """
    def __init__(self, db: AsyncSession):
        super().__init__(Booking, db)

    async def get_booking_type(self, id: UUID) -> Optional[BookingType]:
        """Get booking type by ID"""
        result = await self.db.execute(select(BookingType).where(BookingType.id == id))
        return result.scalar_one_or_none()

    async def lock_booking_type(self, id: UUID):
        """
        Lock a booking type row for update.
        Used to prevent race conditions during high-volume booking attempts.
        """
        await self.db.execute(
            select(BookingType).where(BookingType.id == id).with_for_update()
        )

    async def get_overlapping_bookings(
        self, 
        booking_type_id: UUID, 
        start_time: datetime, 
        end_time: datetime,
        exclude_booking_id: Optional[UUID] = None
    ) -> List[Booking]:
        """
        Find bookings that overlap with the given time range.
        """
        query = select(Booking).where(
            Booking.booking_type_id == booking_type_id,
            Booking.status.in_([
                BookingStatus.SCHEDULED.value,
                BookingStatus.CONFIRMED.value
            ]),
            # Overlap logic: (StartA < EndB) and (EndA > StartB)
            Booking.start_time < end_time,
            Booking.end_time > start_time
        )

        if exclude_booking_id:
            query = query.where(Booking.id != exclude_booking_id)

        result = await self.db.execute(query)
        return result.scalars().all()
