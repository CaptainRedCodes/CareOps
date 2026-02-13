# app/routers/contacts.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List, Optional

from app.database import get_db
from app.dependencies import require_workspace_member
from app.models.user import User
from app.schemas.contact import ContactOut, ContactUpdate
from app.services.contact_service import (
    list_contacts as svc_list_contacts,
    get_contact as svc_get_contact,
    update_contact as svc_update_contact,
)


router = APIRouter(prefix="/workspaces/{workspace_id}/contacts", tags=["Contacts"])


@router.get("", response_model=List[ContactOut])
async def list_contacts(
    workspace_id: UUID,
    status: Optional[str] = Query(None, description="Filter by status"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_workspace_member),
):
    """List all contacts for workspace (requires workspace membership)"""
    return await svc_list_contacts(db, workspace_id, status)


@router.get("/{contact_id}", response_model=ContactOut)
async def get_contact(
    workspace_id: UUID,
    contact_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_workspace_member),
):
    """Get a specific contact (requires workspace membership)"""
    return await svc_get_contact(db, workspace_id, contact_id)


@router.patch("/{contact_id}", response_model=ContactOut)
async def update_contact(
    workspace_id: UUID,
    contact_id: UUID,
    data: ContactUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_workspace_member),
):
    """Update a contact (requires workspace membership)"""
    return await svc_update_contact(db, workspace_id, contact_id, data)
