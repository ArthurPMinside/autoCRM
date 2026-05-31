from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.sms_log import SmsLog
from pydantic import BaseModel
from typing import Optional, List
import os

router = APIRouter()

SMS_API_KEY = os.getenv("SMS_API_KEY", "")
SMS_PROVIDER = os.getenv("SMS_PROVIDER", "mock")

class SmsSend(BaseModel):
    phone: str
    message: str

class SmsResponse(BaseModel):
    id: str
    phone: str
    message: str
    status: str
    sent_at: str
    
    class Config:
        from_attributes = True

def send_sms_mock(phone: str, message: str) -> dict:
    return {"status": "sent", "id": "mock-id", "message": "SMS sent (mock mode)"}

def send_sms_smsru(phone: str, message: str) -> dict:
    import requests
    try:
        resp = requests.post("https://sms.ru/sms/send", data={
            "api_id": SMS_API_KEY,
            "to": phone,
            "msg": message,
        }, timeout=10)
        return {"status": "sent", "response": resp.text}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@router.post("/send", response_model=SmsResponse)
def send_sms(data: SmsSend, db: Session = Depends(get_db)):
    if SMS_PROVIDER == "smsru" and SMS_API_KEY:
        result = send_sms_smsru(data.phone, data.message)
    else:
        result = send_sms_mock(data.phone, data.message)
    
    log = SmsLog(
        phone=data.phone,
        message=data.message,
        status=result.get("status", "unknown"),
        provider_response=str(result),
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    
    return SmsResponse(
        id=log.id,
        phone=log.phone,
        message=log.message,
        status=log.status,
        sent_at=log.sent_at.isoformat(),
    )

@router.get("/logs", response_model=List[SmsResponse])
def get_logs(limit: int = 50, db: Session = Depends(get_db)):
    logs = db.query(SmsLog).order_by(SmsLog.sent_at.desc()).limit(limit).all()
    return [SmsResponse(
        id=l.id,
        phone=l.phone,
        message=l.message,
        status=l.status,
        sent_at=l.sent_at.isoformat(),
    ) for l in logs]

@router.get("/status")
def get_status():
    return {
        "provider": SMS_PROVIDER,
        "configured": bool(SMS_API_KEY),
        "mock_mode": SMS_PROVIDER == "mock" or not SMS_API_KEY,
    }
