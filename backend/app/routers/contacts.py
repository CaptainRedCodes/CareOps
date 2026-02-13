# app/routers/contacts.py
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List, Optional

from app.database import get_db
from app.dependencies import require_workspace_member
from app.models.user import User
from app.models.contact import Contact
from app.schemas.contact import ContactOut, ContactUpdate


router = APIRouter(prefix="/workspaces/{workspace_id}/contacts", tags=["Contacts"])


@router.get("", response_model=List[ContactOut])
async def list_contacts(
    workspace_id: UUID,
    status: Optional[str] = Query(None, description="Filter by status"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_workspace_member),
):
    """List all contacts for workspace (requires workspace membership)"""
    query = select(Contact).where(Contact.workspace_id == workspace_id)

    if status:
        query = query.where(Contact.status == status)

    query = query.order_by(Contact.created_at.desc())

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{contact_id}", response_model=ContactOut)
async def get_contact(
    workspace_id: UUID,
    contact_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_workspace_member),
):
    """Get a specific contact (requires workspace membership)"""
    result = await db.execute(
        select(Contact).where(
            Contact.id == contact_id, Contact.workspace_id == workspace_id
        )
    )
    contact = result.scalar_one_or_none()

    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found"
        )

    return contact


@router.patch("/{contact_id}", response_model=ContactOut)
async def update_contact(
    workspace_id: UUID,
    contact_id: UUID,
    data: ContactUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_workspace_member),
):
    """Update a contact (requires workspace membership)"""
    result = await db.execute(
        select(Contact).where(
            Contact.id == contact_id, Contact.workspace_id == workspace_id
        )
    )
    contact = result.scalar_one_or_none()

    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found"
        )

    # Update fields
    for field, value in data.model_dump(exclude_unset=True).items():
        if field == "form_data" and value:
            import json

            value = json.dumps(value)
        setattr(contact, field, value)

    await db.commit()
    await db.refresh(contact)

    return contact