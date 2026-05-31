# autoCRM v1.0.0 — Project Summary

## Что реализовано

### Backend (FastAPI)
- ✅ JWT аутентификация (login/register/me)
- ✅ 9 таблиц БД: users, clients, vehicles, services, work_orders, transactions, parts, part_movements
- ✅ CRUD API для всех сущностей
- ✅ Связанные данные (клиент → авто → заказы)
- ✅ Автообновление статистики клиентов
- ✅ Аналитика: RFM, retention, revenue, dashboard
- ✅ Склад: учёт запчастей с минимальными остатками
- ✅ Telegram bot stub
- ✅ Seed-скрипт с тестовыми данными
- ✅ CORS для dev

### Frontend (React 18 + TypeScript + Tailwind)
- ✅ 10 страниц: Расписание, Дашборд, Клиенты, Заказы, Финансы, Маркетинг, Склад, Аналитика, Настройки, Логин
- ✅ React Query + Axios для API
- ✅ Zustand для темы и toast-уведомлений
- ✅ 3-шаговое создание заказ-наряда (клиент → авто → услуги)
- ✅ Создание клиента и автомобиля inline
- ✅ Финансы: приход/расход с категориями
- ✅ Склад: таблица с фильтрами, цветовая индикация остатков
- ✅ Аналитика: RFM-сегменты, retention, выручка по услугам (Recharts)
- ✅ Маркетинг: кампании, шаблоны, аудитория
- ✅ Настройки: профиль, компания, уведомления, безопасность
- ✅ Тёмная/светлая тема с localStorage
- ✅ Mobile-first responsive design
- ✅ Bottom navigation на мобильных
- ✅ Toast-уведомления (success/error/warning/info)
- ✅ Code splitting (manual chunks)

### Данные
- 5 клиентов с автомобилями
- 5 услуг с ценами
- 4 заказ-наряда (разные статусы)
- 6 финансовых операций
- 5 позиций на складе

### Инфраструктура
- Docker + docker-compose
- Makefile для быстрых команд
- Git репозиторий

## Запуск

```bash
# Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

# Frontend
cd web
npm run dev

# Или оба через Docker
docker-compose up --build
```

## Доступ
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001
- Login: `admin@autocrm.ru` / `admin123`

## Структура проекта
```
autoCRM/
├── backend/          # FastAPI
│   ├── app/
│   │   ├── api/v1/   # API endpoints
│   │   ├── models/   # SQLAlchemy
│   │   ├── db/       # Database
│   │   ├── core/     # Auth, config
│   │   └── bot/      # Telegram
│   ├── seed.py
│   └── requirements.txt
├── web/              # React + Vite
│   ├── src/
│   │   ├── pages/    # 10 страниц
│   │   ├── components/
│   │   ├── api/      # API clients
│   │   └── store/
│   └── package.json
├── docker-compose.yml
├── Makefile
└── README.md
```
