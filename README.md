# autoCRM

CRM- система для автосервисов и СТО. Учёт клиентов, заказ-нарядов, финансов, склада запчастей, аналитика и маркетинг.

## Стек

- **Backend**: FastAPI + SQLAlchemy + SQLite (dev) / PostgreSQL (prod)
- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Auth**: JWT
- **Charts**: Recharts
- **State**: Zustand + React Query

## Быстрый старт

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python seed.py  # Заполнение тестовыми данными
python -m app.main
```

API: http://localhost:8001

### Frontend

```bash
cd web
npm install
npm run dev
```

App: http://localhost:3000

### Docker

```bash
docker-compose up --build
```

## Демо-данные

- Логин: `admin@autocrm.ru`
- Пароль: `admin123`

## Функционал

- 📅 Расписание записей
- 📊 Дашборд с аналитикой
- 👥 Клиенты и автомобили
- 🔧 Заказ-наряды
- 💰 Финансы (приход/расход)
- 📦 Склад запчастей
- 📈 Аналитика (RFM, retention)
- 📣 Маркетинг (SMS, Email, Telegram)
- ⚙️ Настройки
- 🌙 Тёмная тема
- 📱 Мобильная адаптивность

## Структура

```
autoCRM/
├── backend/          # FastAPI
│   ├── app/
│   │   ├── api/v1/   # API endpoints
│   │   ├── models/   # SQLAlchemy models
│   │   ├── db/       # Database
│   │   ├── core/     # Security, config
│   │   └── bot/      # Telegram bot
│   └── seed.py       # Test data
├── web/              # React frontend
│   ├── src/
│   │   ├── pages/    # Page components
│   │   ├── components/ # Shared components
│   │   ├── api/      # API clients
│   │   └── store/    # State management
│   └── package.json
└── docker-compose.yml
```
