from sqlalchemy import Column, String, DateTime, Integer, Numeric
from app.models.base import Base, GUID
from datetime import datetime

class Client(Base):
    __tablename__ = "clients"
    
    id = GUID()
    name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False)
    email = Column(String(255))
    total_visits = Column(Integer, default=0)
    total_revenue = Column(Numeric(12, 2), default=0)
    last_visit = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
