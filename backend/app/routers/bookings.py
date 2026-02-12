# app/routers/bookings.py
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.user import User
from app.schemas.booking import (
    ServiceTypeCreate, ServiceTypeUpdate, ServiceTypeOut,
    BookingCreate, BookingUpdate, BookingOut, BookingCreateResponse,
    AvailableSlotsResponse
)
from app.services.booking_service import (
    create_service_type, list_service_types, get_service_type,
    update_service_type, get_available_slots, create_booking,
    list_bookings, update_booking_status
)


router = APIRouter(prefix="/workspaces/{workspace_id}/bookings", tags=["Bookings"])

# Public endpoints (no auth)
public_router = APIRouter(prefix="/public/bookings", tags=["Public Bookings"])


# Service Type Management (Admin)
@router.post("/services", response_model=ServiceTypeOut, status_code=status.HTTP_201_CREATED)
async def create_service(
    workspace_id: UUID,
    data: ServiceTypeCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Create a new service type (admin only)"""
    return await create_service_type(db, workspace_id, data)


@router.get("/services", response_model=List[ServiceTypeOut])
async def list_services(
    workspace_id: UUID,
    active_only: bool = Query(True),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """List service types"""
    return await list_service_types(db, workspace_id, active_only)


@router.get("/services/{service_id}", response_model=ServiceTypeOut)
async def get_service(
    workspace_id: UUID,
    service_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Get a service type by ID"""
    return await get_service_type(db, service_id, workspace_id)


@router.put("/services/{service_id}", response_model=ServiceTypeOut)
async def update_service(
    workspace_id: UUID,
    service_id: UUID,
    data: ServiceTypeUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Update a service type (admin only)"""
    return await update_service_type(db, service_id, workspace_id, data)


# Booking Management (Staff)
@router.get("", response_model=List[BookingOut])
async def get_bookings(
    workspace_id: UUID,
    status: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """List bookings with optional filters"""
    return await list_bookings(db, workspace_id, status, start_date, end_date)


@router.patch("/{booking_id}", response_model=BookingOut)
async def update_booking(
    workspace_id: UUID,
    booking_id: UUID,
    data: BookingUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Update booking status (staff only)"""
    return await update_booking_status(db, booking_id, workspace_id, data, user.id)


# Public Booking Endpoints
@public_router.get("/services", response_model=List[ServiceTypeOut])
async def list_public_services(
    workspace_id: UUID = Query(..., description="Workspace ID"),
    db: AsyncSession = Depends(get_db)
):
    """List active services for public booking (no auth required)"""
    return await list_service_types(db, workspace_id, active_only=True)


@public_router.get("/services/{service_id}", response_model=ServiceTypeOut)
async def get_public_service(
    service_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get a service type for public booking (no auth required)"""
    return await get_service_type(db, service_id)


@public_router.get("/services/{service_id}/available-slots", response_model=AvailableSlotsResponse)
async def get_slots(
    service_id: UUID,
    date: datetime = Query(..., description="Date to check availability (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db)
):
    """Get available time slots for a service on a specific date (no auth required)"""
    return await get_available_slots(db, service_id, date)


@public_router.post("/book", response_model=BookingCreateResponse, status_code=status.HTTP_201_CREATED)
async def book_service(
    data: BookingCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a booking (public - no auth required)
    
    Creates contact if new, creates booking, sends confirmation
    """
    return await create_booking(db, data)