from typing import Optional
from app.schemas.user import UserCreate, UserOut, UserLogin, Token
from app.schemas.client import ClientCreate, ClientOut, ClientUpdate
from app.schemas.vehicle import VehicleCreate, VehicleOut
from app.schemas.work_order import WorkOrderCreate, WorkOrderOut, WorkOrderUpdate
from app.schemas.service import ServiceCreate, ServiceOut
from app.schemas.finance import PaymentCreate, PaymentOut, ExpenseCreate, ExpenseOut
from app.schemas.settings import SettingsBase, SettingsResponse
