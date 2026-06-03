from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# Import Base from models.base to ensure all models use the same metadata
from app.models.base import Base

# Import all models to ensure they are registered with Base metadata
from app.models import vehicle_catalog  # noqa: F401
from app.models import settings  # noqa: F401

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./autocrm.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
