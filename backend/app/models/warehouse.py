from sqlalchemy import Column, String, DateTime, Integer, Numeric, ForeignKey, Boolean
from app.models.base import Base, GUID
from datetime import datetime

class Part(Base):
    __tablename__ = "parts"
    
    id = GUID()
    name = Column(String(255), nullable=False)
    category = Column(String(100))
    quantity = Column(Integer, default=0)
    min_quantity = Column(Integer, default=5)
    price = Column(Numeric(10, 2), default=0)
    supplier = Column(String(255))
    location = Column(String(100))
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PartMovement(Base):
    __tablename__ = "part_movements"
    
    id = GUID()
    part_id = Column(String(36), ForeignKey("parts.id"), nullable=False)
    type = Column(String(10), nullable=False)
    quantity = Column(Integer, nullable=False)
    reason = Column(String(255))
    work_order_id = Column(String(36), ForeignKey("work_orders.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
