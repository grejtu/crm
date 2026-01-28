# CLAUDE.md - CRM System Guide for AI Assistants

## Project Overview

This is a **CRM system specification repository** for managing sales leads in an imported car sales business. The repository contains comprehensive documentation for implementing a full-stack lead management application with three user roles: Manager, User (salesperson), and Bidder (auction specialist).

**Current State:** Specification/documentation phase only - no implementation code exists yet.

**Primary Language:** Polish (all documentation, UI text, and error messages are in Polish)

---

## Quick Reference

| Aspect | Details |
|--------|---------|
| **Domain** | Car import sales CRM |
| **User Roles** | Manager, User, Bidder |
| **Main Entity** | Leads (sales prospects) |
| **Key Features** | Kanban pipeline, CSV import, bidding workflow, resignation tracking |
| **Documentation Files** | 4 Polish markdown files |

---

## Repository Structure

```
/home/user/crm/
├── CLAUDE.md                        # This file - AI assistant guide
├── CRM_Dokumentacja_Glowna.md       # Main specification - database, roles, workflows
├── CRM_Dokumentacja_API.md          # REST API endpoints (30+ endpoints)
├── CRM_Dokumentacja_UI_UX.md        # UI/UX mockups and component specs
└── CRM_Dokumentacja_Walidacje.md    # Validation rules and permission logic
```

---

## Recommended Technology Stack

### Backend
- **Framework:** Python FastAPI or Node.js Express
- **Database:** SQLite (development) / PostgreSQL (production)
- **ORM:** SQLAlchemy (Python) or Prisma (Node.js)
- **Authentication:** JWT tokens with bcrypt password hashing
- **CSV Parsing:** pandas (Python) or papaparse (Node.js)

### Frontend
- **Framework:** React 18+
- **State Management:** React Query + Context API
- **UI Library:** Tailwind CSS
- **Drag & Drop:** react-beautiful-dnd or @dnd-kit
- **Forms:** React Hook Form + Zod validation
- **Date Picker:** react-datepicker
- **Charts:** recharts or Chart.js
- **Icons:** Lucide React

### Deployment
- **Containerization:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Hosting:** Railway/Render/Fly.io (Backend), Vercel/Netlify (Frontend)
- **Database:** Supabase/Neon (PostgreSQL)

---

## Database Schema

### Core Tables

#### `users`
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('manager', 'user', 'bidder')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `leads`
```sql
CREATE TABLE leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    vehicle TEXT NOT NULL,
    budget INTEGER,
    final_budget INTEGER,                    -- Bidder-only editable
    year_model INTEGER,
    mileage INTEGER,
    equipment TEXT,
    client_trigger TEXT,                     -- Client psychology/motivation
    status TEXT NOT NULL DEFAULT 'wants_car',
    resignation_status TEXT,
    is_resigned BOOLEAN DEFAULT false,
    first_contact_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    next_contact_date TIMESTAMP,
    comment TEXT,
    assigned_user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `lead_history`
```sql
CREATE TABLE lead_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    user_role TEXT NOT NULL,
    user_name TEXT NOT NULL,
    field_changed TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    change_type TEXT NOT NULL,               -- status_change, field_update, etc.
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `bidding_pipeline`
```sql
CREATE TABLE bidding_pipeline (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER NOT NULL UNIQUE REFERENCES leads(id) ON DELETE CASCADE,
    bidder_id INTEGER NOT NULL REFERENCES users(id),
    bidding_status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Lead Status Pipeline (in order)
1. `wants_car` - Chce auto (Wants car)
2. `searching_no_contract` - Szukanie bez umowy (Searching without contract)
3. `contract_sent` - Umowa wysłana (Contract sent)
4. `contract_signed` - Umowa podpisana (Contract signed)
5. `deposit` - Depozyt (Deposit paid)
6. `bidding_order` - Zlecenie licytacji (Bidding order - moves to Bidder)
7. `won` - Wygrana (Won)

### Resignation Statuses
- `bought_in_poland` - Kupil w Polsce
- `no_import` - Nie chce importu
- `resigns_completely` - Rezygnuje calkowicie z auta
- `wants_new_car` - Chce nowe auto
- `wants_leasing` - Chce leasing

### Bidding Statuses
- `pending` - Zlecenie licytacji (awaiting carfax check)
- `carfax_ok` - Carfax OK (ready for bidding)
- `won` - Wygrana (auction won)
- `lost` - Przegrana (lost - returns to User at `contract_signed`)

---

## Role-Based Access Control (RBAC)

### Manager
**Full system access:**
- View/edit ALL leads
- Create/edit/deactivate users (User, Bidder only - not other Managers)
- Assign leads to users
- View all statistics
- Edit `final_budget` field
- Restore resigned leads

### User (Salesperson)
**Own leads focus:**
- Create new leads
- Edit own leads only (except `final_budget`)
- View other users' leads (READ-ONLY)
- Move own leads through pipeline (up to `bidding_order`)
- Mark own leads as resigned
- Restore own leads from resignation

### Bidder (Auction Specialist)
**Bidding pipeline focus:**
- View all leads (READ-ONLY for non-bidding stages)
- Edit leads only at `bidding_order` stage or later
- Edit `final_budget` field
- Edit: `year_model`, `mileage`, `equipment`, `comment`
- Update bidding status (`carfax_ok`, `won`, `lost`)

---

## Key Business Logic Flows

### 1. Lead Lifecycle
```
User creates lead → status: wants_car
     ↓
