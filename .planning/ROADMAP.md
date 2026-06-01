# autoCRM Roadmap

## Milestone 1: Close Technical Gaps
> Fix incomplete CRUD, wire mock pages, enforce auth.

### Phase 1.1: Complete CRUD Operations
**Goal**: Add missing PUT/DELETE endpoints for core entities.

- Backend: PUT/DELETE `/clients/{id}`
- Backend: PUT/DELETE `/vehicles/{id}`
- Backend: PUT/DELETE `/parts/{id}`
- Backend: DELETE `/work-orders/{id}`
- Frontend: Wire update/delete in ClientsPage, WarehousePage
- UAT: All entities can be fully managed via UI

### Phase 1.2: Wire Warehouse & Marketing
**Goal**: Replace mock data with real API calls.

- Backend: CRUD for PartMovement (write-off, restock, link to work order)
- Backend: Campaigns API (create, list, update status)
- Frontend: Replace mockParts in WarehousePage with real API
- Frontend: Replace mockCampaigns in MarketingPage with real API
- UAT: Warehouse and Marketing show real persisted data

### Phase 1.3: Real Analytics Data
**Goal**: Connect dashboard and analytics to real backend data.

- Backend: Endpoint for recent activity feed
- Frontend: Replace static recent activity in DashboardPage
- Frontend: Wire RFM/retention/revenue charts to real API
- UAT: All charts and KPIs reflect actual database state

### Phase 1.4: Enforce Authentication
**Goal**: Secure all API endpoints.

- Backend: Apply `get_current_user` dependency to all routers
- Backend: Fix async/sync mismatch in deps.py
- Frontend: Add protected route wrapper
- Frontend: Handle 401 globally (redirect to login)
- UAT: Unauthenticated requests return 401; UI redirects

---

## Milestone 2: New Features
> Expand functionality beyond MVP.

### Phase 2.1: Telegram Bot
**Goal**: Full-featured Telegram bot for clients.

- Bot: Check order status by order number
- Bot: Receive notifications on status changes
- Bot: Book appointment (simple flow)
- Backend: Webhook handler for bot updates
- UAT: Client can interact with bot end-to-end

### Phase 2.2: SMS Notifications
**Goal**: Automated SMS to clients on order updates.

- Backend: Trigger SMS on work order status change
- Backend: Configurable SMS templates per status
- Frontend: Toggle SMS per order + template editor
- UAT: Status change sends SMS; logs visible in UI

### Phase 2.3: Receipt Integration
**Goal**: Full receipt lifecycle.

- Backend: Link receipts to payments
- Frontend: Receipt preview before print
- Frontend: Receipt history per client/order
- UAT: Receipt created, printed, archived correctly

### Phase 2.4: Settings Persistence
**Goal**: Save profile and company settings.

- Backend: PUT endpoints for user profile and company settings
- Frontend: Wire SettingsPage forms to API
- Frontend: Company info used in receipts and UI
- UAT: Changes persist after reload

---

## Milestone 3: Quality & Infrastructure
> Harden the application for production.

### Phase 3.1: Testing
**Goal**: Comprehensive test coverage.

- Backend: Unit tests for models and services
- Backend: Integration tests for API endpoints
- Frontend: Component tests for critical UI
- UAT: CI runs tests on every commit

### Phase 3.2: CI/CD
**Goal**: Automated build and deploy pipeline.

- GitHub Actions: Lint, test, build
- Docker: Multi-stage builds
- Deploy: Staging environment
- UAT: Push to main triggers deploy

### Phase 3.3: API Documentation
**Goal**: Professional API docs.

- OpenAPI: Add descriptions and examples to all endpoints
- OpenAPI: Add auth schema (Bearer token)
- Docs: Generate and host ReDoc/Swagger UI
- UAT: Docs are accurate and complete

---

## Backlog (Unprioritized)
- Email notifications
- Role-based access control (admin/manager/mechanic)
- Pagination on all list endpoints
- Token refresh / auto-logout
- Registration page
- WebSocket real-time updates
- Multi-location support
- Inventory forecasting
- Customer loyalty program
- Mobile app (React Native / PWA)
