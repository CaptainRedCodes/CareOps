# app/services/booking_service.py
"""
Booking Service - Domain Logic Layer

This service handles:
- BookingType (service type) CRUD
- Availability calculation
- Booking creation with validation
- Status transitions

ALL automation is handled via event handlers - no side effects here.
"""

from uuid import UUID
from datetime import datetime, timedelta, time
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
import json
import logging

from app.models.booking import (
    BookingType,
    AvailabilityRule,
    Booking,
    BookingStatus,
    BookingReadinessStatus,
)
from app.models.contact import Contact
from app.models.conversation import Conversation
from app.models.workspace import Workspace
from app.models.communication import CommunicationIntegration
from app.schemas.booking import (
    BookingTypeCreate,
    BookingTypeUpdate,
    BookingCreate,
    TimeSlot,
    AvailableSlotsResponse,
    BookingUpdate,
)
from app.repositories.booking_repository import BookingRepository
from app.repositories.workspace_repository import WorkspaceRepository
from app.services.calendar_service import CalendarService

logger = logging.getLogger(__name__)


# =============================================================================
# WORKSPACE VALIDATION
# =============================================================================


async def validate_workspace_for_booking(
    db: AsyncSession, workspace_id: UUID, booking_type_id: UUID = None
) -> dict:
    """
    Validate workspace can accept bookings.

    Returns dict with:
    - is_valid: bool
    - errors: list of error messages
    """
    errors = []
    workspace_repo = WorkspaceRepository(db)

    # 1. Check workspace exists and is activated
    workspace = await workspace_repo.get_active_workspace(workspace_id)

    if not workspace:
        errors.append("Workspace not found or inactive")
        return {"is_valid": False, "errors": errors}

    # 2. Check at least one communication channel exists
    result = await db.execute(
        select(CommunicationIntegration).where(
            CommunicationIntegration.workspace_id == workspace_id,
            CommunicationIntegration.is_active == True,
        )
    )
    integrations = result.scalars().all()

    if not integrations:
        errors.append("No active communication channel found")

    # 3. If booking_type_id provided, check it exists and has availability
    if booking_type_id:
        booking_repo = BookingRepository(db)
        booking_type = await booking_repo.get_booking_type(booking_type_id)

        if not booking_type or booking_type.workspace_id != workspace_id:
            errors.append("Booking type not found")
        else:
            # Check availability rules exist
            result = await db.execute(
                select(AvailabilityRule).where(
                    AvailabilityRule.booking_type_id == booking_type_id,
                    AvailabilityRule.is_active == True,
                )
            )
            rules = result.scalars().all()

            if not rules:
                errors.append("No availability configured for this booking type")

    return {"is_valid": len(errors) == 0, "errors": errors}


# =============================================================================
# BOOKING TYPE (SERVICE TYPE) OPERATIONS
# =============================================================================


async def create_booking_type(
    db: AsyncSession, workspace_id: UUID, data: BookingTypeCreate
) -> BookingType:
    """Create a new booking type with availability rules"""

    booking_type = BookingType(
        workspace_id=workspace_id,
        name=data.name,
        description=data.description,
        duration_minutes=data.duration_minutes,
        location_type=data.location_type,
        location_details=data.location_details,
        price=data.price,
        buffer_minutes=data.buffer_minutes,
        max_advance_days=data.max_advance_days,
        linked_form_ids=data.linked_form_ids or [],
        inventory_requirements=data.inventory_requirements or [],
    )

    db.add(booking_type)
    await db.flush()

    # Add availability rules
    for rule_data in data.availability_rules:
        rule = AvailabilityRule(
            booking_type_id=booking_type.id,
            day_of_week=rule_data.day_of_week,
            start_time=rule_data.start_time,
            end_time=rule_data.end_time,
        )
        db.add(rule)

    await db.commit()
    await db.refresh(booking_type)

    return booking_type


async def list_booking_types(
    db: AsyncSession, workspace_id: UUID, active_only: bool = True
) -> list[BookingType]:
    """List booking types for a workspace"""
    query = (
        select(BookingType)
        .where(BookingType.workspace_id == workspace_id)
        .options(selectinload(BookingType.availability_rules))
    )

    if active_only:
        query = query.where(BookingType.is_active == True)

    result = await db.execute(query.order_by(BookingType.created_at.desc()))
    return result.scalars().all()


async def get_booking_type(
    db: AsyncSession, booking_type_id: UUID, workspace_id: UUID = None
) -> BookingType:
    """Get a booking type by ID"""
    query = (
        select(BookingType)
        .where(BookingType.id == booking_type_id)
        .options(selectinload(BookingType.availability_rules))
    )

    if workspace_id:
        query = query.where(BookingType.workspace_id == workspace_id)

    result = await db.execute(query)
    booking_type = result.scalar_one_or_none()

    if not booking_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Booking type not found"
        )

    return booking_type


