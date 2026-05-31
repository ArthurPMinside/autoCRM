from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


class ClientBase(BaseModel):
    first_name: str
    last_name: str
    phone: str
    email: Optional[str] = None
    notes: Optional[str] = None


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None


class ClientOut(ClientBase):
    id: UUID
    total_visits: int
    total_revenue: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
