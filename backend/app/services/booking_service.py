# app/services/booking_service.py
from uuid import UUID
from datetime import datetime, timedelta, time
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from fastapi import HTTPException, status
import json

from app.models.booking import ServiceType, AvailabilityRule, Booking
from app.models.contact import Contact
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.booking import (
    ServiceTypeCreate, ServiceTypeUpdate, BookingCreate, 
    TimeSlot, AvailableSlotsResponse, BookingUpdate
)
from app.services.communication_service import send_communication


async def create_service_type(
    db: AsyncSession,
    workspace_id: UUID,
    data: ServiceTypeCreate
) -> ServiceType:
    """Create a new service type with availability rules"""
    
    service = ServiceType(
        workspace_id=workspace_id,
        name=data.name,
        description=data.description,
        duration_minutes=data.duration_minutes,
        location_type=data.location_type,
        location_details=data.location_details,
        price=data.price,
        buffer_minutes=data.buffer_minutes,
        max_advance_days=data.max_advance_days,
        forms_to_send=data.forms_to_send
    )
    
    db.add(service)
    await db.flush()
    
    # Add availability rules
    for rule_data in data.availability_rules:
        rule = AvailabilityRule(
            service_type_id=service.id,
            day_of_week=rule_data.day_of_week,
            start_time=rule_data.start_time,
            end_time=rule_data.end_time
        )
        db.add(rule)
    
    await db.commit()
    await db.refresh(service)
    
    return service


async def list_service_types(
    db: AsyncSession,
    workspace_id: UUID,
    active_only: bool = True
) -> list[ServiceType]:
    """List service types for a workspace"""
    query = select(ServiceType).where(ServiceType.workspace_id == workspace_id)
    
    if active_only:
        query = query.where(ServiceType.is_active == True)
    
    result = await db.execute(query.order_by(ServiceType.created_at.desc()))
    return result.scalars().all()


async def get_service_type(
    db: AsyncSession,
    service_id: UUID,
    workspace_id: UUID = None
) -> ServiceType:
    """Get a service type by ID"""
    query = select(ServiceType).where(ServiceType.id == service_id)
    
    if workspace_id:
        query = query.where(ServiceType.workspace_id == workspace_id)
    
    result = await db.execute(query)
    service = result.scalar_one_or_none()
    
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service type not found"
        )
    
    return service


async def update_service_type(
    db: AsyncSession,
    service_id: UUID,
    workspace_id: UUID,
    data: ServiceTypeUpdate
) -> ServiceType:
    """Update a service type"""
    service = await get_service_type(db, service_id, workspace_id)
    
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(service, field, value)
    
    await db.commit()
    await db.refresh(service)
    
    return service


async def get_available_slots(
    db: AsyncSession,
    service_id: UUID,
    date: datetime
) -> AvailableSlotsResponse:
    """
    Get available time slots for a service on a specific date
    
    Algorithm:
    1. Get service type and availability rules for that day
    2. Generate all possible slots based on rules
    3. Remove slots that are already booked
    4. Remove slots in the past
    5. Remove slots beyond max_advance_days
    """
    
    service = await get_service_type(db, service_id)
    
    # Check if date is within booking window
    today = datetime.now().date()
    target_date = date.date()
    
    if target_date < today:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot book in the past"
        )
    
    if (target_date - today).days > service.max_advance_days:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot book more than {service.max_advance_days} days in advance"
        )
    
    # Get availability rules for this day of week
    day_of_week = target_date.weekday()  # 0=Monday, 6=Sunday
    
    result = await db.execute(
        select(AvailabilityRule).where(
            AvailabilityRule.service_type_id == service_id,
            AvailabilityRule.day_of_week == day_of_week,
            AvailabilityRule.is_active == True
        )
    )
    rules = result.scalars().all()
    
    if not rules:
        return AvailableSlotsResponse(
            service_type_id=service_id,
            service_name=service.name,
            date=date,
            slots=[]
        )
    
    # Generate all possible slots
    all_slots = []
    for rule in rules:
        current_time = datetime.combine(target_date, rule.start_time)
        end_datetime = datetime.combine(target_date, rule.end_time)
        
        while current_time + timedelta(minutes=service.duration_minutes) <= end_datetime:
            slot_end = current_time + timedelta(minutes=service.duration_minutes)
            all_slots.append(TimeSlot(start_time=current_time, end_time=slot_end))
            current_time = slot_end + timedelta(minutes=service.buffer_minutes)
    
    # Get existing bookings for this date
    start_of_day = datetime.combine(target_date, time.min)
    end_of_day = datetime.combine(target_date, time.max)
    
    result = await db.execute(
        select(Booking).where(
            Booking.service_type_id == service_id,
            Booking.start_time >= start_of_day,
            Booking.start_time <= end_of_day,
            Booking.status.in_(["scheduled"])  # Only consider active bookings
        )
    )
    bookings = result.scalars().all()
    
    # Filter out booked slots and past slots
    now = datetime.now()
    available_slots = []
    
    for slot in all_slots:
        # Skip past slots
        if slot.start_time <= now:
            continue
        
        # Check if slot conflicts with any booking
        is_available = True
        for booking in bookings:
            if (slot.start_time < booking.end_time and 
                slot.end_time > booking.start_time):
                is_available = False
                break
        
        if is_available:
            available_slots.append(slot)
    
    return AvailableSlotsResponse(
        service_type_id=service_id,
        service_name=service.name,
        date=date,
        slots=available_slots
    )


