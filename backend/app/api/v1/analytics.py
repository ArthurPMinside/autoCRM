from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.db.database import get_db
from app.models.client import Client
from app.models.work_order import WorkOrder
from app.models.service import Service
from app.models.transaction import Transaction
from datetime import datetime, date
from typing import Optional, List, Dict

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
    """RFM segmentation based on actual work orders."""
    query = db.query(WorkOrder).filter(WorkOrder.is_deleted == False)
    start = _parse_date_flexible(start_date)
    end = _parse_date_flexible(end_date, end_of_day=True)
    if start:
        query = query.filter(WorkOrder.created_at >= start)
    if end:
        query = query.filter(WorkOrder.created_at <= end)
    
    orders = query.all()
    
    # Calculate RFM per client
    client_stats: Dict[str, dict] = {}
    for o in orders:
        cid = o.client_id
        if cid not in client_stats:
            client_stats[cid] = {"recency": o.created_at, "frequency": 0, "monetary": 0}
        client_stats[cid]["frequency"] += 1
        client_stats[cid]["monetary"] += float(o.total_cost or 0)
        if o.created_at > client_stats[cid]["recency"]:
            client_stats[cid]["recency"] = o.created_at
    
    now = datetime.utcnow()
    segments = {"champions": 0, "loyal": 0, "potential": 0, "new": 0, "at_risk": 0, "lost": 0}
    
    for cid, stats in client_stats.items():
        days_since_last = (now - stats["recency"]).days
        freq = stats["frequency"]
        mon = stats["monetary"]
        
        if days_since_last <= 30 and freq >= 3 and mon >= 10000:
            segments["champions"] += 1
        elif days_since_last <= 60 and freq >= 2:
            segments["loyal"] += 1
        elif days_since_last <= 90 and freq == 1:
            segments["new"] += 1
        elif days_since_last <= 90 and freq >= 2:
            segments["potential"] += 1
        elif days_since_last <= 180:
            segments["at_risk"] += 1
        else:
            segments["lost"] += 1
    
    return segments


@router.get("/revenue")
def get_revenue(
    period: str = "month",
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Revenue grouped by service type."""
    query = db.query(
        WorkOrder.service_id,
        Service.name.label("service_name"),
        func.count(WorkOrder.id).label("order_count"),
        func.sum(WorkOrder.total_cost).label("total_revenue"),
    ).join(Service, WorkOrder.service_id == Service.id).filter(WorkOrder.is_deleted == False)
    
    start = _parse_date_flexible(start_date)
    end = _parse_date_flexible(end_date, end_of_day=True)
    if start and end and end < start:
        start, end = end, start
    if start:
        query = query.filter(WorkOrder.created_at >= start)
    if end:
        query = query.filter(WorkOrder.created_at <= end)
    
    results = query.group_by(WorkOrder.service_id, Service.name).all()
    
    items = []
    for r in results:
        items.append({
            "service_name": r.service_name or "Unknown",
            "orders": r.order_count or 0,
            "revenue": float(r.total_revenue or 0),
        })
    
    return {
        "items": items,
        "total_revenue": sum(i["revenue"] for i in items),
        "total_orders": sum(i["orders"] for i in items),
    }


@router.get("/retention")
def get_retention(
    db: Session = Depends(get_db),
):
    """Cohort retention analysis based on first order month."""
    # Get all orders with client info
    orders = db.query(WorkOrder).filter(WorkOrder.is_deleted == False).order_by(WorkOrder.created_at).all()
    
    # Group by client: find first order month
    client_first_order: Dict[str, datetime] = {}
    for o in orders:
        cid = o.client_id
        if cid not in client_first_order or o.created_at < client_first_order[cid]:
            client_first_order[cid] = o.created_at
    
    # Group clients by cohort (first order month)
    from collections import defaultdict
    cohorts: Dict[str, list] = defaultdict(list)
    for cid, first_order in client_first_order.items():
        cohort_key = first_order.strftime("%Y-%m")
        cohorts[cohort_key].append(cid)
    
    # Calculate retention for each cohort
    cohort_data = []
    for cohort_month in sorted(cohorts.keys())[-12:]:  # Last 12 months
        client_ids = cohorts[cohort_month]
        initial_count = len(client_ids)
        
        # Count returning clients at 1, 3, 6, 12 months
        return_1m = 0
        return_3m = 0
        return_6m = 0
        return_12m = 0
        
        for cid in client_ids:
            first = client_first_order[cid]
            client_orders = [o for o in orders if o.client_id == cid and o.created_at > first]
            
            for o in client_orders:
                days = (o.created_at - first).days
                if days <= 30:
                    return_1m += 1
                if days <= 90:
                    return_3m += 1
                if days <= 180:
                    return_6m += 1
                if days <= 365:
                    return_12m += 1
        
        cohort_data.append({
            "cohort": cohort_month,
            "initial": initial_count,
            "return_1m": round(return_1m / initial_count * 100, 1) if initial_count else 0,
            "return_3m": round(return_3m / initial_count * 100, 1) if initial_count else 0,
            "return_6m": round(return_6m / initial_count * 100, 1) if initial_count else 0,
            "return_12m": round(return_12m / initial_count * 100, 1) if initial_count else 0,
        })
    
    return {"cohorts": cohort_data}


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
