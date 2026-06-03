from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import auth, clients, vehicles, services, work_orders, finance, warehouse, analytics, dashboard, staff, sms, receipts, telegram, catalog, settings
from app.db.database import engine, Base
import uvicorn

app = FastAPI(
    title="autoCRM API",
    description="CRM для автосервисов",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(clients.router, prefix="/api/v1/clients", tags=["clients"])
app.include_router(vehicles.router, prefix="/api/v1/vehicles", tags=["vehicles"])
app.include_router(services.router, prefix="/api/v1/services", tags=["services"])
app.include_router(work_orders.router, prefix="/api/v1/work-orders", tags=["work-orders"])
app.include_router(finance.router, prefix="/api/v1/finance", tags=["finance"])
app.include_router(warehouse.router, prefix="/api/v1/warehouse", tags=["warehouse"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["dashboard"])
app.include_router(staff.router, prefix="/api/v1/staff", tags=["staff"])
app.include_router(sms.router, prefix="/api/v1/sms", tags=["sms"])
app.include_router(receipts.router, prefix="/api/v1/receipts", tags=["receipts"])
app.include_router(telegram.router, prefix="/api/v1/telegram", tags=["telegram"])
app.include_router(catalog.router, prefix="/api/v1/catalog", tags=["catalog"])
app.include_router(settings.router, prefix="/api/v1/settings", tags=["settings"])

@app.get("/")
def root():
    return {"message": "autoCRM API", "version": "1.1.0"}

@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8001, reload=True)