async def create_booking(
    db: AsyncSession,
    data: BookingCreate
) -> dict:
    """
    Create a booking (public endpoint)
    
    Flow:
    1. Validate service type exists
    2. Check slot is available
    3. Create or get contact
    4. Create booking
    5. Create conversation if new contact
    6. Send confirmation message
    7. Send any required forms
    """
    
    # Get service type
    service = await get_service_type(db, data.service_type_id)
    
    # Validate time slot is available
    slots_response = await get_available_slots(
        db, 
        data.service_type_id, 
        data.start_time
    )
    
    # Check if requested time is in available slots
    requested_slot = TimeSlot(
        start_time=data.start_time,
        end_time=data.start_time + timedelta(minutes=service.duration_minutes)
    )
    
    is_slot_available = any(
        slot.start_time == requested_slot.start_time 
        for slot in slots_response.slots
    )
    
    if not is_slot_available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This time slot is not available"
        )
    
    # Extract contact data
    contact_data = data.contact_data
    name = contact_data.get("name")
    email = contact_data.get("email")
    phone = contact_data.get("phone")
    
    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contact name is required"
        )
    
    if not email and not phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either email or phone is required"
        )
    
    # Find or create contact
    query = select(Contact).where(
        Contact.workspace_id == service.workspace_id
    )
    
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
            workspace_id=service.workspace_id,
            name=name,
            email=email,
            phone=phone,
            form_data=json.dumps(contact_data),
            status="new"
        )
        db.add(contact)
        await db.flush()
    
    # Create booking
    booking = Booking(
        workspace_id=service.workspace_id,
        contact_id=contact.id,
        service_type_id=service.id,
        start_time=data.start_time,
        end_time=data.start_time + timedelta(minutes=service.duration_minutes),
        customer_notes=data.customer_notes,
        status="scheduled"
    )
    db.add(booking)
    await db.flush()
    
    # Create conversation if new contact
    conversation = None
    if is_new_contact:
        conversation = Conversation(
            workspace_id=service.workspace_id,
            contact_id=contact.id,
            status="active",
            last_message_from="system"
        )
        db.add(conversation)
        await db.flush()
    else:
        # Get existing conversation
        result = await db.execute(
            select(Conversation).where(
                Conversation.contact_id == contact.id,
                Conversation.status == "active"
            ).limit(1)
        )
        conversation = result.scalar_one_or_none()
        
        if not conversation:
            conversation = Conversation(
                workspace_id=service.workspace_id,
                contact_id=contact.id,
                status="active",
                last_message_from="system"
            )
            db.add(conversation)
            await db.flush()
    
    # Send confirmation message
    channel = "email" if email else "sms"
    recipient = email or phone
    
    confirmation_message = f"""
Booking Confirmed!

Service: {service.name}
Date & Time: {data.start_time.strftime('%B %d, %Y at %I:%M %p')}
Duration: {service.duration_minutes} minutes
Location: {service.location_details or service.location_type}

{f'Notes: {data.customer_notes}' if data.customer_notes else ''}

We look forward to seeing you!
    """.strip()
    
    try:
        await send_communication(
            db=db,
            workspace_id=service.workspace_id,
            channel=channel,
            recipient=recipient,
            subject=f"Booking Confirmation - {service.name}",
            message=confirmation_message,
            sent_by_staff=False,
            automated=True
        )
        
        # Create message record
        msg = Message(
            conversation_id=conversation.id,
            channel=channel,
            direction="outbound",
            sender="system",
            recipient=recipient,
            subject=f"Booking Confirmation - {service.name}",
            body=confirmation_message,
            sent_by_staff=False,
            automated=True,
            status="sent"
        )
        db.add(msg)
        
    except Exception as e:
        print(f"Failed to send confirmation: {e}")
    
    # TODO: Send forms if configured
    # TODO: Schedule reminders
    
    await db.commit()
    
    return {
        "success": True,
        "message": "Booking created successfully",
        "booking_id": booking.id,
        "contact_id": contact.id
    }


async def list_bookings(
    db: AsyncSession,
    workspace_id: UUID,
    status: str = None,
    start_date: datetime = None,
    end_date: datetime = None
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


async def update_booking_status(
    db: AsyncSession,
    booking_id: UUID,
    workspace_id: UUID,
    data: BookingUpdate,
    user_id: UUID = None
) -> Booking:
    """Update booking (staff only)"""
    result = await db.execute(
        select(Booking).where(
            Booking.id == booking_id,
            Booking.workspace_id == workspace_id
        )
    )
    booking = result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Update fields
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(booking, field, value)
    
    # If marking as completed, set completion time
    if data.status == "completed" and not booking.completed_at:
        booking.completed_at = datetime.now()
        booking.completed_by_user_id = user_id
    
    await db.commit()
    await db.refresh(booking)
    
    return booking