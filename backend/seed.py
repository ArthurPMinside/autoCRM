from app.db.database import SessionLocal, engine
from app.models.base import Base
from app.models.user import User
from app.models.client import Client
from app.models.vehicle import Vehicle
from app.models.service import Service
from app.models.work_order import WorkOrder
from app.models.transaction import Transaction
from app.models.warehouse import Part
from app.models.staff import Staff
from app.core.security import get_password_hash
from datetime import datetime, timedelta

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Check if already seeded
    if db.query(User).first():
        print("Already seeded")
        db.close()
        return
    
    # Admin user
    admin = User(
        email="artur@crmio.ru",
        hashed_password=get_password_hash("Xk9#mP2$vL7@qR4"),
        name="Администратор",
        is_admin=True,
    )
    db.add(admin)
    
    # Staff
    staff_members = [
        {"name": "Сергеев Иван Николаевич", "phone": "+7 (999) 111-22-33", "role": "mechanic", "commission_rate": 35.0},
        {"name": "Кузнецов Алексей Петрович", "phone": "+7 (999) 222-33-44", "role": "mechanic", "commission_rate": 30.0},
        {"name": "Волкова Елена Сергеевна", "phone": "+7 (999) 333-44-55", "role": "admin", "commission_rate": 0.0},
    ]
    staff_list = []
    for s in staff_members:
        staff = Staff(**s)
        db.add(staff)
        staff_list.append(staff)
    db.flush()
    
    # Clients
    clients_data = [
        {"name": "Иванов Алексей Петрович", "phone": "+7 (999) 123-45-67", "email": "ivanov@mail.ru"},
        {"name": "Петрова Мария Сергеевна", "phone": "+7 (999) 234-56-78", "email": "petrova@mail.ru"},
        {"name": "Сидоров Дмитрий Владимирович", "phone": "+7 (999) 345-67-89", "email": "sidorov@mail.ru"},
        {"name": "Козлова Анна Игоревна", "phone": "+7 (999) 456-78-90", "email": "kozlova@mail.ru"},
        {"name": "Новиков Павел Андреевич", "phone": "+7 (999) 567-89-01", "email": "novikov@mail.ru"},
    ]
    clients = []
    for c in clients_data:
        client = Client(name=c["name"], phone=c["phone"], email=c["email"])
        db.add(client)
        clients.append(client)
    db.flush()
    
    # Vehicles
    vehicles_data = [
        {"client_id": clients[0].id, "make": "Toyota", "model": "Camry", "year": 2020, "license_plate": "А123БВ777", "vin": "JTDBU4EE3B9123456"},
        {"client_id": clients[1].id, "make": "BMW", "model": "X5", "year": 2019, "license_plate": "В456КМ799", "vin": "5UXKR0C54E0K12345"},
        {"client_id": clients[2].id, "make": "Hyundai", "model": "Solaris", "year": 2021, "license_plate": "Е789НО197", "vin": "Z94CT41DBMR123456"},
        {"client_id": clients[3].id, "make": "Kia", "model": "Rio", "year": 2022, "license_plate": "К012РС150", "vin": "XWEPC51CD0K123456"},
    ]
    vehicles = []
    for v in vehicles_data:
        vehicle = Vehicle(**v)
        db.add(vehicle)
        vehicles.append(vehicle)
    db.flush()
    
    # Services
    services_data = [
        {"name": "ТО-1 (замена масла + фильтры)", "description": "Плановое техническое обслуживание", "price": 8500, "duration": 2},
        {"name": "Диагностика подвески", "description": "Компьютерная диагностика ходовой части", "price": 3500, "duration": 1},
        {"name": "Ремонт тормозной системы", "description": "Замена колодок и дисков", "price": 12000, "duration": 3},
        {"name": "Шиномонтаж (комплект)", "description": "Снятие, монтаж, балансировка 4 колёс", "price": 3200, "duration": 1},
        {"name": "Замена ГРМ", "description": "Замена ремня/цепи ГРМ с роликами", "price": 18000, "duration": 5},
    ]
    services = []
    for s in services_data:
        service = Service(**s)
        db.add(service)
        services.append(service)
    db.flush()
    
    # Work Orders
    orders_data = [
        {"client_id": clients[0].id, "vehicle_id": vehicles[0].id, "service_id": services[0].id, "staff_id": staff_list[0].id, "status": "completed", "total_cost": 8500, "description": "Плановое ТО", "scheduled_date": datetime.utcnow() - timedelta(days=2), "completed_date": datetime.utcnow() - timedelta(days=2)},
        {"client_id": clients[1].id, "vehicle_id": vehicles[1].id, "service_id": services[1].id, "staff_id": staff_list[1].id, "status": "in_progress", "total_cost": 3500, "description": "Стук в передней подвеске", "scheduled_date": datetime.utcnow()},
        {"client_id": clients[2].id, "vehicle_id": vehicles[2].id, "service_id": services[3].id, "staff_id": staff_list[0].id, "status": "pending", "total_cost": 3200, "description": "Переобувка на лето", "scheduled_date": datetime.utcnow() + timedelta(days=1)},
        {"client_id": clients[0].id, "vehicle_id": vehicles[0].id, "service_id": services[2].id, "staff_id": staff_list[1].id, "status": "pending", "total_cost": 12000, "description": "Скрип при торможении", "scheduled_date": datetime.utcnow() + timedelta(days=2)},
    ]
    for o in orders_data:
        order = WorkOrder(**o)
        db.add(order)
    db.flush()
    
    # Update client stats
    for client in clients:
        client_orders = db.query(WorkOrder).filter(WorkOrder.client_id == client.id).all()
        client.total_visits = len(client_orders)
        client.total_revenue = sum(float(o.total_cost or 0) for o in client_orders)
        if client_orders:
            client.last_visit = max(o.created_at for o in client_orders)
    
    # Transactions
    transactions_data = [
        {"type": "income", "amount": 8500, "category": "Оплата заказа", "description": "ТО-1 Toyota Camry", "date": datetime.utcnow() - timedelta(days=2)},
        {"type": "income", "amount": 45000, "category": "Оплата заказа", "description": "Ремонт подвески BMW", "date": datetime.utcnow() - timedelta(days=5)},
        {"type": "expense", "amount": 15000, "category": "Запчасти", "description": "Закупка масла и фильтров", "date": datetime.utcnow() - timedelta(days=3)},
        {"type": "expense", "amount": 80000, "category": "Зарплата", "description": "Зарплата механикам", "date": datetime.utcnow() - timedelta(days=1)},
        {"type": "income", "amount": 12000, "category": "Оплата заказа", "description": "Тормоза Hyundai", "date": datetime.utcnow() - timedelta(days=1)},
        {"type": "expense", "amount": 25000, "category": "Аренда", "description": "Аренда помещения", "date": datetime.utcnow() - timedelta(days=7)},
    ]
    for t in transactions_data:
        tx = Transaction(**t)
        db.add(tx)
    
    # Parts
    parts_data = [
        {"name": "Масло моторное 5W-30", "category": "Масла", "quantity": 24, "min_quantity": 10, "price": 850, "supplier": "Лукойл", "location": "Полка А1"},
        {"name": "Фильтр масляный", "category": "Фильтры", "quantity": 18, "min_quantity": 15, "price": 320, "supplier": "Mann", "location": "Полка А2"},
        {"name": "Тормозные колодки передние", "category": "Тормоза", "quantity": 6, "min_quantity": 8, "price": 2400, "supplier": "Brembo", "location": "Полка Б3"},
        {"name": "Свечи зажигания (к-т 4шт)", "category": "Свечи", "quantity": 12, "min_quantity": 10, "price": 1200, "supplier": "NGK", "location": "Полка А3"},
        {"name": "Антифриз G12 (5л)", "category": "Жидкости", "quantity": 8, "min_quantity": 5, "price": 650, "supplier": "FeBi", "location": "Полка В1"},
    ]
    for p in parts_data:
        part = Part(**p)
        db.add(part)
    
    db.commit()
    db.close()
    print("Database seeded successfully!")

if __name__ == "__main__":
    seed()
