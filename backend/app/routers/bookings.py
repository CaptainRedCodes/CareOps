# app/routers/bookings.py
"""
Booking Router - API Layer

Handles HTTP requests for booking operations.
All business logic is in the service layer.
"""

from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.dependencies import get_current_user, require_admin, require_permission
from app.models.user import User
from app.schemas.booking import (
    BookingTypeCreate,
    BookingTypeUpdate,
    BookingTypeOut,
    BookingCreate,
    BookingUpdate,
    BookingOut,
    BookingCreateResponse,
    AvailableSlotsResponse,
)
from app.services.booking_service import (
    create_booking_type,
    list_booking_types,
    get_booking_type,
    update_booking_type,
    get_available_slots,
    create_booking,
    list_bookings,
    update_booking_status,
    validate_workspace_for_booking,
)


router = APIRouter(prefix="/workspaces/{workspace_id}/bookings", tags=["Bookings"])

# Public endpoints (no auth)
public_router = APIRouter(prefix="/public/bookings", tags=["Public Bookings"])


# =============================================================================
# BOOKING TYPE MANAGEMENT (Admin)
# =============================================================================


@router.post(
    "/booking-types", response_model=BookingTypeOut, status_code=status.HTTP_201_CREATED
)
async def create_booking_type_endpoint(
    workspace_id: UUID,
    data: BookingTypeCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Create a new booking type (admin only)"""
    return await create_booking_type(db, workspace_id, data)


@router.get("/booking-types", response_model=List[BookingTypeOut])
async def list_booking_types_endpoint(
    workspace_id: UUID,
    active_only: bool = Query(True),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List booking types"""
    return await list_booking_types(db, workspace_id, active_only)


@router.get("/booking-types/{booking_type_id}", response_model=BookingTypeOut)
async def get_booking_type_endpoint(
    workspace_id: UUID,
    booking_type_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get a booking type by ID"""
    return await get_booking_type(db, booking_type_id, workspace_id)


@router.put("/booking-types/{booking_type_id}", response_model=BookingTypeOut)
async def update_booking_type_endpoint(
    workspace_id: UUID,
    booking_type_id: UUID,
    data: BookingTypeUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Update a booking type (admin only)"""
    return await update_booking_type(db, booking_type_id, workspace_id, data)


# Backward compatibility - old endpoints
@router.post(
    "/services", response_model=BookingTypeOut, status_code=status.HTTP_201_CREATED
)
async def create_service(
    workspace_id: UUID,
    data: BookingTypeCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Create a new booking type (admin only) - backward compatible"""
    return await create_booking_type(db, workspace_id, data)


@router.get("/services", response_model=List[BookingTypeOut])
async def list_services(
    workspace_id: UUID,
    active_only: bool = Query(True),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List booking types - backward compatible"""
    return await list_booking_types(db, workspace_id, active_only)


@router.get("/services/{service_id}", response_model=BookingTypeOut)
async def get_service(
    workspace_id: UUID,
    service_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get a booking type by ID - backward compatible"""
    return await get_booking_type(db, service_id, workspace_id)


@router.put("/services/{service_id}", response_model=BookingTypeOut)
async def update_service(
    workspace_id: UUID,
    service_id: UUID,
    data: BookingTypeUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Update a booking type - backward compatible"""
    return await update_booking_type(db, service_id, workspace_id, data)


# =============================================================================
# BOOKING MANAGEMENT (Staff)
# =============================================================================


@router.get("", response_model=List[BookingOut])
async def get_bookings(
    workspace_id: UUID,
    status: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("bookings")),
):
    """List bookings with optional filters"""
    return await list_bookings(db, workspace_id, status, start_date, end_date)


@router.patch("/{booking_id}", response_model=BookingOut)
async def update_booking(
    workspace_id: UUID,
    booking_id: UUID,
    data: BookingUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("bookings")),
):
    """Update booking status (requires bookings permission)"""
    return await update_booking_status(db, booking_id, workspace_id, data, user.id)


# =============================================================================
# PUBLIC BOOKING ENDPOINTS
# =============================================================================


@public_router.get("/services", response_model=List[BookingTypeOut])
async def list_public_services(
    workspace_id: UUID = Query(..., description="Workspace ID"),
    db: AsyncSession = Depends(get_db),
):
    """List active booking types for public booking (no auth required)"""
    # Validation moved to service layer - checking if workspace exists/active
    validation = await validate_workspace_for_booking(db, workspace_id)
    if not validation["is_valid"]:
        # If workspace is invalid, return empty list rather than error to avoid enumeration attacks?
        # Or just return empty list as in original code
        return []
        
    return await list_booking_types(db, workspace_id, active_only=True)


@public_router.get("/services/{service_id}", response_model=BookingTypeOut)
async def get_public_service(service_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get a booking type for public booking (no auth required)"""
    # Service layer handles 404
    return await get_booking_type(db, service_id)


@public_router.get(
    "/services/{service_id}/available-slots", response_model=AvailableSlotsResponse
)
async def get_slots(
    service_id: UUID,
    date: datetime = Query(..., description="Date to check availability (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db),
):
    """Get available time slots for a booking type on a specific date (no auth required)"""
    # Service layer handles logic
    return await get_available_slots(db, service_id, date)


@public_router.post(
    "/book", response_model=BookingCreateResponse, status_code=status.HTTP_201_CREATED
)
async def book_service(data: BookingCreate, db: AsyncSession = Depends(get_db)):
    """
    Create a booking (public - no auth required)

    Creates contact if new, creates booking, emits booking.created event.
    Automation handlers will send confirmation, forms, reserve inventory.
    """
    return await create_booking(db, data)
