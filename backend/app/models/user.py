from sqlalchemy import Column, String, DateTime, Boolean
from app.models.base import Base, GUID
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    
    id = GUID()
    email = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(255))
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
