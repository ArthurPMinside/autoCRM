from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.work_order import WorkOrder
from app.models.client import Client
from app.models.transaction import Transaction
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/")
def get_dashboard(db: Session = Depends(get_db)):
    today = datetime.utcnow().date()
    week_ago = today - timedelta(days=7)
    
    orders = db.query(WorkOrder).all()
    clients = db.query(Client).all()
    txs = db.query(Transaction).all()
    
    active_orders = len([o for o in orders if o.status == "in_progress"])
    completed_today = len([o for o in orders if o.completed_date and o.completed_date.date() == today])
    
    week_income = sum(float(t.amount) for t in txs if t.type == "income" and t.date and t.date.date() >= week_ago)
    week_expense = sum(float(t.amount) for t in txs if t.type == "expense" and t.date and t.date.date() >= week_ago)
    
    return {
        "active_orders": active_orders,
        "completed_today": completed_today,
        "total_clients": len(clients),
        "week_revenue": week_income,
        "week_expenses": week_expense,
        "week_profit": week_income - week_expense,
    }
