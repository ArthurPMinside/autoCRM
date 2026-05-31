from sqlalchemy import Column, String, DateTime, Text
from app.models.base import Base, GUID
from datetime import datetime

class SmsLog(Base):
    __tablename__ = "sms_logs"
    
    id = GUID()
    phone = Column(String(50), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(20), default="pending")
    provider_response = Column(Text)
    sent_at = Column(DateTime, default=datetime.utcnow)
