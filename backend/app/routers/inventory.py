# app/routers/inventory.py
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List, Optional

from app.database import get_db
from app.dependencies import require_admin, require_permission
from app.models.user import User
from app.schemas.inventory import (
    InventoryItemCreate,
    InventoryItemUpdate,
    InventoryItemOut,
    InventoryUsageCreate,
    InventoryUsageOut,
    LowStockAlert,
)
from app.services.inventory_service import (
    create_inventory_item,
    list_inventory_items,
    get_inventory_item,
    update_inventory_item,
    delete_inventory_item,
    record_usage,
    get_low_stock_alerts,
    get_usage_history,
)


router = APIRouter(prefix="/workspaces/{workspace_id}/inventory", tags=["Inventory"])


@router.post(
    "/items", response_model=InventoryItemOut, status_code=status.HTTP_201_CREATED
)
async def create_item(
    workspace_id: UUID,
    data: InventoryItemCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Create a new inventory item (admin only)"""
    return await create_inventory_item(db, workspace_id, data)


@router.get("/items", response_model=List[InventoryItemOut])
async def list_items(
    workspace_id: UUID,
    active_only: bool = Query(True),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("inventory")),
):
    """List inventory items (requires inventory permission)"""
    return await list_inventory_items(db, workspace_id, active_only)


@router.get("/items/{item_id}", response_model=InventoryItemOut)
async def get_item(
    workspace_id: UUID,
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("inventory")),
):
    """Get a specific inventory item (requires inventory permission)"""
    return await get_inventory_item(db, item_id, workspace_id)


@router.put("/items/{item_id}", response_model=InventoryItemOut)
async def update_item(
    workspace_id: UUID,
    item_id: UUID,
    data: InventoryItemUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Update an inventory item (admin only)"""
    return await update_inventory_item(db, item_id, workspace_id, data)


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    workspace_id: UUID,
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Delete an inventory item (admin only)"""
    await delete_inventory_item(db, item_id, workspace_id)


@router.post(
    "/usage", response_model=InventoryUsageOut, status_code=status.HTTP_201_CREATED
)
async def record_item_usage(
    workspace_id: UUID,
    data: InventoryUsageCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("inventory")),
):
    """Record inventory usage (deducts from stock, requires inventory permission)"""
    return await record_usage(db, workspace_id, data)


@router.get("/usage", response_model=List[InventoryUsageOut])
async def get_usage(
    workspace_id: UUID,
    item_id: Optional[UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("inventory")),
):
    """Get usage history (requires inventory permission)"""
    return await get_usage_history(db, workspace_id, item_id)


@router.get("/alerts", response_model=List[LowStockAlert])
async def get_alerts(
    workspace_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("inventory")),
):
    """Get low stock alerts (requires inventory permission)"""
    return await get_low_stock_alerts(db, workspace_id)
