"""Telegram bot for autoCRM"""
import os
from typing import Optional

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")

class TelegramBot:
    def __init__(self):
        self.token = BOT_TOKEN
        self.enabled = bool(BOT_TOKEN)
    
    def get_status(self) -> dict:
        return {
            "enabled": self.enabled,
            "token_set": bool(self.token),
        }
    
    def send_message(self, chat_id: str, text: str) -> dict:
        if not self.enabled:
            return {"status": "error", "message": "Bot not configured"}
        try:
            import requests
            url = f"https://api.telegram.org/bot{self.token}/sendMessage"
            resp = requests.post(url, json={"chat_id": chat_id, "text": text}, timeout=10)
            return {"status": "sent", "response": resp.json()}
        except Exception as e:
            return {"status": "error", "error": str(e)}

bot = TelegramBot()
