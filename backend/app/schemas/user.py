from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


class UserBase(BaseModel):
    email: str
    name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserOut(UserBase):
    id: UUID
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
