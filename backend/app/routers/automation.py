# app/routers/automation.py
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.user import User
from app.schemas.automation import (
    AutomationRuleCreate,
    AutomationRuleUpdate,
    AutomationRuleOut,
    AutomationLogOut,
)
from app.services import automation_service

router = APIRouter(prefix="/workspaces/{workspace_id}/automation", tags=["Automation"])


@router.get("/rules", response_model=List[AutomationRuleOut])
async def list_automation_rules(
    workspace_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List all automation rules for workspace."""
    return await automation_service.list_automation_rules(db, workspace_id)


@router.post(
    "/rules", response_model=AutomationRuleOut, status_code=status.HTTP_201_CREATED
)
async def create_automation_rule(
    workspace_id: UUID,
    data: AutomationRuleCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Create a new automation rule (admin only)."""
    return await automation_service.create_automation_rule(db, workspace_id, data)


@router.get("/rules/{rule_id}", response_model=AutomationRuleOut)
async def get_automation_rule(
    workspace_id: UUID,
    rule_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get a single automation rule."""
    rule = await automation_service.get_automation_rule(db, rule_id, workspace_id)
    if not rule:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Automation rule not found")
    return rule


@router.put("/rules/{rule_id}", response_model=AutomationRuleOut)
async def update_automation_rule(
    workspace_id: UUID,
    rule_id: UUID,
    data: AutomationRuleUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Update an automation rule (admin only)."""
    rule = await automation_service.update_automation_rule(
        db, rule_id, workspace_id, data
    )
    if not rule:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Automation rule not found")
    return rule


@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_automation_rule(
    workspace_id: UUID,
    rule_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Delete an automation rule (admin only)."""
    success = await automation_service.delete_automation_rule(db, rule_id, workspace_id)
    if not success:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Automation rule not found")


@router.get("/logs", response_model=List[AutomationLogOut])
async def list_automation_logs(
    workspace_id: UUID,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List automation logs for workspace."""
    return await automation_service.list_automation_logs(db, workspace_id, limit)
