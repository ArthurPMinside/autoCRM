from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.receipt import Receipt
from app.models.work_order import WorkOrder
from app.models.client import Client
from app.models.service import Service
from pydantic import BaseModel
from typing import Optional, List
import json

router = APIRouter()

class ReceiptCreate(BaseModel):
    work_order_id: str

class ReceiptResponse(BaseModel):
    id: str
    work_order_id: str
    items: list
    total: float
    created_at: str
    
    class Config:
        from_attributes = True

@router.post("/", response_model=ReceiptResponse)
def create_receipt(data: ReceiptCreate, db: Session = Depends(get_db)):
    order = db.query(WorkOrder).filter(WorkOrder.id == data.work_order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    client = db.query(Client).filter(Client.id == order.client_id).first()
    service = db.query(Service).filter(Service.id == order.service_id).first()
    
    items = [{
        "name": service.name if service else "Услуга",
        "price": float(order.total_cost or 0),
        "quantity": 1,
    }]
    
    receipt = Receipt(
        work_order_id=data.work_order_id,
        items=json.dumps(items, ensure_ascii=False),
        total=order.total_cost or 0,
    )
    db.add(receipt)
    db.commit()
    db.refresh(receipt)
    
    return ReceiptResponse(
        id=receipt.id,
        work_order_id=receipt.work_order_id,
        items=json.loads(receipt.items) if receipt.items else [],
        total=float(receipt.total or 0),
        created_at=receipt.created_at.isoformat(),
    )

@router.get("/{receipt_id}", response_model=ReceiptResponse)
def get_receipt(receipt_id: str, db: Session = Depends(get_db)):
    receipt = db.query(Receipt).filter(Receipt.id == receipt_id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return ReceiptResponse(
        id=receipt.id,
        work_order_id=receipt.work_order_id,
        items=json.loads(receipt.items) if receipt.items else [],
        total=float(receipt.total or 0),
        created_at=receipt.created_at.isoformat(),
    )

@router.get("/", response_model=List[ReceiptResponse])
def get_receipts(db: Session = Depends(get_db)):
    receipts = db.query(Receipt).order_by(Receipt.created_at.desc()).all()
    return [ReceiptResponse(
        id=r.id,
        work_order_id=r.work_order_id,
        items=json.loads(r.items) if r.items else [],
        total=float(r.total or 0),
        created_at=r.created_at.isoformat(),
    ) for r in receipts]
