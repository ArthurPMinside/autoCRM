from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.staff import Staff
from app.models.work_order import WorkOrder
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

router = APIRouter()

class StaffCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    role: Optional[str] = "mechanic"
    commission_rate: Optional[float] = 30.0
    is_active: Optional[bool] = True

class StaffResponse(BaseModel):
    id: str
    name: str
    phone: Optional[str]
    role: str
    commission_rate: float
    is_active: bool
    created_at: str
    
    class Config:
        from_attributes = True

class SalaryResponse(BaseModel):
    staff_id: str
    staff_name: str
    commission_rate: float
    period_start: str
    period_end: str
    total_orders: int
    total_revenue: float
    salary: float

@router.get("/", response_model=List[StaffResponse])
def get_staff(db: Session = Depends(get_db)):
    staff = db.query(Staff).all()
    return [StaffResponse(
        id=s.id,
        name=s.name,
        phone=s.phone,
        role=s.role or "mechanic",
        commission_rate=float(s.commission_rate or 30.0),
        is_active=s.is_active if s.is_active is not None else True,
        created_at=s.created_at.isoformat(),
    ) for s in staff]

@router.post("/", response_model=StaffResponse)
def create_staff(data: StaffCreate, db: Session = Depends(get_db)):
    staff = Staff(**data.dict())
    db.add(staff)
    db.commit()
    db.refresh(staff)
    return StaffResponse(
        id=staff.id,
        name=staff.name,
        phone=staff.phone,
        role=staff.role or "mechanic",
        commission_rate=float(staff.commission_rate or 30.0),
        is_active=staff.is_active if staff.is_active is not None else True,
        created_at=staff.created_at.isoformat(),
    )

@router.get("/{staff_id}", response_model=StaffResponse)
def get_staff_member(staff_id: str, db: Session = Depends(get_db)):
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    return StaffResponse(
        id=staff.id,
        name=staff.name,
        phone=staff.phone,
        role=staff.role or "mechanic",
        commission_rate=float(staff.commission_rate or 30.0),
        is_active=staff.is_active if staff.is_active is not None else True,
        created_at=staff.created_at.isoformat(),
    )

@router.put("/{staff_id}", response_model=StaffResponse)
def update_staff(staff_id: str, data: StaffCreate, db: Session = Depends(get_db)):
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    for key, value in data.dict().items():
        setattr(staff, key, value)
    db.commit()
    db.refresh(staff)
    return StaffResponse(
        id=staff.id,
        name=staff.name,
        phone=staff.phone,
        role=staff.role or "mechanic",
        commission_rate=float(staff.commission_rate or 30.0),
        is_active=staff.is_active if staff.is_active is not None else True,
        created_at=staff.created_at.isoformat(),
    )

@router.delete("/{staff_id}")
def delete_staff(staff_id: str, db: Session = Depends(get_db)):
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    db.delete(staff)
    db.commit()
    return {"status": "ok"}

@router.get("/{staff_id}/salary", response_model=SalaryResponse)
def get_salary(
    staff_id: str,
    year: Optional[int] = None,
    month: Optional[int] = None,
    db: Session = Depends(get_db)
):
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    
    now = datetime.utcnow()
    year = year or now.year
    month = month or now.month
    
    from calendar import monthrange
    days_in_month = monthrange(year, month)[1]
    period_start = datetime(year, month, 1)
    period_end = datetime(year, month, days_in_month, 23, 59, 59)
    
    orders = db.query(WorkOrder).filter(
        WorkOrder.staff_id == staff_id,
        WorkOrder.status == "completed",
        WorkOrder.completed_date >= period_start,
        WorkOrder.completed_date <= period_end,
    ).all()
    
    total_revenue = sum(float(o.total_cost or 0) for o in orders)
    commission = float(staff.commission_rate or 30.0) / 100.0
    salary = total_revenue * commission
    
    return SalaryResponse(
        staff_id=staff.id,
        staff_name=staff.name,
        commission_rate=float(staff.commission_rate or 30.0),
        period_start=period_start.isoformat(),
        period_end=period_end.isoformat(),
        total_orders=len(orders),
        total_revenue=total_revenue,
        salary=salary,
    )
