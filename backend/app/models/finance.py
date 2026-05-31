import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Numeric, Text, Enum

from app.models.base import Base, GUID
import enum


class PaymentType(str, enum.Enum):
    CASH = "cash"
    CARD = "card"
    TRANSFER = "transfer"


class Payment(Base):
    __tablename__ = "payments"

    id = GUID()
    work_order_id = Column(String(36), ForeignKey("work_orders.id"), nullable=True, index=True)
    client_id = Column(String(36), ForeignKey("clients.id"), nullable=True)
    amount = Column(Numeric(12, 2), nullable=False)
    payment_type = Column(Enum(PaymentType), default=PaymentType.CASH, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class ExpenseCategory(str, enum.Enum):
    PARTS = "parts"
    SALARY = "salary"
    RENT = "rent"
    UTILITIES = "utilities"
    MARKETING = "marketing"
    OTHER = "other"


class Expense(Base):
    __tablename__ = "expenses"

    id = GUID()
    category = Column(Enum(ExpenseCategory), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