async def update_booking_type(
    db: AsyncSession, booking_type_id: UUID, workspace_id: UUID, data: BookingTypeUpdate
) -> BookingType:
    """Update a booking type"""
    booking_type = await get_booking_type(db, booking_type_id, workspace_id)

    update_data = data.model_dump(exclude_unset=True)

    # Handle list fields
    if "linked_form_ids" in update_data:
        update_data["linked_form_ids"] = update_data["linked_form_ids"] or []
    if "inventory_requirements" in update_data:
        update_data["inventory_requirements"] = (
            update_data["inventory_requirements"] or []
        )

    for field, value in update_data.items():
        setattr(booking_type, field, value)

    await db.commit()
    await db.refresh(booking_type)

    return booking_type


# =============================================================================
# AVAILABILITY CALCULATION
# =============================================================================


async def get_available_slots(
    db: AsyncSession, booking_type_id: UUID, date: datetime, workspace_id: UUID = None
) -> AvailableSlotsResponse:
    """
    Get available time slots for a booking type on a specific date.

    Algorithm:
    1. Get booking type and availability rules for that day
    2. Generate all possible slots based on rules
    3. Remove slots that are already booked
    4. Remove slots in the past
    5. Remove slots beyond max_advance_days
    """
    booking_repo = BookingRepository(db)

    booking_type = await booking_repo.get_booking_type(booking_type_id)
    if not booking_type:
        raise HTTPException(status_code=404, detail="Booking type not found")

    if workspace_id and booking_type.workspace_id != workspace_id:
        raise HTTPException(status_code=404, detail="Booking type not found")

    # Check if date is within booking window
    today = datetime.now().date()
    target_date = date.date()

    if target_date < today:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot book in the past"
        )

    if (target_date - today).days > booking_type.max_advance_days:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot book more than {booking_type.max_advance_days} days in advance",
        )

    # Get availability rules for this day of week
    day_of_week = target_date.weekday()  # 0=Monday, 6=Sunday

    result = await db.execute(
        select(AvailabilityRule).where(
            AvailabilityRule.booking_type_id == booking_type_id,
            AvailabilityRule.day_of_week == day_of_week,
            AvailabilityRule.is_active == True,
        )
    )
    rules = result.scalars().all()

    if not rules:
        return AvailableSlotsResponse(
            booking_type_id=booking_type_id,
            booking_type_name=booking_type.name,
            date=date,
            slots=[],
        )

    # Generate all possible slots
    all_slots = []
    for rule in rules:
        current_time = datetime.combine(target_date, rule.start_time)
        end_datetime = datetime.combine(target_date, rule.end_time)

        while (
            current_time + timedelta(minutes=booking_type.duration_minutes)
            <= end_datetime
        ):
            slot_end = current_time + timedelta(minutes=booking_type.duration_minutes)
            display = current_time.strftime("%I:%M %p")
            all_slots.append(
                TimeSlot(start_time=current_time, end_time=slot_end, display=display)
            )
            current_time = slot_end + timedelta(minutes=booking_type.buffer_minutes)

    # Get existing bookings for this date (using Repo)
    start_of_day = datetime.combine(target_date, time.min)
    end_of_day = datetime.combine(target_date, time.max)

    bookings = await booking_repo.get_overlapping_bookings(
        booking_type_id, start_of_day, end_of_day
    )

    # Check Google Calendar conflicts
    calendar_service = CalendarService(db)
    calendar_conflicts = await calendar_service.check_calendar_conflicts(
        booking_type.workspace_id,
        datetime.combine(target_date, time.min),
        datetime.combine(target_date, time.max),
    )

    # Filter out booked slots, past slots, and calendar conflicts
    now = datetime.now()
    available_slots = []

    for slot in all_slots:
        # Skip past slots
        if slot.start_time <= now:
            continue

        # Check if slot conflicts with any booking
        is_available = True
        for booking in bookings:
            # Traditional overlap check
            if (
                slot.start_time < booking.end_time
                and slot.end_time > booking.start_time
            ):
                is_available = False
                break

        # Check if slot conflicts with calendar events
        if is_available and calendar_conflicts:
            for conflict in calendar_conflicts:
                conflict_start = datetime.fromisoformat(
                    conflict["start"].replace("Z", "+00:00")
                )
                conflict_end = datetime.fromisoformat(
                    conflict["end"].replace("Z", "+00:00")
                )
                if slot.start_time < conflict_end and slot.end_time > conflict_start:
                    is_available = False
                    break

        if is_available:
            available_slots.append(slot)

    return AvailableSlotsResponse(
        booking_type_id=booking_type_id,
        booking_type_name=booking_type.name,
        date=date,
        slots=available_slots,
    )


# =============================================================================
# BOOKING CREATION
# =============================================================================


