from typing import Optional

class Settings:
    PROJECT_NAME: str = "autoCRM"
    VERSION: str = "1.0.0"
    DATABASE_URL: str = "sqlite:///./autocrm.db"
    SECRET_KEY: str = "autocrm-secret-key-change-in-production"
    TELEGRAM_BOT_TOKEN: Optional[str] = None
    SMS_API_KEY: Optional[str] = None

settings = Settings()
