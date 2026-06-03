from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.settings import Settings
from app.schemas.settings import SettingsBase, SettingsResponse

router = APIRouter()


@router.get("/", response_model=SettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(Settings).first()
    if not settings:
        settings = Settings(work_start_hour=10, work_end_hour=20)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.put("/", response_model=SettingsResponse)
def update_settings(data: SettingsBase, db: Session = Depends(get_db)):
    settings = db.query(Settings).first()
    if not settings:
        settings = Settings(work_start_hour=data.work_start_hour, work_end_hour=data.work_end_hour)
        db.add(settings)
    else:
        settings.work_start_hour = data.work_start_hour
        settings.work_end_hour = data.work_end_hour
    db.commit()
    db.refresh(settings)
    return settings