async def create_booking(db: AsyncSession, data: BookingCreate) -> dict:
    """
    Create a new booking with STRICT transaction isolation.

    Flow:
    1. Lock BookingType row (prevents concurrent double-booking race condition)
    2. Validate workspace & slot availability
    3. Find or create Contact
    4. Create Booking & Conversation
    5. COMMIT transaction
    6. EMIT events (after commit)
    """
    booking_repo = BookingRepository(db)
    workspace_repo = WorkspaceRepository(db)

    # 1. Start Transaction & Lock
    # Note: caller (FastAPI dependency) usually starts transaction, but we must ensure we use it.

    # Lock the booking type to serialize conflicting bookings
    # This might slow down high-concurrency for *same service type*, but ensures safety.
    await booking_repo.lock_booking_type(data.booking_type_id)

    booking_type = await booking_repo.get_booking_type(data.booking_type_id)
    if not booking_type:
        raise HTTPException(status_code=404, detail="Booking type not found")

    workspace_id = booking_type.workspace_id

    # 2. Validate Workspace
    workspace = await workspace_repo.get_active_workspace(workspace_id)
    if not workspace:
        raise HTTPException(status_code=400, detail="Workspace inactive or not found")

    # 3. Re-validate Availability (inside lock)
    booking_end_time = data.start_time + timedelta(
        minutes=booking_type.duration_minutes
    )

    overlapping = await booking_repo.get_overlapping_bookings(
        booking_type.id, data.start_time, booking_end_time
    )

    if overlapping:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Timeslot is no longer available",
        )

    # 3b. Check Google Calendar conflicts
    calendar_service = CalendarService(db)
    calendar_conflicts = await calendar_service.check_calendar_conflicts(
        workspace_id, data.start_time, booking_end_time
    )

    if calendar_conflicts:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This time is busy on the calendar. Please choose another time.",
        )

    # 4. Contact Management
    contact_data = data.contact_data
    email = contact_data.get("email")
    phone = contact_data.get("phone")
    name = contact_data.get("name")

    if not name or (not email and not phone):
        raise HTTPException(status_code=400, detail="Invalid contact data")

    # Find existing contact
    query = select(Contact).where(Contact.workspace_id == workspace_id)
    if email:
        query = query.where(Contact.email == email)
    elif phone:
        query = query.where(Contact.phone == phone)

    result = await db.execute(query)
    contact = result.scalar_one_or_none()

    is_new_contact = False
    if not contact:
        is_new_contact = True
        contact = Contact(
            workspace_id=workspace_id,
            name=name,
            email=email,
            phone=phone,
            form_data=json.dumps(contact_data),
            status="new",
        )
        db.add(contact)
        await db.flush()  # Get ID

    # 5. Create Booking
    booking = Booking(
        workspace_id=workspace_id,
        contact_id=contact.id,
        booking_type_id=data.booking_type_id,
        start_time=data.start_time,
        end_time=booking_end_time,
        customer_notes=data.customer_notes,
        status=BookingStatus.SCHEDULED.value,
        readiness_status=BookingReadinessStatus.PENDING_FORMS.value,
        inventory_reserved=False,
    )
    db.add(booking)
    await db.flush()

    # 6. Conversation Logic
    if is_new_contact:
        conversation = Conversation(
            workspace_id=workspace_id,
            contact_id=contact.id,
            status="active",
            last_message_from="system",
        )
        db.add(conversation)
    else:
        # Check active conversation
        result = await db.execute(
            select(Conversation)
            .where(
                Conversation.contact_id == contact.id, Conversation.status == "active"
            )
            .limit(1)
        )
        if not result.scalar_one_or_none():
            conversation = Conversation(
                workspace_id=workspace_id,
                contact_id=contact.id,
                status="active",
                last_message_from="system",
            )
            db.add(conversation)

    # 7. COMMIT - This finalizes the transaction
    await db.commit()
    await db.refresh(booking)

    # 7b. Sync to Google Calendar (post-commit)
    try:
        from sqlalchemy import select
        from app.models.calendar_integration import CalendarIntegration

        result = await db.execute(
            select(CalendarIntegration).where(
                CalendarIntegration.workspace_id == workspace_id,
                CalendarIntegration.is_active == True,
                CalendarIntegration.sync_enabled == True,
            )
        )
        calendar_integration = result.scalar_one_or_none()

        if calendar_integration:
            location = None
            if booking_type.location_type == "in_person":
                location = booking_type.location_details or workspace.address
            elif booking_type.location_type == "video":
                location = booking_type.location_details or "Video Call"

            description = f"Booking for {contact.name}"
            if contact.email:
                description += f"\nEmail: {contact.email}"
            if contact.phone:
                description += f"\nPhone: {contact.phone}"
            if data.customer_notes:
                description += f"\n\nNotes: {data.customer_notes}"

            await calendar_service.create_calendar_event(
                integration=calendar_integration,
                booking_id=booking.id,
                title=f"{booking_type.name} - {contact.name}",
                start_time=booking.start_time,
                end_time=booking.end_time,
                description=description,
                location=location,
            )
    except Exception as e:
        logger.error(f"Failed to sync booking to calendar: {e}")
        # Don't fail the booking if calendar sync fails

    # 8. EMIT EVENTS - Post-commit only
    # Note: If emission fails here, we log it, but booking remains valid
    try:
        if is_new_contact:
            from app.services.event_service import emit_contact_created

            await emit_contact_created(
                db=db,
                workspace_id=workspace_id,
                contact_id=contact.id,
                contact_data={
                    "name": contact.name,
                    "email": contact.email,
                    "phone": contact.phone,
                    "source": "booking",
                    "is_new_contact": True,
                },
            )

        from app.services.event_service import emit_booking_created

        await emit_booking_created(
            db=db,
            workspace_id=workspace_id,
            booking_id=booking.id,
            booking_data={
                "booking_type_name": booking_type.name,
                "booking_type_id": str(booking_type.id),
                "linked_form_ids": booking_type.linked_form_ids or [],
                "inventory_requirements": booking_type.inventory_requirements or [],
                "start_time": booking.start_time.isoformat(),
                "end_time": booking.end_time.isoformat(),
                "contact_name": contact.name,
                "contact_email": contact.email,
                "contact_phone": contact.phone,
                "is_new_contact": is_new_contact,
            },
        )
    except Exception as e:
        logger.error(f"Failed to emit events for booking {booking.id}: {str(e)}")
        # Don't raise, transaction is already committed

    return {
        "success": True,
        "message": "Booking created successfully",
        "booking_id": booking.id,
        "contact_id": contact.id,
    }


