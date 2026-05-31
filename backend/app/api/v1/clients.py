from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.client import Client
from app.models.vehicle import Vehicle
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()

class ClientCreate(BaseModel):
    name: str
    phone: str
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
    clients = db.query(Client).all()
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
    return ClientResponse(
        id=client.id,
        name=client.name,
        phone=client.phone,
        email=client.email,
        total_visits=0,
        total_revenue=0.0,
        last_visit=None,
        created_at=client.created_at.isoformat(),
        vehicles=[],
    )

@router.get("/{client_id}", response_model=ClientResponse)
def get_client(client_id: str, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id).first()
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
