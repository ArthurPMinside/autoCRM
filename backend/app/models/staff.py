from sqlalchemy import Column, String, DateTime, Numeric, Boolean
from app.models.base import Base, GUID
from datetime import datetime

class Staff(Base):
    __tablename__ = "staff"
    
    id = GUID()
    name = Column(String(255), nullable=False)
    phone = Column(String(50))
    role = Column(String(50), default="mechanic")
    commission_rate = Column(Numeric(5, 2), default=30.00)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
