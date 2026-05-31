from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class TelegramMessage(BaseModel):
    chat_id: str
    text: str

@router.post("/send-message")
async def send_message(msg: TelegramMessage):
    """Send message via Telegram bot (mock for demo)"""
    return {"status": "sent", "chat_id": msg.chat_id, "text": msg.text}

@router.get("/bot-status")
async def bot_status():
    """Get Telegram bot status"""
    return {"status": "running", "webhook": False, "polling": True}
