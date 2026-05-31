from sqlalchemy import Column, String, DateTime, Numeric, Text, ForeignKey
from app.models.base import Base, GUID
from datetime import datetime

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = GUID()
    type = Column(String(10), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    category = Column(String(100))
    description = Column(Text)
    date = Column(DateTime, default=datetime.utcnow)
    work_order_id = Column(String(36), ForeignKey("work_orders.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
