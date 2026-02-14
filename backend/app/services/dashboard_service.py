from uuid import UUID
from datetime import datetime, timedelta, UTC
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, case, extract
from fastapi import HTTPException, status
from pydantic import BaseModel
from enum import Enum

# Import models needed for queries
from app.models.booking import Booking, BookingType
from app.models.contact import Contact
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.workspace_form import WorkspaceForm, FormSubmission
from app.models.inventory import InventoryItem, InventoryUsage


class DashboardResponse(BaseModel):
    """Main dashboard response"""

    workspace_id: str
    generated_at: datetime

    # Booking Overview
    today_bookings: int
    upcoming_bookings: int
    completed_bookings: int
    no_show_bookings: int
    cancelled_bookings: int
    pending_forms_bookings: int

    # Leads & Conversations
    new_inquiries: int
    ongoing_conversations: int
    unread_messages: int

    # Forms Status
    pending_forms: int
    overdue_forms: int
    completed_forms: int
    blocked_bookings: int

    # Inventory
    low_stock_items: int
    critical_stock_items: int
    recent_inventory_updates: int

    # Critical Alerts
    missed_messages: int
    overdue_forms_count: int
    unconfirmed_bookings: int
    low_inventory_count: int

    # Detailed lists
    today_bookings_list: list[dict]
    upcoming_bookings_list: list[dict]
    low_stock_items_list: list[dict]
    overdue_forms_list: list[dict]

    # Alerts
    alerts: list[dict]


import asyncio


async def get_dashboard_summary(
    db: AsyncSession,
    workspace_id: UUID,
) -> DashboardResponse:
    """
    Get complete dashboard summary with all metrics.

    Uses asyncio.gather to run independent query groups concurrently.
    """
    now = datetime.now(UTC)

    # Run independent metric groups concurrently
    (
        booking_metrics,
        conversation_metrics,
        form_metrics,
        inventory_metrics,
        lists,
    ) = await asyncio.gather(
        _get_booking_metrics(db, workspace_id, now),
        _get_conversation_metrics(db, workspace_id, now),
        _get_form_metrics(db, workspace_id, now),
        _get_inventory_metrics(db, workspace_id, now),
        _get_detailed_lists(db, workspace_id, now),
    )

    # Build alerts
    alerts = []

    missed_msg = conversation_metrics["missed_messages"]
    if missed_msg > 0:
        alerts.append(
            {
                "type": "missed_messages",
                "severity": "high",
                "count": missed_msg,
                "message": f"{missed_msg} conversations need staff reply",
                "action_url": f"/workspace/{workspace_id}/communication",
            }
        )

    overdue = form_metrics["overdue_forms"]
    if overdue > 0:
        alerts.append(
            {
                "type": "overdue_forms",
                "severity": "high",
                "count": overdue,
                "message": f"{overdue} forms are overdue",
                "action_url": f"/workspace/{workspace_id}/forms",
            }
        )

    unconfirmed = booking_metrics["unconfirmed_bookings"]
    if unconfirmed > 0:
        alerts.append(
            {
                "type": "unconfirmed_bookings",
                "severity": "medium",
                "count": unconfirmed,
                "message": f"{unconfirmed} bookings unconfirmed",
                "action_url": f"/workspace/{workspace_id}/bookings",
            }
        )

    low_inv = inventory_metrics["low_stock_items"]
    if low_inv > 0:
        alerts.append(
            {
                "type": "low_inventory",
                "severity": "high",
                "count": low_inv,
                "message": f"{low_inv} items are low on stock",
                "action_url": f"/workspace/{workspace_id}/inventory",
            }
        )

    return DashboardResponse(
        workspace_id=str(workspace_id),
        generated_at=now,
        # Booking Overview
        **booking_metrics,
        # Leads & Conversations
        **conversation_metrics,
        # Forms Status
        **form_metrics,
        blocked_bookings=booking_metrics["pending_forms_bookings"],
        overdue_forms_count=form_metrics["overdue_forms"],
        # Inventory
        **inventory_metrics,
        low_inventory_count=inventory_metrics["low_stock_items"],
        # Detailed lists
        **lists,
        # Alerts
        alerts=alerts,
    )


