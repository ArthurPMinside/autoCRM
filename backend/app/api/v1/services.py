from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.service import Service
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()

class ServiceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: Optional[float] = None
    duration: Optional[int] = None

class ServiceResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    price: Optional[float]
    duration: Optional[int]
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[ServiceResponse])
def get_services(db: Session = Depends(get_db)):
    return db.query(Service).all()

@router.post("/", response_model=ServiceResponse)
def create_service(data: ServiceCreate, db: Session = Depends(get_db)):
    service = Service(**data.dict())
    db.add(service)
    db.commit()
    db.refresh(service)
    return service
