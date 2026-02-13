# app/routers/leads.py
"""
Lead Management Router

Handles lead CRUD, assignment, and activity tracking.
"""

from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Optional, List

from app.database import get_db
from app.dependencies import require_permission, get_current_user
from app.models.user import User
from app.models.lead import LeadStatus, LeadSource
from app.schemas.leads import (
    LeadCreate,
    LeadUpdate,
    LeadOut,
    LeadListResponse,
    LeadStats,
    LeadActivityCreate,
    LeadActivityOut,
    LeadWithActivities,
    LeadFilter,
)
from app.services.lead_service import (
    create_lead,
    get_lead,
    list_leads,
    update_lead,
    add_lead_activity,
    get_lead_activities,
    get_lead_stats,
    delete_lead,
)

router = APIRouter(prefix="/workspaces/{workspace_id}/leads", tags=["Leads"])


@router.get("", response_model=LeadListResponse)
async def get_leads(
    workspace_id: UUID,
    status: Optional[LeadStatus] = Query(None, description="Filter by status"),
    source: Optional[LeadSource] = Query(None, description="Filter by source"),
    assigned_to: Optional[UUID] = Query(None, description="Filter by assigned user"),
    search: Optional[str] = Query(None, description="Search in name/email/notes"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("leads")),
):
    """List all leads with filtering and pagination"""
    leads, total = await list_leads(
        db=db,
        workspace_id=workspace_id,
        status=status,
        source=source,
        assigned_to=assigned_to,
        search=search,
        page=page,
        per_page=per_page,
    )

    return {"leads": leads, "total": total, "page": page, "per_page": per_page}


@router.post("", response_model=LeadOut, status_code=status.HTTP_201_CREATED)
async def create_new_lead(
    workspace_id: UUID,
    data: LeadCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("leads")),
):
    """Create a new lead (manual entry)"""
    return await create_lead(db, workspace_id, data)


@router.get("/stats", response_model=LeadStats)
async def get_statistics(
    workspace_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("leads")),
):
    """Get lead statistics"""
    return await get_lead_stats(db, workspace_id)


@router.get("/{lead_id}", response_model=LeadWithActivities)
async def get_lead_detail(
    workspace_id: UUID,
    lead_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("leads")),
):
    """Get a lead with all activities"""
    lead = await get_lead(db, lead_id, workspace_id)

    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found"
        )

    activities = await get_lead_activities(db, lead_id, workspace_id)

    return {"lead": lead, "activities": activities}


@router.patch("/{lead_id}", response_model=LeadOut)
async def update_lead_detail(
    workspace_id: UUID,
    lead_id: UUID,
    data: LeadUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("leads")),
):
    """Update a lead"""
    return await update_lead(db, lead_id, workspace_id, data, user.id)


@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lead_detail(
    workspace_id: UUID,
    lead_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("leads")),
):
    """Delete a lead"""
    success = await delete_lead(db, lead_id, workspace_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found"
        )

    return None


@router.post(
    "/{lead_id}/activities",
    response_model=LeadActivityOut,
    status_code=status.HTTP_201_CREATED,
)
async def add_activity(
    workspace_id: UUID,
    lead_id: UUID,
    data: LeadActivityCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("leads")),
):
    """Add an activity to a lead"""
    return await add_lead_activity(db, lead_id, workspace_id, data, user.id)


@router.get("/{lead_id}/activities", response_model=List[LeadActivityOut])
async def get_activities(
    workspace_id: UUID,
    lead_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("leads")),
):
    """Get all activities for a lead"""
    return await get_lead_activities(db, lead_id, workspace_id)


@router.post("/{lead_id}/assign/{user_id}", response_model=LeadOut)
async def assign_lead(
    workspace_id: UUID,
    lead_id: UUID,
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("leads")),
):
    """Assign a lead to a user"""
    return await update_lead(
        db,
        lead_id,
        workspace_id,
        LeadUpdate(assigned_to_user_id=user_id),
        current_user.id,
    )


@router.post("/{lead_id}/convert", response_model=LeadOut)
async def convert_lead(
    workspace_id: UUID,
    lead_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("leads")),
):
    """Mark a lead as converted"""
    return await update_lead(
        db, lead_id, workspace_id, LeadUpdate(status=LeadStatus.CONVERTED), user.id
    )


@router.post("/{lead_id}/contact", response_model=LeadOut)
async def mark_contacted(
    workspace_id: UUID,
    lead_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("leads")),
):
    """Mark a lead as contacted"""
    return await update_lead(
        db, lead_id, workspace_id, LeadUpdate(status=LeadStatus.CONTACTED), user.id
    )
