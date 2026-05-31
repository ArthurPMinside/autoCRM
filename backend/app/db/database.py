from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# Import Base from models.base to ensure all models use the same metadata
from app.models.base import Base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./autocrm.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
