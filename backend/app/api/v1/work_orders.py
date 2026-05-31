from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.work_order import WorkOrder
from app.models.client import Client
from app.models.vehicle import Vehicle
from app.models.service import Service
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

router = APIRouter()

class WorkOrderCreate(BaseModel):
    client_id: str
    vehicle_id: str
    service_id: str
    description: Optional[str] = None
    scheduled_date: Optional[str] = None
    status: Optional[str] = "pending"

class WorkOrderUpdate(BaseModel):
    staff_id: Optional[str] = None
    description: Optional[str] = None
    scheduled_date: Optional[str] = None
    status: Optional[str] = None

class WorkOrderResponse(BaseModel):
    id: str
    client: dict
    vehicle: dict
    service: dict
    staff_id: Optional[str]
    status: str
    total_cost: float
    description: Optional[str]
    scheduled_date: Optional[str]
    created_at: str
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[WorkOrderResponse])
def get_work_orders(db: Session = Depends(get_db)):
    orders = db.query(WorkOrder).all()
    result = []
    for order in orders:
        client = db.query(Client).filter(Client.id == order.client_id).first()
        vehicle = db.query(Vehicle).filter(Vehicle.id == order.vehicle_id).first()
        service = db.query(Service).filter(Service.id == order.service_id).first()
        result.append(WorkOrderResponse(
            id=order.id,
            client={"id": client.id, "name": client.name, "phone": client.phone} if client else {},
            vehicle={"id": vehicle.id, "make": vehicle.make, "model": vehicle.model, "license_plate": vehicle.license_plate} if vehicle else {},
            service={"id": service.id, "name": service.name, "price": float(service.price) if service.price else 0, "duration": service.duration if service else 1} if service else {},
            staff_id=order.staff_id,
            status=order.status,
            total_cost=float(order.total_cost or 0),
            description=order.description,
            scheduled_date=order.scheduled_date.isoformat() if order.scheduled_date else None,
            created_at=order.created_at.isoformat(),
        ))
    return result

@router.post("/", response_model=WorkOrderResponse)
def create_work_order(data: WorkOrderCreate, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == data.service_id).first()
    total_cost = float(service.price) if service and service.price else 0
    
    scheduled = None
    if data.scheduled_date:
        try:
            scheduled = datetime.fromisoformat(data.scheduled_date.replace('Z', '+00:00'))
        except:
            scheduled = None
    
    order = WorkOrder(
        client_id=data.client_id,
        vehicle_id=data.vehicle_id,
        service_id=data.service_id,
        description=data.description,
        scheduled_date=scheduled,
        status=data.status or "pending",
        total_cost=total_cost,
    )
    db.add(order)
    
    # Update client stats
    client = db.query(Client).filter(Client.id == data.client_id).first()
    if client:
        client.total_visits = (client.total_visits or 0) + 1
        client.total_revenue = float(client.total_revenue or 0) + total_cost
        client.last_visit = datetime.utcnow()
    
    db.commit()
    db.refresh(order)
    
    return WorkOrderResponse(
        id=order.id,
        client={"id": client.id, "name": client.name, "phone": client.phone} if client else {},
        vehicle={"id": order.vehicle_id, "make": "", "model": "", "license_plate": ""},
        service={"id": order.service_id, "name": service.name if service else "", "price": float(service.price) if service and service.price else 0, "duration": service.duration if service else 1},
        staff_id=order.staff_id,
        status=order.status,
        total_cost=float(order.total_cost or 0),
        description=order.description,
        scheduled_date=order.scheduled_date.isoformat() if order.scheduled_date else None,
        created_at=order.created_at.isoformat(),
    )

@router.put("/{order_id}", response_model=WorkOrderResponse)
def update_work_order(order_id: str, data: WorkOrderUpdate, db: Session = Depends(get_db)):
    order = db.query(WorkOrder).filter(WorkOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if data.staff_id is not None:
        order.staff_id = data.staff_id
    if data.description is not None:
        order.description = data.description
    if data.status is not None:
        order.status = data.status
        if order.status == "completed":
            order.completed_date = datetime.utcnow()
    if data.scheduled_date is not None:
        try:
            order.scheduled_date = datetime.fromisoformat(data.scheduled_date.replace('Z', '+00:00'))
        except:
            pass
    
    db.commit()
    db.refresh(order)
    
    client = db.query(Client).filter(Client.id == order.client_id).first()
    vehicle = db.query(Vehicle).filter(Vehicle.id == order.vehicle_id).first()
    service = db.query(Service).filter(Service.id == order.service_id).first()
    
    return WorkOrderResponse(
        id=order.id,
        client={"id": client.id, "name": client.name, "phone": client.phone} if client else {},
        vehicle={"id": vehicle.id, "make": vehicle.make, "model": vehicle.model, "license_plate": vehicle.license_plate} if vehicle else {},
        service={"id": service.id, "name": service.name, "price": float(service.price) if service.price else 0, "duration": service.duration if service else 1} if service else {},
        staff_id=order.staff_id,
        status=order.status,
        total_cost=float(order.total_cost or 0),
        description=order.description,
        scheduled_date=order.scheduled_date.isoformat() if order.scheduled_date else None,
        created_at=order.created_at.isoformat(),
    )

@router.patch("/{order_id}/status")
def update_status(order_id: str, status: dict, db: Session = Depends(get_db)):
    order = db.query(WorkOrder).filter(WorkOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = status.get("status", order.status)
    if order.status == "completed":
        order.completed_date = datetime.utcnow()
    db.commit()
    return {"status": "ok"}
