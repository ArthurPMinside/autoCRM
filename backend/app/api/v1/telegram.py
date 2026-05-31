from fastapi import APIRouter
from app.bot.telegram import bot

router = APIRouter()

@router.get("/status")
def get_status():
    return bot.get_status()

@router.post("/send")
def send_message(chat_id: str, text: str):
    return bot.send_message(chat_id, text)
