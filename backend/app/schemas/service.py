from typing import Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel


class ServiceBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: Decimal
    duration_minutes: int = 60
    category: Optional[str] = None


class ServiceCreate(ServiceBase):
    pass


class ServiceOut(ServiceBase):
    id: UUID
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
