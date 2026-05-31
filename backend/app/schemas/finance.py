from typing import Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel
from app.models.finance import PaymentType, ExpenseCategory


class PaymentCreate(BaseModel):
    work_order_id: Optional[UUID] = None
    client_id: Optional[UUID] = None
    amount: Decimal
    payment_type: PaymentType = PaymentType.CASH
    description: Optional[str] = None


class PaymentOut(PaymentCreate):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class ExpenseCreate(BaseModel):
    category: ExpenseCategory
    amount: Decimal
    description: Optional[str] = None


class ExpenseOut(ExpenseCreate):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
