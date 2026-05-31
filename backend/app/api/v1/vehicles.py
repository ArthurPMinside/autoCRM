from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.vehicle import Vehicle
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()

class VehicleCreate(BaseModel):
    client_id: str
    make: str
    model: str
    year: Optional[int] = None
    license_plate: Optional[str] = None
    vin: Optional[str] = None

class VehicleResponse(BaseModel):
    id: str
    client_id: str
    make: str
    model: str
    year: Optional[int]
    license_plate: Optional[str]
    vin: Optional[str]
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[VehicleResponse])
def get_vehicles(client_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Vehicle)
    if client_id:
        query = query.filter(Vehicle.client_id == client_id)
    return query.all()

@router.post("/", response_model=VehicleResponse)
def create_vehicle(data: VehicleCreate, db: Session = Depends(get_db)):
    vehicle = Vehicle(**data.dict())
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle

@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(vehicle_id: str, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle
