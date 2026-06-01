# autoCRM

## Overview
CRM для автосервиса. Учёт клиентов, автомобилей, заказ-нарядов, расписания, финансов, склада, аналитики и маркетинга.

## Tech Stack

### Backend
- **Framework**: FastAPI 0.104.1
- **ORM**: SQLAlchemy 2.0.23 (synchronous)
- **Database**: SQLite (`autocrm.db`)
- **Auth**: JWT (python-jose) + bcrypt (passlib)
- **Telegram**: python-telegram-bot 20.7
- **SMS**: SMS.ru integration + mock mode

### Frontend
- **Build**: Vite 5 + TypeScript 5
- **Framework**: React 18 + React Router 6
- **Styling**: Tailwind CSS 3
- **State (server)**: TanStack Query 5
- **State (client)**: Zustand 4
- **HTTP**: Axios 1.6
- **Charts**: Recharts 2.10
- **Icons**: Lucide React

### Infrastructure
- Docker + docker-compose
- Makefile
- Git

## Current Status

### ✅ Implemented
- JWT authentication (login/register/me)
- 13 database tables
- CRUD API for clients, vehicles, services, work orders, staff, transactions, receipts, SMS
- Analytics: RFM, retention, revenue, dashboard KPIs, marketing sources
- 13 frontend pages
- Schedule (weekly calendar with drag-click creation)
- Salary calculator for staff
- Receipt generation
- Dark/light theme
- Mobile-first responsive design
- Seed script with test data

### ⚠️ Partial / Gaps
- Auth not enforced on API endpoints
- Marketing page uses mock data (no backend)
- Warehouse page uses mock data (no PartMovement API)
- Analytics pages partially mock (RFM/retention/revenue)
- No PUT/DELETE for clients, vehicles, parts
- No DELETE for work orders
- Payment/Expense models exist but unused
- Settings (profile/company) not wired to API
- No tests
- No migrations

### ❌ Not Implemented
- Role-based access control
- Email integration
- WebSocket / real-time
- Pagination on lists
- Token refresh
- Registration page (API exists, UI missing)

## Architecture

```
autoCRM/
├── backend/          # FastAPI
│   ├── app/
│   │   ├── api/v1/   # API endpoints (11 modules)
│   │   ├── models/   # SQLAlchemy (13 tables)
│   │   ├── db/       # Database
│   │   ├── core/     # Auth, config
│   │   ├── bot/      # Telegram stub
│   │   └── telegram/ # Telegram bot impl
│   ├── seed.py
│   └── requirements.txt
├── web/              # React + Vite
│   ├── src/
│   │   ├── pages/    # 13 pages
│   │   ├── components/
│   │   ├── api/      # API clients
│   │   └── store/
│   └── package.json
├── docker-compose.yml
└── Makefile
```

## Access
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001
- Login: `admin@autocrm.ru` / `admin123`

## Decisions Log
- SQLite chosen for simplicity (single-file, zero-config)
- Synchronous SQLAlchemy (simpler than async for small team)
- UUID string PKs via custom GUID() helper
- Inline BaseModel schemas in routers (not using app/schemas/)
- LocalStorage for JWT token persistence
