from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.transaction import Transaction
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

router = APIRouter()

class TransactionCreate(BaseModel):
    type: str
    amount: float
    category: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None

class TransactionResponse(BaseModel):
    id: str
    type: str
    amount: float
    category: Optional[str]
    description: Optional[str]
    date: str
    created_at: str
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[TransactionResponse])
def get_transactions(db: Session = Depends(get_db)):
    txs = db.query(Transaction).order_by(Transaction.date.desc()).all()
    result = []
    for t in txs:
        result.append(TransactionResponse(
            id=t.id,
            type=t.type,
            amount=float(t.amount),
            category=t.category,
            description=t.description,
            date=t.date.isoformat() if t.date else t.created_at.isoformat(),
            created_at=t.created_at.isoformat(),
        ))
    return result

@router.post("/", response_model=TransactionResponse)
def create_transaction(data: TransactionCreate, db: Session = Depends(get_db)):
    tx_date = datetime.utcnow()
    if data.date:
        try:
            tx_date = datetime.fromisoformat(data.date.replace('Z', '+00:00'))
        except:
            pass
    
    tx = Transaction(
        type=data.type,
        amount=data.amount,
        category=data.category,
        description=data.description,
        date=tx_date,
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return TransactionResponse(
        id=tx.id,
        type=tx.type,
        amount=float(tx.amount),
        category=tx.category,
        description=tx.description,
        date=tx.date.isoformat(),
        created_at=tx.created_at.isoformat(),
    )
