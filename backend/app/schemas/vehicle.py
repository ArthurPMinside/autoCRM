from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


class VehicleBase(BaseModel):
    make: str
    model: str
    year: Optional[int] = None
    license_plate: str
    vin: Optional[str] = None
    color: Optional[str] = None


class VehicleCreate(VehicleBase):
    client_id: UUID


class VehicleOut(VehicleBase):
    id: UUID
    client_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
