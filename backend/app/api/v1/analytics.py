from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.client import Client
from app.models.work_order import WorkOrder
from app.models.transaction import Transaction
from typing import List

router = APIRouter()

@router.get("/rfm")
def get_rfm(db: Session = Depends(get_db)):
    clients = db.query(Client).all()
    return {
        "champions": len([c for c in clients if (c.total_visits or 0) >= 5]),
        "loyal": len([c for c in clients if 3 <= (c.total_visits or 0) < 5]),
        "potential": len([c for c in clients if 1 <= (c.total_visits or 0) < 3]),
        "at_risk": len([c for c in clients if (c.total_visits or 0) == 0]),
    }

@router.get("/revenue")
def get_revenue(period: str = "month", db: Session = Depends(get_db)):
    txs = db.query(Transaction).filter(Transaction.type == "income").all()
    return {"total": sum(float(t.amount) for t in txs), "count": len(txs)}

@router.get("/retention")
def get_retention(db: Session = Depends(get_db)):
    clients = db.query(Client).all()
    returning = len([c for c in clients if (c.total_visits or 0) > 1])
    total = len(clients)
    return {"rate": round(returning / total * 100, 1) if total else 0, "returning": returning, "total": total}
