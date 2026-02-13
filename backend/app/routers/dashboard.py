from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, require_permission
from app.models.user import User
from app.services.dashboard_service import get_dashboard_summary

router = APIRouter(prefix="/workspaces/{workspace_id}/dashboard", tags=["Dashboard"])


@router.get("/summary")
async def get_dashboard(
    workspace_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("bookings")),
):
    """
    Get complete dashboard summary.

    This is a READ-ONLY endpoint that derives all data from database state.
    No side effects, no automation triggers.

    Metrics are derived from:
    - booking.created / booking.status_changed → booking status columns
    - form.completed → form_submission status
    - inventory.updated → inventory quantity
    - staff.replied → conversation.automation_paused
    """
    return await get_dashboard_summary(db, workspace_id)


@router.get("/bookings")
async def get_booking_metrics(
    workspace_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("bookings")),
):
    """Get booking-specific metrics"""
    from app.services.dashboard_service import get_dashboard_summary

    summary = await get_dashboard_summary(db, workspace_id)

    return {
        "today": summary.today_bookings,
        "upcoming": summary.upcoming_bookings,
        "completed": summary.completed_bookings,
        "no_shows": summary.no_show_bookings,
        "cancelled": summary.cancelled_bookings,
        "pending_forms": summary.pending_forms_bookings,
    }


@router.get("/conversations")
async def get_conversation_metrics(
    workspace_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("inbox")),
):
    """Get conversation/inbox metrics"""
    from app.services.dashboard_service import get_dashboard_summary

    summary = await get_dashboard_summary(db, workspace_id)

    return {
        "new_inquiries": summary.new_inquiries,
        "ongoing": summary.ongoing_conversations,
        "unread": summary.unread_messages,
    }


@router.get("/forms")
async def get_form_metrics(
    workspace_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("forms")),
):
    """Get form status metrics"""
    from app.services.dashboard_service import get_dashboard_summary

    summary = await get_dashboard_summary(db, workspace_id)

    return {
        "pending": summary.pending_forms,
        "overdue": summary.overdue_forms,
        "completed_recent": summary.completed_forms,
        "blocking_bookings": summary.blocked_bookings,
    }


@router.get("/inventory")
async def get_inventory_metrics(
    workspace_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("inventory")),
):
    """Get inventory metrics"""
    from app.services.dashboard_service import get_dashboard_summary

    summary = await get_dashboard_summary(db, workspace_id)

    return {
        "low_stock": summary.low_stock_items,
        "critical": summary.critical_stock_items,
        "recent_updates": summary.recent_inventory_updates,
    }


@router.get("/alerts")
async def get_critical_alerts(
    workspace_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("bookings")),
):
    """Get all critical alerts that need attention"""
    from app.services.dashboard_service import get_dashboard_summary

    summary = await get_dashboard_summary(db, workspace_id)

    alerts = []

    if summary.missed_messages > 0:
        alerts.append(
            {
                "type": "missed_messages",
                "severity": "high",
                "count": summary.missed_messages,
                "message": f"{summary.missed_messages} conversations need staff reply",
                "action_url": f"/workspace/{workspace_id}/communication",
            }
        )

    if summary.overdue_forms_count > 0:
        alerts.append(
            {
                "type": "overdue_forms",
                "severity": "high",
                "count": summary.overdue_forms_count,
                "message": f"{summary.overdue_forms_count} forms are overdue",
                "action_url": f"/workspace/{workspace_id}/forms",
            }
        )

    if summary.unconfirmed_bookings > 0:
        alerts.append(
            {
                "type": "unconfirmed_bookings",
                "severity": "medium",
                "count": summary.unconfirmed_bookings,
                "message": f"{summary.unconfirmed_bookings} bookings unconfirmed",
                "action_url": f"/workspace/{workspace_id}/bookings",
            }
        )

    if summary.low_inventory_count > 0:
        alerts.append(
            {
                "type": "low_inventory",
                "severity": "high",
                "count": summary.low_inventory_count,
                "message": f"{summary.low_inventory_count} items are low on stock",
                "action_url": f"/workspace/{workspace_id}/inventory",
            }
        )

    return {"alerts": alerts, "total": len(alerts)}
