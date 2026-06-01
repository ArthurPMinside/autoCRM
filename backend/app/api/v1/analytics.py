from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.models.client import Client
from app.models.work_order import WorkOrder
from app.models.transaction import Transaction
from datetime import datetime, date
from typing import Optional, List

router = APIRouter()

SOURCE_LABELS = {
    "direct": "Прямой заход",
    "yandex": "Яндекс",
    "google": "Google",
    "referral": "Рекомендация",
    "repeat": "Повторный визит",
    "instagram": "Instagram",
    "vk": "ВКонтакте",
    "telegram": "Telegram",
    "avito": "Авито",
    "other": "Другое",
}


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


@router.get("/rfm")
def get_rfm(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Client)
    start = _parse_date_flexible(start_date)
    end = _parse_date_flexible(end_date, end_of_day=True)
    if start and end and end < start:
        start, end = end, start
    if start:
        query = query.filter(Client.created_at >= start)
    if end:
        query = query.filter(Client.created_at <= end)
    clients = query.all()
    return {
        "champions": len([c for c in clients if (c.total_visits or 0) >= 5]),
        "loyal": len([c for c in clients if 3 <= (c.total_visits or 0) < 5]),
        "potential": len([c for c in clients if 1 <= (c.total_visits or 0) < 3]),
        "at_risk": len([c for c in clients if (c.total_visits or 0) == 0]),
    }


@router.get("/revenue")
def get_revenue(
    period: str = "month",
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Transaction).filter(Transaction.type == "income")
    start = _parse_date_flexible(start_date)
    end = _parse_date_flexible(end_date, end_of_day=True)
    if start and end and end < start:
        start, end = end, start
    if start:
        query = query.filter(Transaction.date >= start)
    if end:
        query = query.filter(Transaction.date <= end)
    txs = query.all()
    return {"total": sum(float(t.amount) for t in txs), "count": len(txs)}


@router.get("/retention")
def get_retention(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Client)
    start = _parse_date_flexible(start_date)
    end = _parse_date_flexible(end_date, end_of_day=True)
    if start and end and end < start:
        start, end = end, start
    if start:
        query = query.filter(Client.created_at >= start)
    if end:
        query = query.filter(Client.created_at <= end)
    clients = query.all()
    returning = len([c for c in clients if (c.total_visits or 0) > 1])
    total = len(clients)
    return {
        "rate": round(returning / total * 100, 1) if total else 0,
        "returning": returning,
        "total": total,
    }


@router.get("/sources")
def get_sources(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    sort_by: str = Query("revenue", regex="^(revenue|orders|clients|source)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db),
):
    """Аналитика по источникам клиентов с суммами и сортировкой."""
    query = db.query(
        WorkOrder.source,
        func.count(WorkOrder.id).label("order_count"),
        func.sum(WorkOrder.total_cost).label("total_revenue"),
        func.count(func.distinct(WorkOrder.client_id)).label("unique_clients"),
    ).group_by(WorkOrder.source)

    start = _parse_date_flexible(start_date)
    end = _parse_date_flexible(end_date, end_of_day=True)
    if start and end and end < start:
        start, end = end, start
    if start:
        query = query.filter(WorkOrder.scheduled_date >= start)
    if end:
        query = query.filter(WorkOrder.scheduled_date <= end)

    # Apply sorting
    sort_col = {
        "revenue": func.sum(WorkOrder.total_cost),
        "orders": func.count(WorkOrder.id),
        "clients": func.count(func.distinct(WorkOrder.client_id)),
        "source": WorkOrder.source,
    }.get(sort_by, func.sum(WorkOrder.total_cost))

    if sort_order == "desc":
        query = query.order_by(sort_col.desc())
    else:
        query = query.order_by(sort_col.asc())

    results = query.all()

    items = []
    for r in results:
        source_key = r.source or "other"
        items.append({
            "source": source_key,
            "source_label": SOURCE_LABELS.get(source_key, source_key),
            "orders": r.order_count or 0,
            "revenue": float(r.total_revenue or 0),
            "clients": r.unique_clients or 0,
        })

    total_revenue = sum(i["revenue"] for i in items)
    total_orders = sum(i["orders"] for i in items)
    total_clients = sum(i["clients"] for i in items)

    return {
        "items": items,
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "total_clients": total_clients,
    }