async def _get_booking_metrics(
    db: AsyncSession, workspace_id: UUID, now: datetime
) -> dict:
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    yesterday = now - timedelta(days=1)

    queries = {
        "today_bookings": select(func.count(Booking.id)).where(
            Booking.workspace_id == workspace_id,
            Booking.start_time >= today_start,
            Booking.start_time < today_end,
        ),
        "upcoming_bookings": select(func.count(Booking.id)).where(
            Booking.workspace_id == workspace_id,
            Booking.start_time >= now,
            Booking.status.in_(["scheduled", "confirmed"]),
        ),
        "completed_bookings": select(func.count(Booking.id)).where(
            Booking.workspace_id == workspace_id,
            Booking.status == "completed",
        ),
        "no_show_bookings": select(func.count(Booking.id)).where(
            Booking.workspace_id == workspace_id,
            Booking.status == "no_show",
        ),
        "cancelled_bookings": select(func.count(Booking.id)).where(
            Booking.workspace_id == workspace_id,
            Booking.status == "cancelled",
        ),
        "pending_forms_bookings": select(
            func.count(func.distinct(FormSubmission.booking_id))
        )
        .join(Booking, FormSubmission.booking_id == Booking.id)
        .where(
            Booking.workspace_id == workspace_id,
            FormSubmission.status == "pending",
        ),
        "unconfirmed_bookings": select(func.count(Booking.id)).where(
            Booking.workspace_id == workspace_id,
            Booking.status == "scheduled",
            Booking.created_at < yesterday,
        ),
    }

    results = {}
    for key, query in queries.items():
        res = await db.execute(query)
        results[key] = res.scalar() or 0

    return results


async def _get_conversation_metrics(
    db: AsyncSession, workspace_id: UUID, now: datetime
) -> dict:
    hour_ago = now - timedelta(hours=1)
    day_ago = now - timedelta(days=1)

    queries = {
        "new_inquiries": select(func.count(Conversation.id)).where(
            Conversation.workspace_id == workspace_id,
            Conversation.status == "active",
            Conversation.automation_paused == False,
        ),
        "ongoing_conversations": select(func.count(Conversation.id)).where(
            Conversation.workspace_id == workspace_id,
            Conversation.status == "active",
        ),
        "unread_messages": select(func.count(Message.id))
        .join(Conversation, Message.conversation_id == Conversation.id)
        .where(
            Conversation.workspace_id == workspace_id,
            Message.direction == "inbound",
            Message.is_read == False,
        ),
    }

    results = {}
    for key, query in queries.items():
        res = await db.execute(query)
        results[key] = res.scalar() or 0

    # Missed messages: unread inbound messages from more than 1 hour ago (needs attention)
    missed_query = (
        select(func.count(Message.id))
        .join(Conversation, Message.conversation_id == Conversation.id)
        .where(
            Conversation.workspace_id == workspace_id,
            Message.direction == "inbound",
            Message.is_read == False,
            Message.created_at < hour_ago,
        )
    )
    res = await db.execute(missed_query)
    results["missed_messages"] = res.scalar() or 0
    return results


async def _get_form_metrics(
    db: AsyncSession, workspace_id: UUID, now: datetime
) -> dict:
    yesterday = now - timedelta(days=1)
    week_ago = now - timedelta(days=7)

    queries = {
        "pending_forms": select(func.count(FormSubmission.id))
        .join(Booking, FormSubmission.booking_id == Booking.id)
        .where(
            Booking.workspace_id == workspace_id,
            FormSubmission.status == "pending",
        ),
        "overdue_forms": select(func.count(FormSubmission.id))
        .join(Booking, FormSubmission.booking_id == Booking.id)
        .where(
            Booking.workspace_id == workspace_id,
            FormSubmission.status == "pending",
            FormSubmission.created_at < yesterday,
        ),
        "completed_forms": select(func.count(FormSubmission.id))
        .join(Booking, FormSubmission.booking_id == Booking.id)
        .where(
            Booking.workspace_id == workspace_id,
            FormSubmission.status == "completed",
            FormSubmission.submitted_at >= week_ago,
        ),
    }

    results = {}
    for key, query in queries.items():
        res = await db.execute(query)
        results[key] = res.scalar() or 0

    return results


async def _get_inventory_metrics(
    db: AsyncSession, workspace_id: UUID, now: datetime
) -> dict:
    day_ago = now - timedelta(days=1)

    queries = {
        "low_stock_items": select(func.count(InventoryItem.id)).where(
            InventoryItem.workspace_id == workspace_id,
            InventoryItem.is_active == True,
            InventoryItem.quantity <= InventoryItem.low_stock_threshold,
            InventoryItem.quantity > 0,
        ),
        "critical_stock_items": select(func.count(InventoryItem.id)).where(
            InventoryItem.workspace_id == workspace_id,
            InventoryItem.is_active == True,
            InventoryItem.quantity <= InventoryItem.low_stock_threshold / 2,
        ),
        "recent_inventory_updates": select(func.count(InventoryUsage.id)).where(
            InventoryUsage.workspace_id == workspace_id,
            InventoryUsage.created_at >= day_ago,
        ),
    }

    results = {}
    for key, query in queries.items():
        res = await db.execute(query)
        results[key] = res.scalar() or 0

    return results


