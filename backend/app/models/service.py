from sqlalchemy import Column, String, DateTime, Integer, Numeric, Text
from app.models.base import Base, GUID
from datetime import datetime

class Service(Base):
    __tablename__ = "services"
    
    id = GUID()
    name = Column(String(255), nullable=False)
    description = Column(Text)
    price = Column(Numeric(10, 2), default=0)
    duration = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
