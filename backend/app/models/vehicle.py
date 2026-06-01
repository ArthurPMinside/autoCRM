from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Boolean
from app.models.base import Base, GUID
from datetime import datetime

class Vehicle(Base):
    __tablename__ = "vehicles"
    
    id = GUID()
    client_id = Column(String(36), ForeignKey("clients.id"), nullable=False)
    make = Column(String(100), nullable=False)
    model = Column(String(100), nullable=False)
    year = Column(Integer)
    license_plate = Column(String(20))
    vin = Column(String(50))
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
