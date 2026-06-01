from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.vehicle import Vehicle
from app.models.work_order import WorkOrder
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

class VehicleUpdate(BaseModel):
    make: Optional[str] = None
    model: Optional[str] = None
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
    query = db.query(Vehicle).filter(Vehicle.is_deleted == False)
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
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id, Vehicle.is_deleted == False).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle

@router.put("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(vehicle_id: str, data: VehicleUpdate, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id, Vehicle.is_deleted == False).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    if data.make is not None:
        vehicle.make = data.make
    if data.model is not None:
        vehicle.model = data.model
    if data.year is not None:
        vehicle.year = data.year
    if data.license_plate is not None:
        vehicle.license_plate = data.license_plate
    if data.vin is not None:
        vehicle.vin = data.vin
    db.commit()
    db.refresh(vehicle)
    return vehicle

@router.delete("/{vehicle_id}")
def delete_vehicle(vehicle_id: str, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id, Vehicle.is_deleted == False).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    # Check for active work orders
    active_orders = db.query(WorkOrder).filter(
        WorkOrder.vehicle_id == vehicle_id,
        WorkOrder.status.notin_(["completed", "cancelled"]),
        WorkOrder.is_deleted == False
    ).count()
    if active_orders > 0:
        raise HTTPException(status_code=409, detail="Cannot delete vehicle with active work orders")
    vehicle.is_deleted = True
    db.commit()
    return {"status": "deleted"}
