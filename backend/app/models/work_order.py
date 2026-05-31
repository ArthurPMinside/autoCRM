from sqlalchemy import Column, String, DateTime, Numeric, Text, ForeignKey
from app.models.base import Base, GUID
from datetime import datetime

class WorkOrder(Base):
    __tablename__ = "work_orders"
    
    id = GUID()
    client_id = Column(String(36), ForeignKey("clients.id"), nullable=False)
    vehicle_id = Column(String(36), ForeignKey("vehicles.id"), nullable=False)
    service_id = Column(String(36), ForeignKey("services.id"), nullable=False)
    status = Column(String(20), default="pending")
    total_cost = Column(Numeric(10, 2), default=0)
    description = Column(Text)
    scheduled_date = Column(DateTime)
    completed_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
