# app/services/lead_service.py
"""
Lead Management Service

Handles lead creation, tracking, and lifecycle management.
"""

import logging
from typing import Optional, List
from uuid import UUID
from datetime import datetime, UTC

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, and_, or_
from fastapi import HTTPException, status

from app.models.lead import Lead, LeadActivity, LeadStatus, LeadSource
from app.models.contact import Contact
from app.schemas.leads import LeadCreate, LeadUpdate, LeadActivityCreate

logger = logging.getLogger(__name__)


async def create_lead(db: AsyncSession, workspace_id: UUID, data: LeadCreate) -> Lead:
    """Create a new lead"""

    # Verify contact exists
    result = await db.execute(
        select(Contact).where(
            Contact.id == data.contact_id, Contact.workspace_id == workspace_id
        )
    )
    contact = result.scalar_one_or_none()

    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found"
        )

    # Create lead
    lead = Lead(
        workspace_id=workspace_id,
        contact_id=data.contact_id,
        source=data.source,
        source_detail=data.source_detail,
        form_data=data.form_data,
        status=LeadStatus.NEW,
        estimated_value=data.estimated_value,
        notes=data.notes,
    )

    db.add(lead)
    await db.flush()

    # Create initial activity
    activity = LeadActivity(
        lead_id=lead.id,
        workspace_id=workspace_id,
        activity_type="form_submission",
        description=f"New lead submitted via {data.source.value}",
    )
    db.add(activity)

    await db.commit()
    await db.refresh(lead)

    return lead


async def get_lead(
    db: AsyncSession, lead_id: UUID, workspace_id: UUID
) -> Optional[Lead]:
    """Get a lead by ID"""
    result = await db.execute(
        select(Lead).where(Lead.id == lead_id, Lead.workspace_id == workspace_id)
    )
    return result.scalar_one_or_none()


async def list_leads(
    db: AsyncSession,
    workspace_id: UUID,
    status: Optional[LeadStatus] = None,
    source: Optional[LeadSource] = None,
    assigned_to: Optional[UUID] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    search: Optional[str] = None,
    page: int = 1,
    per_page: int = 20,
) -> tuple[List[Lead], int]:
    """List leads with filters"""

    query = select(Lead).where(Lead.workspace_id == workspace_id)

    # Apply filters
    if status:
        query = query.where(Lead.status == status)

    if source:
        query = query.where(Lead.source == source)

    if assigned_to:
        query = query.where(Lead.assigned_to_user_id == assigned_to)

    if date_from:
        query = query.where(Lead.submitted_at >= date_from)

    if date_to:
        query = query.where(Lead.submitted_at <= date_to)

    if search:
        # Search in contact name, email, notes
        query = query.join(Contact).where(
            or_(
                Contact.name.ilike(f"%{search}%"),
                Contact.email.ilike(f"%{search}%"),
                Lead.notes.ilike(f"%{search}%"),
            )
        )

    # Get total count
    count_query = select(func.count(Lead.id)).where(Lead.workspace_id == workspace_id)
    if status:
        count_query = count_query.where(Lead.status == status)

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Apply pagination
    query = query.order_by(desc(Lead.submitted_at))
    query = query.offset((page - 1) * per_page).limit(per_page)

    result = await db.execute(query)
    leads = result.scalars().all()

    return list(leads), total


async def update_lead(
    db: AsyncSession,
    lead_id: UUID,
    workspace_id: UUID,
    data: LeadUpdate,
    user_id: Optional[UUID] = None,
) -> Lead:
    """Update a lead"""

    lead = await get_lead(db, lead_id, workspace_id)

    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found"
        )

    old_status = lead.status

    # Update fields
    if data.status and data.status != lead.status:
        lead.status = data.status

        # Track status change
        if data.status == LeadStatus.CONTACTED and not lead.first_contacted_at:
            lead.first_contacted_at = datetime.now(UTC)

        if data.status == LeadStatus.CONVERTED and not lead.converted_at:
            lead.converted_at = datetime.now(UTC)

        # Create activity
        activity = LeadActivity(
            lead_id=lead.id,
            workspace_id=workspace_id,
            activity_type="status_change",
            description=f"Status changed from {old_status.value} to {data.status.value}",
            performed_by_user_id=user_id,
            old_status=old_status,
            new_status=data.status,
        )
        db.add(activity)

    if data.assigned_to_user_id is not None:
        lead.assigned_to_user_id = data.assigned_to_user_id

        activity = LeadActivity(
            lead_id=lead.id,
            workspace_id=workspace_id,
            activity_type="assignment",
            description="Lead assigned",
            performed_by_user_id=user_id,
        )
        db.add(activity)

    if data.estimated_value is not None:
        lead.estimated_value = data.estimated_value

    if data.notes is not None:
        lead.notes = data.notes

    await db.commit()
    await db.refresh(lead)

    return lead


async def add_lead_activity(
    db: AsyncSession,
    lead_id: UUID,
    workspace_id: UUID,
    data: LeadActivityCreate,
    user_id: Optional[UUID] = None,
) -> LeadActivity:
    """Add activity to a lead"""

    lead = await get_lead(db, lead_id, workspace_id)

    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found"
        )

    activity = LeadActivity(
        lead_id=lead_id,
        workspace_id=workspace_id,
        activity_type=data.activity_type,
        description=data.description,
        performed_by_user_id=user_id,
        old_status=data.old_status,
        new_status=data.new_status,
    )

    db.add(activity)
    await db.commit()
    await db.refresh(activity)

    return activity


async def get_lead_activities(
    db: AsyncSession, lead_id: UUID, workspace_id: UUID
) -> List[LeadActivity]:
    """Get all activities for a lead"""

    result = await db.execute(
        select(LeadActivity)
        .where(
            LeadActivity.lead_id == lead_id, LeadActivity.workspace_id == workspace_id
        )
        .order_by(desc(LeadActivity.created_at))
    )

    return list(result.scalars().all())


async def get_lead_stats(db: AsyncSession, workspace_id: UUID) -> dict:
    """Get lead statistics"""

    # Count by status
    result = await db.execute(
        select(Lead.status, func.count(Lead.id))
        .where(Lead.workspace_id == workspace_id)
        .group_by(Lead.status)
    )

    status_counts = {status.value: 0 for status in LeadStatus}
    for row in result.fetchall():
        status_counts[row[0]] = row[1]

    total = sum(status_counts.values())
    converted = status_counts.get(LeadStatus.CONVERTED.value, 0)
    conversion_rate = (converted / total * 100) if total > 0 else 0

    return {
        "total_leads": total,
        "new_leads": status_counts.get(LeadStatus.NEW.value, 0),
        "contacted_leads": status_counts.get(LeadStatus.CONTACTED.value, 0),
        "qualified_leads": status_counts.get(LeadStatus.QUALIFIED.value, 0),
        "converted_leads": converted,
        "lost_leads": status_counts.get(LeadStatus.LOST.value, 0),
        "conversion_rate": round(conversion_rate, 2),
    }


async def delete_lead(db: AsyncSession, lead_id: UUID, workspace_id: UUID) -> bool:
    """Delete a lead"""

    lead = await get_lead(db, lead_id, workspace_id)

    if not lead:
        return False

    await db.delete(lead)
    await db.commit()

    return True
