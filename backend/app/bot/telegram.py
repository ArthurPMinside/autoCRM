"""Telegram bot для уведомлений клиентов"""
import os
from typing import Optional

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

async def send_notification(chat_id: str, message: str) -> bool:
    """Отправить уведомление в Telegram"""
    if not BOT_TOKEN:
        return False
    try:
        # Здесь интеграция с python-telegram-bot
        return True
    except Exception:
        return False

def get_bot_status() -> dict:
    """Статус бота"""
    return {
        "enabled": bool(BOT_TOKEN),
        "token_set": bool(BOT_TOKEN),
    }