# =============================================================================
# BOOKING QUERIES & STATUS UPDATES
# =============================================================================


async def list_bookings(
    db: AsyncSession,
    workspace_id: UUID,
    status: str = None,
    start_date: datetime = None,
    end_date: datetime = None,
) -> list[Booking]:
    """List bookings with optional filters"""
    query = select(Booking).where(Booking.workspace_id == workspace_id)

    if status:
        query = query.where(Booking.status == status)

    if start_date:
        query = query.where(Booking.start_time >= start_date)

    if end_date:
        query = query.where(Booking.start_time <= end_date)

    result = await db.execute(query.order_by(Booking.start_time))
    return result.scalars().all()


# Status transition validation
VALID_STATUS_TRANSITIONS = {
    BookingStatus.SCHEDULED.value: [
        BookingStatus.CONFIRMED.value,
        BookingStatus.COMPLETED.value,
        BookingStatus.NO_SHOW.value,
        BookingStatus.CANCELLED.value,
    ],
    BookingStatus.CONFIRMED.value: [
        BookingStatus.COMPLETED.value,
        BookingStatus.NO_SHOW.value,
        BookingStatus.CANCELLED.value,
    ],
    BookingStatus.COMPLETED.value: [],  # Terminal state
    BookingStatus.NO_SHOW.value: [],  # Terminal state
    BookingStatus.CANCELLED.value: [],  # Terminal state
}


async def update_booking_status(
    db: AsyncSession,
    booking_id: UUID,
    workspace_id: UUID,
    data: BookingUpdate,
    user_id: UUID = None,
) -> Booking:
    """
    Update booking status with transition validation - validates workspace access.
    """
    result = await db.execute(
        select(Booking).where(
            Booking.id == booking_id, Booking.workspace_id == workspace_id
        )
    )
    booking = result.scalar_one_or_none()

    if not booking:
        check_result = await db.execute(select(Booking).where(Booking.id == booking_id))
        exists = check_result.scalar_one_or_none()
        if exists:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this booking",
            )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found"
        )

    # Validate status transition
    if data.status:
        current_status = booking.status
        valid_transitions = VALID_STATUS_TRANSITIONS.get(current_status, [])

        if data.status not in valid_transitions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot transition from '{current_status}' to '{data.status}'",
            )

        # Additional validation: cannot complete before start_time
        if data.status == BookingStatus.COMPLETED.value:
            if datetime.now() < booking.start_time:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot mark booking as completed before the scheduled time",
                )

        booking.status = data.status

        # If completing, set completion time
        if data.status == BookingStatus.COMPLETED.value:
            booking.completed_at = datetime.now()
            booking.completed_by_user_id = user_id

    # Update staff notes
    if data.staff_notes is not None:
        booking.staff_notes = data.staff_notes

    await db.commit()
    await db.refresh(booking)

    return booking


# Backward compatibility
ServiceType = BookingType
create_service_type = create_booking_type
list_service_types = list_booking_types
get_service_type = get_booking_type
update_service_type = update_booking_type
