from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.client import Client
from app.models.vehicle import Vehicle
from app.models.work_order import WorkOrder
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()

class VehicleCreateInput(BaseModel):
    make: str
    model: str
    year: Optional[int] = None
    license_plate: Optional[str] = None
    vin: Optional[str] = None

class ClientCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    vehicles: List[VehicleCreateInput] = []

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

class ClientResponse(BaseModel):
    id: str
    name: str
    phone: str
    email: Optional[str]
    total_visits: int
    total_revenue: float
    last_visit: Optional[str]
    created_at: str
    vehicles: List[dict] = []
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[ClientResponse])
def get_clients(db: Session = Depends(get_db)):
    clients = db.query(Client).filter(Client.is_deleted == False).all()
    result = []
    for client in clients:
        vehicles = db.query(Vehicle).filter(Vehicle.client_id == client.id).all()
        c = ClientResponse(
            id=client.id,
            name=client.name,
            phone=client.phone,
            email=client.email,
            total_visits=client.total_visits or 0,
            total_revenue=float(client.total_revenue or 0),
            last_visit=client.last_visit.isoformat() if client.last_visit else None,
            created_at=client.created_at.isoformat(),
            vehicles=[{"id": v.id, "make": v.make, "model": v.model, "year": v.year, "license_plate": v.license_plate} for v in vehicles],
        )
        result.append(c)
    return result

@router.post("/", response_model=ClientResponse)
def create_client(data: ClientCreate, db: Session = Depends(get_db)):
    client = Client(name=data.name, phone=data.phone, email=data.email)
    db.add(client)
    db.commit()
    db.refresh(client)
    
    created_vehicles = []
    for v in data.vehicles:
        vehicle = Vehicle(
            client_id=client.id,
            make=v.make,
            model=v.model,
            year=v.year,
            license_plate=v.license_plate,
            vin=v.vin,
        )
        db.add(vehicle)
        created_vehicles.append(vehicle)
    if created_vehicles:
        db.commit()
        for v in created_vehicles:
            db.refresh(v)
    
    return ClientResponse(
        id=client.id,
        name=client.name,
        phone=client.phone,
        email=client.email,
        total_visits=0,
        total_revenue=0.0,
        last_visit=None,
        created_at=client.created_at.isoformat(),
        vehicles=[{"id": v.id, "make": v.make, "model": v.model, "year": v.year, "license_plate": v.license_plate} for v in created_vehicles],
    )

@router.get("/{client_id}", response_model=ClientResponse)
def get_client(client_id: str, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id, Client.is_deleted == False).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    vehicles = db.query(Vehicle).filter(Vehicle.client_id == client.id).all()
    return ClientResponse(
        id=client.id,
        name=client.name,
        phone=client.phone,
        email=client.email,
        total_visits=client.total_visits or 0,
        total_revenue=float(client.total_revenue or 0),
        last_visit=client.last_visit.isoformat() if client.last_visit else None,
        created_at=client.created_at.isoformat(),
        vehicles=[{"id": v.id, "make": v.make, "model": v.model, "year": v.year, "license_plate": v.license_plate} for v in vehicles],
    )

@router.put("/{client_id}", response_model=ClientResponse)
def update_client(client_id: str, data: ClientUpdate, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id, Client.is_deleted == False).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    if data.name is not None:
        client.name = data.name
    if data.phone is not None:
        client.phone = data.phone
    if data.email is not None:
        client.email = data.email
    db.commit()
    db.refresh(client)
    vehicles = db.query(Vehicle).filter(Vehicle.client_id == client.id).all()
    return ClientResponse(
        id=client.id,
        name=client.name,
        phone=client.phone,
        email=client.email,
        total_visits=client.total_visits or 0,
        total_revenue=float(client.total_revenue or 0),
        last_visit=client.last_visit.isoformat() if client.last_visit else None,
        created_at=client.created_at.isoformat(),
        vehicles=[{"id": v.id, "make": v.make, "model": v.model, "year": v.year, "license_plate": v.license_plate} for v in vehicles],
    )

@router.delete("/{client_id}")
def delete_client(client_id: str, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id, Client.is_deleted == False).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    # Check for active work orders
    active_orders = db.query(WorkOrder).filter(
        WorkOrder.client_id == client_id,
        WorkOrder.status.notin_(["completed", "cancelled"]),
        WorkOrder.is_deleted == False
    ).count()
    if active_orders > 0:
        raise HTTPException(status_code=409, detail="Cannot delete client with active work orders")
    client.is_deleted = True
    db.commit()
    return {"status": "deleted"}
