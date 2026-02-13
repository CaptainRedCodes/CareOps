# app/routers/calendar.py
"""
Calendar Integration Router

Handles Google Calendar OAuth and management.
"""

from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Optional

from app.database import get_db
from app.dependencies import require_admin
from app.models.user import User
from app.services.calendar_service import CalendarService
from app.schemas.calendar import (
    CalendarAuthUrl,
    CalendarStatus,
    CalendarEventCreate,
    CalendarEventOut,
    CalendarConflict,
)

router = APIRouter(
    prefix="/workspaces/{workspace_id}/calendar", tags=["Calendar Integration"]
)


@router.get("/auth-url", response_model=CalendarAuthUrl)
async def get_auth_url(
    workspace_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Get Google OAuth URL for calendar connection"""
    service = CalendarService(db)
    auth_url = service.get_auth_url(workspace_id)
    return {"auth_url": auth_url}


@router.post("/connect", status_code=status.HTTP_201_CREATED)
async def connect_calendar(
    workspace_id: UUID,
    code: str = Query(..., description="OAuth authorization code from Google"),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Connect Google Calendar using OAuth code"""
    service = CalendarService(db)

    try:
        # Exchange code for tokens
        tokens = await service.exchange_code(code)

        # Save integration
        integration = await service.save_integration(workspace_id, tokens)

        return {
            "success": True,
            "message": "Google Calendar connected successfully",
            "calendar_id": integration.calendar_id,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to connect calendar: {str(e)}",
        )


@router.get("/status", response_model=CalendarStatus)
async def get_calendar_status(
    workspace_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Get calendar connection status"""
    from sqlalchemy import select
    from app.models.calendar_integration import CalendarIntegration

    result = await db.execute(
        select(CalendarIntegration).where(
            CalendarIntegration.workspace_id == workspace_id
        )
    )
    integration = result.scalar_one_or_none()

    if not integration:
        return {
            "connected": False,
            "calendar_id": None,
            "sync_enabled": False,
            "check_conflicts": False,
        }

    return {
        "connected": integration.is_active,
        "calendar_id": integration.calendar_id if integration.is_active else None,
        "sync_enabled": integration.sync_enabled if integration.is_active else False,
        "check_conflicts": integration.check_conflicts
        if integration.is_active
        else False,
    }


@router.patch("/settings")
async def update_calendar_settings(
    workspace_id: UUID,
    sync_enabled: Optional[bool] = None,
    check_conflicts: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Update calendar settings (sync and conflict checking)"""
    from sqlalchemy import select
    from app.models.calendar_integration import CalendarIntegration

    result = await db.execute(
        select(CalendarIntegration).where(
            CalendarIntegration.workspace_id == workspace_id,
            CalendarIntegration.is_active == True,
        )
    )
    integration = result.scalar_one_or_none()

    if not integration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Calendar not connected"
        )

    if sync_enabled is not None:
        integration.sync_enabled = sync_enabled

    if check_conflicts is not None:
        integration.check_conflicts = check_conflicts

    await db.commit()

    return {
        "success": True,
        "message": "Settings updated",
        "sync_enabled": integration.sync_enabled,
        "check_conflicts": integration.check_conflicts,
    }


@router.delete("/disconnect", status_code=status.HTTP_200_OK)
async def disconnect_calendar(
    workspace_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Disconnect Google Calendar"""
    service = CalendarService(db)
    success = await service.disconnect_calendar(workspace_id)

    if success:
        return {"success": True, "message": "Calendar disconnected"}
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Calendar not connected"
        )


@router.get("/events")
async def get_calendar_events(
    workspace_id: UUID,
    start: str = Query(..., description="Start time (ISO format)"),
    end: str = Query(..., description="End time (ISO format)"),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Get events from Google Calendar (for admin view)"""
    from datetime import datetime
    from sqlalchemy import select
    from app.models.calendar_integration import CalendarIntegration

    result = await db.execute(
        select(CalendarIntegration).where(
            CalendarIntegration.workspace_id == workspace_id,
            CalendarIntegration.is_active == True,
        )
    )
    integration = result.scalar_one_or_none()

    if not integration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Calendar not connected"
        )

    service = CalendarService(db)

    try:
        start_time = datetime.fromisoformat(start.replace("Z", "+00:00"))
        end_time = datetime.fromisoformat(end.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use ISO 8601 format.",
        )

    events = await service.get_calendar_events(integration, start_time, end_time)

    return {"events": events}


@router.get("/check-conflicts", response_model=CalendarConflict)
async def check_time_conflicts(
    workspace_id: UUID,
    start: str = Query(..., description="Start time (ISO format)"),
    end: str = Query(..., description="End time (ISO format)"),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Check if time range conflicts with calendar events"""
    from datetime import datetime

    service = CalendarService(db)

    try:
        start_time = datetime.fromisoformat(start.replace("Z", "+00:00"))
        end_time = datetime.fromisoformat(end.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use ISO 8601 format.",
        )

    conflicts = await service.check_calendar_conflicts(
        workspace_id, start_time, end_time
    )

    return {"has_conflict": len(conflicts) > 0, "conflicts": conflicts}
