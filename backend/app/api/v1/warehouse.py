from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.warehouse import Part, PartMovement
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

router = APIRouter()

class PartCreate(BaseModel):
    name: str
    category: Optional[str] = None
    quantity: Optional[int] = 0
    min_quantity: Optional[int] = 5
    price: Optional[float] = 0
    supplier: Optional[str] = None
    location: Optional[str] = None

class PartResponse(BaseModel):
    id: str
    name: str
    category: Optional[str]
    quantity: int
    min_quantity: int
    price: float
    supplier: Optional[str]
    location: Optional[str]
    
    class Config:
        from_attributes = True

@router.get("/parts", response_model=List[PartResponse])
def get_parts(search: Optional[str] = "", category: Optional[str] = "", db: Session = Depends(get_db)):
    query = db.query(Part)
    if search:
        query = query.filter(Part.name.contains(search))
    if category:
        query = query.filter(Part.category == category)
    return query.all()

@router.post("/parts", response_model=PartResponse)
def create_part(data: PartCreate, db: Session = Depends(get_db)):
    part = Part(**data.dict())
    db.add(part)
    db.commit()
    db.refresh(part)
    return PartResponse(
        id=part.id,
        name=part.name,
        category=part.category,
        quantity=part.quantity or 0,
        min_quantity=part.min_quantity or 5,
        price=float(part.price or 0),
        supplier=part.supplier,
        location=part.location,
    )
