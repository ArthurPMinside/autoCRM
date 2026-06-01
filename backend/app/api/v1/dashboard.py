from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.work_order import WorkOrder
from app.models.client import Client
from app.models.service import Service
from app.models.transaction import Transaction
from datetime import datetime, timedelta
from typing import Optional, List

router = APIRouter()


def _parse_date(date_str: Optional[str], end_of_day: bool = False) -> Optional[datetime]:
    if not date_str:
        return None
    for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%S.%fZ"):
        try:
            dt = datetime.strptime(date_str, fmt)
            if end_of_day and fmt == "%Y-%m-%d":
                dt = dt.replace(hour=23, minute=59, second=59)
            return dt
        except ValueError:
            continue
    return None


def _parse_date_flexible(date_str: Optional[str], end_of_day: bool = False) -> Optional[datetime]:
    """Parse date from various formats, handling DD.MM.YYYY and MM/DD/YYYY."""
    if not date_str:
        return None
    # Try standard formats first
    dt = _parse_date(date_str, end_of_day)
    if dt:
        return dt
    # Try DD.MM.YYYY
    try:
        parts = date_str.split('.')
        if len(parts) == 3:
            day, month, year = int(parts[0]), int(parts[1]), int(parts[2])
            dt = datetime(year, month, day)
            if end_of_day:
                dt = dt.replace(hour=23, minute=59, second=59)
            return dt
    except (ValueError, IndexError):
        pass
    # Try MM/DD/YYYY
    try:
        parts = date_str.split('/')
        if len(parts) == 3:
            month, day, year = int(parts[0]), int(parts[1]), int(parts[2])
            dt = datetime(year, month, day)
            if end_of_day:
                dt = dt.replace(hour=23, minute=59, second=59)
            return dt
    except (ValueError, IndexError):
        pass
    return None


@router.get("/")
def get_dashboard(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    start = _parse_date_flexible(start_date)
    end = _parse_date_flexible(end_date, end_of_day=True)
    if start and end and end < start:
        start, end = end, start

    orders_query = db.query(WorkOrder)
    clients_query = db.query(Client)
    txs_query = db.query(Transaction)

    if start:
        orders_query = orders_query.filter(WorkOrder.scheduled_date >= start)
        clients_query = clients_query.filter(Client.created_at >= start)
        txs_query = txs_query.filter(Transaction.date >= start)
    if end:
        orders_query = orders_query.filter(WorkOrder.scheduled_date <= end)
        clients_query = clients_query.filter(Client.created_at <= end)
        txs_query = txs_query.filter(Transaction.date <= end)

    orders = orders_query.all()
    clients = clients_query.all()
    txs = txs_query.all()

    active_orders = len([o for o in orders if o.status == "in_progress"])
    completed_today = len([o for o in orders if o.completed_date and o.completed_date.date() == datetime.utcnow().date()])

    week_income = sum(float(t.amount) for t in txs if t.type == "income")
    week_expense = sum(float(t.amount) for t in txs if t.type == "expense")

    return {
        "active_orders": active_orders,
        "completed_today": completed_today,
        "total_clients": len(clients),
        "week_revenue": week_income,
        "week_expenses": week_expense,
        "week_profit": week_income - week_expense,
    }


@router.get("/activity")
def get_activity(db: Session = Depends(get_db)):
    """Recent activity: last 10 work orders."""
    orders = db.query(WorkOrder).filter(WorkOrder.is_deleted == False).order_by(WorkOrder.created_at.desc()).limit(10).all()
    
    result = []
    for o in orders:
        client = db.query(Client).filter(Client.id == o.client_id).first()
        service = db.query(Service).filter(Service.id == o.service_id).first()
        result.append({
            "id": o.id,
            "client_name": client.name if client else "Unknown",
            "service_name": service.name if service else "Unknown",
            "status": o.status,
            "total_cost": float(o.total_cost or 0),
            "created_at": o.created_at.isoformat() if o.created_at else None,
        })
    
    return result
