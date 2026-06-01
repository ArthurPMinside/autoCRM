# autoCRM Requirements

## Functional Requirements

### Clients
- [x] Create client with name, phone, email
- [x] View client list with search
- [x] View client detail with vehicles and orders
- [x] Auto-calculate total visits, revenue, last visit
- [ ] Update client info
- [ ] Delete client (with cascade or archive)

### Vehicles
- [x] Create vehicle linked to client
- [x] View vehicles by client
- [ ] Update vehicle info
- [ ] Delete vehicle

### Services
- [x] Full CRUD for service catalog
- [x] Price and duration per service

### Work Orders
- [x] Create order with client, vehicle, service, mechanic, date
- [x] Update order status (pending → in_progress → completed/cancelled)
- [x] Edit order fields
- [x] Auto-calculate total cost from service price
- [x] Schedule view with duration visualization
- [ ] Delete order
- [ ] Duplicate order

### Staff
- [x] Full CRUD for mechanics/admins
- [x] Commission rate per staff
- [x] Monthly salary calculator

### Finance
- [x] Record income/expense transactions
- [x] Category filtering
- [x] Balance overview
- [ ] Payment records per order
- [ ] Expense tracking with categories

### Warehouse
- [x] Parts catalog with quantities
- [x] Low stock alerts
- [ ] Part movements (write-off, restock)
- [ ] Link parts to work orders

### Marketing
- [x] Marketing source tracking on orders
- [x] Source analytics
- [ ] Campaign management
- [ ] Template library
- [ ] Audience segmentation

### Notifications
- [x] Manual SMS sending
- [ ] Automated SMS on status change
- [ ] Telegram bot notifications
- [ ] Email notifications

### Receipts
- [x] Generate receipt from order
- [x] Print receipt
- [ ] Receipt history
- [ ] Fiscal integration

### Analytics
- [x] Dashboard KPIs
- [x] Revenue analytics
- [x] RFM segmentation
- [x] Retention analysis
- [x] Marketing source attribution
- [ ] Forecasting

## Non-Functional Requirements

### Performance
- Page load < 2s
- API response < 500ms for standard queries
- Support up to 10k clients without pagination (interim)

### Security
- JWT token expiration (currently missing)
- Password hashing (bcrypt)
- HTTPS in production
- Input validation on all endpoints
- Auth enforced on all API routes

### Usability
- Mobile-first responsive design
- Dark/light theme
- Toast notifications for actions
- Form validation with clear errors

### Reliability
- Database backups
- Graceful error handling
- No unhandled exceptions in UI

### Maintainability
- Consistent code style
- Type safety (minimize `any`)
- Separated concerns (API/ui/state)
- Documented API (OpenAPI)
