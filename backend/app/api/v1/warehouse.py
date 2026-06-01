from fastapi import APIRouter, Depends, HTTPException
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

class PartUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[int] = None
    min_quantity: Optional[int] = None
    price: Optional[float] = None
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
    query = db.query(Part).filter(Part.is_deleted == False)
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

@router.put("/parts/{part_id}", response_model=PartResponse)
def update_part(part_id: str, data: PartUpdate, db: Session = Depends(get_db)):
    part = db.query(Part).filter(Part.id == part_id, Part.is_deleted == False).first()
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")
    if data.name is not None:
        part.name = data.name
    if data.category is not None:
        part.category = data.category
    if data.quantity is not None:
        part.quantity = data.quantity
    if data.min_quantity is not None:
        part.min_quantity = data.min_quantity
    if data.price is not None:
        part.price = data.price
    if data.supplier is not None:
        part.supplier = data.supplier
    if data.location is not None:
        part.location = data.location
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

@router.delete("/parts/{part_id}")
def delete_part(part_id: str, db: Session = Depends(get_db)):
    part = db.query(Part).filter(Part.id == part_id, Part.is_deleted == False).first()
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")
    # Check for linked movements
    movements = db.query(PartMovement).filter(PartMovement.part_id == part_id).count()
    if movements > 0:
        raise HTTPException(status_code=409, detail="Cannot delete part with movement history")
    part.is_deleted = True
    db.commit()
    return {"status": "deleted"}
