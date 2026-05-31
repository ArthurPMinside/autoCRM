from sqlalchemy import Column, String, DateTime, Numeric, Text, ForeignKey
from app.models.base import Base, GUID
from datetime import datetime

class Receipt(Base):
    __tablename__ = "receipts"
    
    id = GUID()
    work_order_id = Column(String(36), ForeignKey("work_orders.id"), nullable=False)
    items = Column(Text)
    total = Column(Numeric(10, 2), default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
