# autoCRM State

## Active Decisions

### Database: SQLite
**Decision**: Use SQLite for simplicity.
**Rationale**: Single file, zero-config, sufficient for small auto shop.
**Status**: Active. May migrate to PostgreSQL if multi-user concurrency becomes issue.

### ORM: Synchronous SQLAlchemy
**Decision**: Use sync SQLAlchemy instead of async.
**Rationale**: Simpler code, no async/await complexity, sufficient for SQLite.
**Status**: Active. Note: `deps.py` has async code that's unused — should be removed or fixed.

### Auth: JWT without RBAC
**Decision**: JWT tokens with simple login/register.
**Rationale**: Fast to implement, sufficient for MVP.
**Status**: Partial. Tokens work but not enforced on endpoints. No role checks.

### Frontend State: TanStack Query + Zustand
**Decision**: Server state in React Query, client state in Zustand.
**Rationale**: Industry standard, handles caching, invalidation, loading states.
**Status**: Active. Working well.

### Inline Schemas vs Centralized
**Decision**: Router handlers define inline BaseModel schemas.
**Rationale**: Faster development, schemas close to usage.
**Status**: Active. `app/schemas/` exists but is orphaned — should be removed or adopted.

## Context

### Known Issues
1. **Async deps.py** — defines async `get_current_user` incompatible with sync DB layer. Unused but confusing.
2. **Orphaned schemas** — `app/schemas/` has rich Pydantic models never imported.
3. **Hardcoded SECRET_KEY** — in both `core/security.py` and `core/config.py`.
4. **No migrations** — Alembic configured but zero versions.
5. **Mock data pages** — Marketing frontend page doesn't call real APIs. Warehouse PartMovements tab not yet implemented.
6. **Missing CRUD** — Several entities lack full CRUD.

### Environment
- Local dev: `localhost:3000` (frontend), `localhost:8001` (backend)
- Docker compose available but not primary workflow
- Python 3.9, Node 18+

### Seed Data
- Admin: `admin@autocrm.ru` / `admin123`
- 5 clients, 4 vehicles, 5 services, 4 orders, 6 transactions, 5 parts, 3 staff

## Completed Milestones
- v1.0.0 MVP: All core CRM features working
- Phase 1.1: CRUD Operations (soft delete, edit/delete for Clients/Warehouse/WorkOrders)
- Phase 1.3: Real Analytics Data (RFM, retention, revenue, sources, activity feed)
