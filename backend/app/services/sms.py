"""SMS service for notifications"""
import os
from typing import Optional

SMS_API_KEY = os.getenv("SMS_API_KEY", "")
SMS_PROVIDER = os.getenv("SMS_PROVIDER", "mock")

def send_sms(phone: str, message: str) -> dict:
    if SMS_PROVIDER == "smsru" and SMS_API_KEY:
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
    return {"status": "sent", "message": "SMS sent (mock mode)"}

def get_sms_status() -> dict:
    return {
        "provider": SMS_PROVIDER,
        "configured": bool(SMS_API_KEY),
        "mock_mode": SMS_PROVIDER == "mock" or not SMS_API_KEY,
    }
