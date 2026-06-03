from typing import Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel


class WorkOrderItemCreate(BaseModel):
    service_id: UUID
    quantity: int = 1
    unit_price: Decimal
    notes: Optional[str] = None


class WorkOrderPartCreate(BaseModel):
    name: str
    part_number: Optional[str] = None
    quantity: int = 1
    unit_price: Decimal


class WorkOrderCreate(BaseModel):
    client_id: UUID
    vehicle_id: UUID
    mechanic_id: Optional[UUID] = None
    description: Optional[str] = None
    items: list[WorkOrderItemCreate] = []
    parts: list[WorkOrderPartCreate] = []


class WorkOrderUpdate(BaseModel):
    status: Optional[str] = None
    mechanic_id: Optional[UUID] = None
    description: Optional[str] = None


class WorkOrderOut(BaseModel):
    id: UUID
    order_number: str
    client_id: UUID
    vehicle_id: UUID
    mechanic_id: Optional[UUID]
    status: str
    description: Optional[str] = None
    total_amount: Decimal
    created_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