User progresses through stages (drag & drop in Kanban)
     ↓
At bidding_order → Lead enters Bidder pipeline
     ↓
Bidder checks Carfax → status: carfax_ok
     ↓
Bidder decides:
  - Won → status: won (process complete)
  - Lost → status: contract_signed (returns to User)
```

### 2. Resignation Flow
```
User/Manager marks lead as resigned
     ↓
Sets resignation_status (reason)
     ↓
is_resigned = true (status preserved for history)
     ↓
Lead hidden from main pipeline, visible in Resignations tab
     ↓
Can be restored → is_resigned = false, back to pipeline
```

### 3. CSV Import Flow
```
Upload CSV file
     ↓
System parses and detects columns
     ↓
User maps CSV columns to database fields
     ↓
Preview first rows
     ↓
Validate each row (required fields, format, duplicates)
     ↓
Bulk insert with transaction
     ↓
Report: success count, skipped, errors with row numbers
```

---

## API Endpoints Summary

### Authentication
- `POST /auth/login` - User login (returns JWT)
- `POST /auth/logout` - User logout

### User Management (Manager only)
- `GET /manager/users` - List all users
- `POST /manager/users/create` - Create user
- `PUT /manager/users/{id}` - Edit user
- `DELETE /manager/users/{id}` - Deactivate (soft delete)

### Lead Management
- `POST /leads` - Create lead
- `GET /leads` - List leads (query: `view_mode=my|all`)
- `GET /leads/{id}` - Get lead details (includes permissions object)
- `PUT /leads/{id}` - Edit lead
- `GET /leads/{id}/history` - Lead change history

### Pipeline
- `GET /pipeline` - Kanban view (grouped by status)
- `POST /leads/{id}/move` - Change lead status (drag & drop)

### CSV Import
- `POST /leads/import/preview` - Preview columns and mapping
- `POST /leads/import/execute` - Execute import

### Resignations
- `POST /leads/{id}/resign` - Mark as resigned
- `POST /leads/{id}/restore` - Restore from resignation
- `GET /leads/resigned` - List resigned leads (grouped by reason)

### Bidder Panel
- `GET /bidder/pipeline` - Bidder's pipeline view
- `POST /bidder/leads/{id}/update-status` - Update bidding status

### Statistics (Manager)
- `GET /manager/dashboard` - All users' statistics
- `GET /manager/users/{id}/leads` - Specific user's leads with stats

### User Panel
- `GET /user/dashboard` - Own leads dashboard with contacts

### Search & Filter
- `GET /leads/search` - Search by phone or email
- `GET /leads/by-date` - Filter by contact date (today/overdue/upcoming)

---

## Validation Rules

### User Validation
- `email`: Required, valid format, unique, max 255 chars
- `password`: Required, min 8 chars
- `name`: Required, 2-100 chars, letters/spaces/hyphens only
- `role`: Required, enum: `user` | `bidder`

### Lead Validation
- `first_name`: Required, 2-50 chars
- `last_name`: Required, 2-50 chars
- `phone`: Required, 9-15 digits (with optional +), duplicate check
- `email`: Optional, valid format, duplicate check
- `vehicle`: Required, 2-100 chars
- `budget`: Integer, 0-10,000,000
- `final_budget`: Integer, editable only by Bidder/Manager
- `year_model`: Integer, 1900 to current year + 1
- `mileage`: Integer, 0-1,000,000

### Permission Checks
Always verify before operations:
1. User authentication (valid JWT)
2. Role-based access for endpoint
3. Ownership check for User role (own leads only)
4. Stage check for Bidder role (bidding stages only)
5. Field-level permissions (`final_budget`)

---

## UI/UX Guidelines

### Color Palette
- **Primary Blue** (#3B82F6): Main actions, User role
- **Orange** (#F97316): Bidder role, warnings
- **Gold** (#EAB308): Manager role, premium features
- **Green** (#10B981): Success, positive actions
- **Red** (#EF4444): Errors, resignations
- **Gray** (#6B7280): Neutral, disabled states

### Typography
- Font: Inter
- Headers: 24px, weight 600
- Body: 14px, weight 400
- Labels: 12px, weight 500
- Buttons: 14px, weight 500

### Component Standards
- Buttons: 6px border-radius, 40px height
- Inputs: 4px border-radius, 40px height
- Cards: 8px border-radius, sm shadow, 16px padding
- Modals: Max 500px width, backdrop blur
- Toasts: Top-right, auto-dismiss 5s

### Icons
- Library: Lucide React
- Default size: 20px
- Stroke width: 2

---

## Implementation Recommendations

### Project Structure (Backend - FastAPI)
```
crm-backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── models/
│   │   ├── user.py
│   │   ├── lead.py
│   │   └── lead_history.py
│   ├── schemas/
│   │   ├── user.py
│   │   └── lead.py
│   ├── routers/
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── leads.py
│   │   ├── pipeline.py
│   │   └── bidder.py
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── lead_service.py
│   │   └── stats_service.py
│   └── middleware/
│       └── auth_middleware.py
├── tests/
└── requirements.txt
```

### Project Structure (Frontend - React)
```
crm-frontend/
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   ├── Dashboard/
│   │   ├── Pipeline/
│   │   ├── LeadCard/
│   │   ├── UserManagement/
│   │   └── Statistics/
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Pipeline.jsx
│   │   ├── Leads.jsx
│   │   └── Users.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useLeads.js
│   │   └── usePipeline.js
│   ├── services/
│   │   └── api.js
│   ├── context/
│   │   └── AuthContext.jsx
│   └── utils/
│       ├── validation.js
│       └── formatters.js
└── package.json
```

### Security Considerations
- Hash all passwords with bcrypt
- JWT tokens with reasonable expiration (e.g., 24h)
- Rate limiting on login endpoints
- HTTPS in production
- CORS configuration
- SQL injection prevention (use ORM)
- XSS prevention (sanitize inputs)

### Performance Considerations
- Database indexes on: `phone`, `email`, `assigned_user_id`, `status`
- Pagination for lead lists (50 items per page)
- Caching for dashboard statistics
- Lazy loading for lead history
- Transaction handling for CSV imports

---

## Implementation Roadmap

### Phase 1: Backend Foundation
1. Project setup and database configuration
2. User model and authentication (JWT)
3. Lead model and basic CRUD
4. Lead history tracking

### Phase 2: Core Features
5. Pipeline endpoints (Kanban grouping, status changes)
6. Permission middleware
7. Bidding pipeline logic
8. CSV import with validation

### Phase 3: Frontend
9. Authentication UI (login, token management)
10. Dashboard components
11. Kanban board with drag & drop
12. Lead forms and validation

### Phase 4: Advanced Features
13. User management panel (Manager)
14. Statistics and charts
15. Resignation management
16. Search and filtering

### Phase 5: Polish & Deploy
17. Error handling and user feedback
18. Responsive design
19. Testing (unit, integration)
20. Docker setup and deployment

---

## Common Patterns

### API Response with Permissions
Every lead detail response should include a `permissions` object:
```json
{
  "id": 123,
  "first_name": "Jan",
  ...
  "permissions": {
    "can_edit": true,
    "can_edit_final_budget": false,
    "can_change_status": true,
    "can_delete": false
  }
}
```

### History Entry Creation
Log every change to lead_history:
```javascript
{
  lead_id: 123,
  user_id: currentUser.id,
  user_role: currentUser.role,
  user_name: currentUser.name,
  field_changed: "status",
  old_value: "contract_sent",
  new_value: "contract_signed",
  change_type: "status_change",
  timestamp: new Date()
}
```

### Error Messages (Polish)
All user-facing errors should be in Polish:
- "Email jest wymagany" (Email is required)
- "Nieprawidlowy format email" (Invalid email format)
- "Nie mozesz edytowac leadow innych uzytkownikow" (Cannot edit other users' leads)
- "Lead z tym numerem telefonu juz istnieje" (Lead with this phone already exists)

---

## Notes for AI Assistants

1. **Language**: All user-facing text, error messages, and UI labels must be in Polish
2. **Permissions First**: Always check permissions before any data modification
3. **Audit Trail**: Every lead change must be logged to lead_history
4. **Soft Deletes**: Use `is_active` (users) and `is_resigned` (leads) - never hard delete
5. **Validation Layers**: Validate on frontend (UX), backend (security), and database (constraints)
6. **Status Order Matters**: Lead statuses follow a specific progression through the pipeline
7. **Bidder Boundary**: `bidding_order` is the handoff point between User and Bidder workflows