async def _get_detailed_lists(
    db: AsyncSession, workspace_id: UUID, now: datetime
) -> dict:
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    yesterday = now - timedelta(days=1)

    # Today's bookings
    today_res = await db.execute(
        select(
            Booking.id,
            Booking.start_time,
            Booking.status,
            Booking.readiness_status,
            Contact.name.label("contact_name"),
            BookingType.name.label("booking_type_name"),
        )
        .select_from(Booking)
        .join(Contact, Booking.contact_id == Contact.id)
        .join(BookingType, Booking.booking_type_id == BookingType.id)
        .where(
            Booking.workspace_id == workspace_id,
            Booking.start_time >= today_start,
            Booking.start_time < today_end,
        )
        .order_by(Booking.start_time)
        .limit(20)
    )

    # Upcoming bookings
    upcoming_res = await db.execute(
        select(
            Booking.id,
            Booking.start_time,
            Booking.status,
            Booking.readiness_status,
            Contact.name.label("contact_name"),
            BookingType.name.label("booking_type_name"),
        )
        .select_from(Booking)
        .join(Contact, Booking.contact_id == Contact.id)
        .join(BookingType, Booking.booking_type_id == BookingType.id)
        .where(
            Booking.workspace_id == workspace_id,
            Booking.start_time >= now,
            Booking.status.in_(["scheduled", "confirmed"]),
        )
        .order_by(Booking.start_time)
        .limit(10)
    )

    # Low stock
    low_stock_res = await db.execute(
        select(
            InventoryItem.id,
            InventoryItem.name,
            InventoryItem.quantity,
            InventoryItem.unit,
            InventoryItem.low_stock_threshold,
        )
        .select_from(InventoryItem)
        .where(
            InventoryItem.workspace_id == workspace_id,
            InventoryItem.is_active == True,
            InventoryItem.quantity <= InventoryItem.low_stock_threshold,
        )
        .order_by(InventoryItem.quantity)
        .limit(10)
    )

    # Overdue forms
    overdue_res = await db.execute(
        select(
            FormSubmission.id,
            FormSubmission.created_at,
            FormSubmission.status,
            WorkspaceForm.name.label("form_name"),
            Contact.name.label("contact_name"),
            Booking.start_time.label("booking_time"),
        )
        .select_from(FormSubmission)
        .join(WorkspaceForm, FormSubmission.form_id == WorkspaceForm.id)
        .join(Contact, FormSubmission.contact_id == Contact.id)
        .join(Booking, FormSubmission.booking_id == Booking.id)
        .where(
            FormSubmission.status == "pending", FormSubmission.created_at < yesterday
        )
        .order_by(FormSubmission.created_at)
        .limit(10)
    )

    return {
        "today_bookings_list": [
            {
                "id": str(r.id),
                "start_time": r.start_time.isoformat() if r.start_time else None,
                "status": r.status,
                "readiness_status": r.readiness_status,
                "contact_name": r.contact_name,
                "booking_type_name": r.booking_type_name,
            }
            for r in today_res.fetchall()
        ],
        "upcoming_bookings_list": [
            {
                "id": str(r.id),
                "start_time": r.start_time.isoformat() if r.start_time else None,
                "status": r.status,
                "readiness_status": r.readiness_status,
                "contact_name": r.contact_name,
                "booking_type_name": r.booking_type_name,
            }
            for r in upcoming_res.fetchall()
        ],
        "low_stock_items_list": [
            {
                "id": str(r.id),
                "name": r.name,
                "quantity": r.quantity,
                "unit": r.unit,
                "threshold": r.low_stock_threshold,
            }
            for r in low_stock_res.fetchall()
        ],
        "overdue_forms_list": [
            {
                "id": str(r.id),
                "form_name": r.form_name,
                "contact_name": r.contact_name,
                "booking_time": r.booking_time.isoformat() if r.booking_time else None,
                "pending_since": r.created_at.isoformat() if r.created_at else None,
            }
            for r in overdue_res.fetchall()
        ],
    }
