# app/schemas/inventory.py
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional, List


class InventoryItemCreate(BaseModel):
    """Create an inventory item"""

    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    unit: str = Field(default="units", max_length=50)
    quantity: float = Field(default=0, ge=0)
    low_stock_threshold: float = Field(default=5, ge=0)
    vendor_email: Optional[str] = None


class InventoryItemUpdate(BaseModel):
    """Update an inventory item"""

    name: Optional[str] = None
    description: Optional[str] = None
    unit: Optional[str] = None
    quantity: Optional[float] = None
    low_stock_threshold: Optional[float] = None
    is_active: Optional[bool] = None
    vendor_email: Optional[str] = None


class InventoryItemOut(BaseModel):
    """Inventory item response"""

    id: UUID
    workspace_id: UUID
    name: str
    description: Optional[str]
    unit: str
    quantity: float
    low_stock_threshold: float
    vendor_email: Optional[str] = None
    is_active: bool
    is_low_stock: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class InventoryUsageCreate(BaseModel):
    """Record inventory usage"""

    item_id: UUID
    booking_id: Optional[UUID] = None
    quantity_used: float = Field(..., gt=0)
    notes: Optional[str] = None


class InventoryUsageOut(BaseModel):
    """Inventory usage record response"""

    id: UUID
    item_id: UUID
    booking_id: Optional[UUID]
    workspace_id: UUID
    quantity_used: float
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class LowStockAlert(BaseModel):
    """Low stock alert"""

    item_id: UUID
    item_name: str
    current_quantity: float
    threshold: float
    unit: str
