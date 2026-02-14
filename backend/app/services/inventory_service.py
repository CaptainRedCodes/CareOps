# app/services/inventory_service.py
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.inventory import InventoryItem, InventoryUsage
from app.schemas.inventory import (
    InventoryItemCreate,
    InventoryItemUpdate,
    InventoryUsageCreate,
    LowStockAlert,
)


async def create_inventory_item(
    db: AsyncSession, workspace_id: UUID, data: InventoryItemCreate
) -> InventoryItem:
    """Create a new inventory item"""
    item = InventoryItem(workspace_id=workspace_id, **data.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


async def list_inventory_items(
    db: AsyncSession, workspace_id: UUID, active_only: bool = True
) -> list[InventoryItem]:
    """List all inventory items for a workspace"""
    query = select(InventoryItem).where(InventoryItem.workspace_id == workspace_id)

    if active_only:
        query = query.where(InventoryItem.is_active == True)

    result = await db.execute(query.order_by(InventoryItem.name))
    return result.scalars().all()


async def get_inventory_item(
    db: AsyncSession, item_id: UUID, workspace_id: UUID
) -> InventoryItem:
    """Get a specific inventory item"""
    result = await db.execute(
        select(InventoryItem).where(
            InventoryItem.id == item_id, InventoryItem.workspace_id == workspace_id
        )
    )
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Inventory item not found"
        )

    return item


async def update_inventory_item(
    db: AsyncSession, item_id: UUID, workspace_id: UUID, data: InventoryItemUpdate
) -> InventoryItem:
    """Update an inventory item"""
    item = await get_inventory_item(db, item_id, workspace_id)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)

    await db.commit()
    await db.refresh(item)
    return item


async def delete_inventory_item(db: AsyncSession, item_id: UUID, workspace_id: UUID):
    """Delete an inventory item"""
    item = await get_inventory_item(db, item_id, workspace_id)
    await db.delete(item)
    await db.commit()


async def record_usage(
    db: AsyncSession, workspace_id: UUID, data: InventoryUsageCreate
) -> InventoryUsage:
    """
    Record inventory usage and deduct from stock.
    Emits inventory.updated event for automation handlers.
    """
    item = await get_inventory_item(db, data.item_id, workspace_id)

    previous_quantity = item.quantity

    if item.quantity < data.quantity_used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient stock. Available: {item.quantity} {item.unit}",
        )

    # Check if this will cause low stock BEFORE deducting
    will_be_low = (item.quantity - data.quantity_used) <= item.low_stock_threshold

    # Deduct stock
    item.quantity -= data.quantity_used

    # Record usage
    usage = InventoryUsage(
        item_id=data.item_id,
        booking_id=data.booking_id,
        workspace_id=workspace_id,
        quantity_used=data.quantity_used,
        notes=data.notes,
    )
    db.add(usage)

    # =======================================================================
    # EVENT-DRIVEN: Emit inventory.updated event
    # Automation handlers will check thresholds and send alerts
    # =======================================================================
    from app.services.event_service import emit_inventory_updated

    await emit_inventory_updated(
        db=db,
        workspace_id=workspace_id,
        item_id=item.id,
        inventory_data={
            "item_name": item.name,
            "quantity_before": previous_quantity,
            "quantity_after": item.quantity,
            "quantity_used": data.quantity_used,
            "unit": item.unit,
            "low_stock_threshold": item.low_stock_threshold,
            "vendor_email": item.vendor_email,
            "booking_id": str(data.booking_id) if data.booking_id else None,
        },
    )

    # =======================================================================
    # Emit inventory.low event if stock falls below threshold
    # =======================================================================
    if will_be_low:
        from app.services.event_service import emit_inventory_low

        await emit_inventory_low(
            db=db,
            workspace_id=workspace_id,
            item_id=item.id,
            inventory_data={
                "item_name": item.name,
                "current_quantity": item.quantity,
                "threshold": item.low_stock_threshold,
                "unit": item.unit,
                "vendor_email": item.vendor_email,
            },
        )

    await db.commit()
    await db.refresh(usage)
    return usage


async def get_low_stock_alerts(
    db: AsyncSession, workspace_id: UUID
) -> list[LowStockAlert]:
    """Get all items below their low stock threshold"""
    result = await db.execute(
        select(InventoryItem).where(
            InventoryItem.workspace_id == workspace_id,
            InventoryItem.is_active == True,
            InventoryItem.quantity <= InventoryItem.low_stock_threshold,
        )
    )
    items = result.scalars().all()

    return [
        LowStockAlert(
            item_id=item.id,
            item_name=item.name,
            current_quantity=item.quantity,
            threshold=item.low_stock_threshold,
            unit=item.unit,
        )
        for item in items
    ]


async def get_usage_history(
    db: AsyncSession, workspace_id: UUID, item_id: UUID = None
) -> list[InventoryUsage]:
    """Get usage history, optionally filtered by item"""
    query = select(InventoryUsage).where(InventoryUsage.workspace_id == workspace_id)

    if item_id:
        query = query.where(InventoryUsage.item_id == item_id)

    result = await db.execute(query.order_by(InventoryUsage.created_at.desc()))
    return result.scalars().all()
