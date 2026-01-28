# Dokumentacja CRM - Specyfikacja dla Developera

## Spis Treści
1. [Przegląd Systemu](#przegląd-systemu)
2. [Struktura Bazy Danych](#struktura-bazy-danych)
3. [Role i Uprawnienia](#role-i-uprawnienia)
4. [Flow Procesów](#flow-procesów)
5. [Stack Technologiczny](#stack-technologiczny)

---

## Przegląd Systemu

### Cel Aplikacji
System CRM do zarządzania leadami w procesie sprzedaży samochodów importowanych. System obsługuje trzy role użytkowników: Manager, User (sprzedawca), Bidder (licytant).

### Główne Funkcjonalności
- Zarządzanie leadami (dodawanie, edycja, historia zmian)
- Pipeline sprzedażowy w formie Kanban
- Import leadów z CSV
- Moduł licytacji dla Bidder
- Panel statystyk dla Manager
- System rezygnacji z podziałem na przyczyny
- Wielopoziomowy system uprawnień

---

## Struktura Bazy Danych

### Tabela: `users`
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

**Pola:**
- `id` - Unikalny identyfikator użytkownika
- `email` - Email (login), musi być unikalny
- `password_hash` - Zahashowane hasło (bcrypt)
- `name` - Imię i nazwisko użytkownika
- `role` - Rola: 'manager', 'user', 'bidder'
- `is_active` - Czy konto jest aktywne (soft delete)
- `created_at` - Data utworzenia konta

---

### Tabela: `leads`
```sql
CREATE TABLE leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    vehicle TEXT NOT NULL,
    budget INTEGER,
    final_budget INTEGER,
    year_model INTEGER,
    mileage INTEGER,
    equipment TEXT,
    client_trigger TEXT,
    status TEXT NOT NULL DEFAULT 'wants_car' CHECK(status IN (
        'wants_car',
        'searching_no_contract',
        'contract_sent',
        'contract_signed',
        'deposit',
        'bidding_order',
        'won'
    )),
    resignation_status TEXT CHECK(resignation_status IN (
        'bought_in_poland',
        'no_import',
        'resigns_completely',
        'wants_new_car',
        'wants_leasing'
    )),
    is_resigned BOOLEAN DEFAULT false,
    first_contact_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    next_contact_date TIMESTAMP,
    comment TEXT,
    assigned_user_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_user_id) REFERENCES users(id)
);
```

**Pola:**
- `id` - Unikalny identyfikator leada
- `first_name` - Imię klienta
- `last_name` - Nazwisko klienta
- `phone` - Numer telefonu
- `email` - Email klienta
- `vehicle` - Model pojazdu
- `budget` - Budżet klienta (ustawiany przez User)
- `final_budget` - Finalny budżet (edytowalny przez Bidder)
- `year_model` - Rocznik pojazdu
- `mileage` - Przebieg w km
- `equipment` - Wyposażenie pojazdu (pole tekstowe)
- `client_trigger` - Psychologia klienta, jego motywacje
- `status` - Aktualny status w pipeline
- `resignation_status` - Powód rezygnacji (jeśli `is_resigned = true`)
- `is_resigned` - Czy lead zrezygnował
- `first_contact_date` - Data dodania leada (automatyczna)
- `next_contact_date` - Zaplanowana data kolejnego kontaktu
- `comment` - Komentarz do leada
- `assigned_user_id` - ID użytkownika, do którego przypisany jest lead
- `created_at` - Data utworzenia
- `updated_at` - Data ostatniej aktualizacji

**Statusy Pipeline:**
1. `wants_car` - Chce auto
2. `searching_no_contract` - Szukanie bez umowy
3. `contract_sent` - Umowa wysłana
4. `contract_signed` - Umowa podpisana
5. `deposit` - Depozyt
6. `bidding_order` - Zlecenie licytacji
7. `won` - Wygrana

**Statusy Rezygnacji:**
1. `bought_in_poland` - Kupił w Polsce
2. `no_import` - Nie chce importu
3. `resigns_completely` - Rezygnuje całkowicie z auta
4. `wants_new_car` - Chce nowe auto
5. `wants_leasing` - Chce leasing

---

### Tabela: `lead_history`
```sql
CREATE TABLE lead_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    user_role TEXT NOT NULL,
    user_name TEXT NOT NULL,
    field_changed TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    change_type TEXT NOT NULL CHECK(change_type IN (
        'status_change',
        'field_update',
        'comment_added',
        'contact_scheduled',
        'lead_created',
        'resigned',
        'restored'
    )),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Pola:**
- `id` - Unikalny identyfikator wpisu
- `lead_id` - ID leada
- `user_id` - ID użytkownika, który dokonał zmiany
- `user_role` - Rola użytkownika w momencie zmiany
- `user_name` - Imię użytkownika (denormalizacja dla historii)
- `field_changed` - Nazwa zmienionego pola
- `old_value` - Poprzednia wartość
- `new_value` - Nowa wartość
- `change_type` - Typ zmiany
- `timestamp` - Data i czas zmiany

---

### Tabela: `bidding_pipeline`
```sql
CREATE TABLE bidding_pipeline (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER NOT NULL UNIQUE,
    bidder_id INTEGER NOT NULL,
    bidding_status TEXT NOT NULL DEFAULT 'pending' CHECK(bidding_status IN (
        'pending',
        'carfax_ok',
        'won',
        'lost'
    )),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (bidder_id) REFERENCES users(id)
);
```

**Pola:**
- `id` - Unikalny identyfikator
- `lead_id` - ID leada (unikalny, każdy lead może być tylko raz w bidding)
- `bidder_id` - ID licytanta przypisanego do leada
- `bidding_status` - Status w procesie licytacji
- `notes` - Notatki licytanta
- `created_at` - Data rozpoczęcia licytacji
- `updated_at` - Data ostatniej aktualizacji

---

## Role i Uprawnienia

### Manager
**Uprawnienia:**
- ✅ Przeglądanie wszystkich leadów
- ✅ Edycja wszystkich leadów
- ✅ Tworzenie, edycja, dezaktywacja użytkowników (User i Bidder)
- ✅ Przypisywanie leadów do użytkowników
- ✅ Przeglądanie statystyk wszystkich użytkowników
- ✅ Wyświetlanie wszystkich rezygnacji
- ✅ Przywracanie leadów z rezygnacji
- ✅ Edycja pola `final_budget`

**Ograniczenia:**
- ❌ Nie może tworzyć innych Managerów

---

### User (Sprzedawca)
**Uprawnienia:**
- ✅ Dodawanie nowych leadów
- ✅ Edycja własnych leadów
- ✅ Przeglądanie leadów innych użytkowników (READ-ONLY)
- ✅ Przenoszenie własnych leadów w pipeline (do etapu `bidding_order`)
- ✅ Wyświetlanie własnych rezygnacji
- ✅ Przeglądanie rezygnacji innych użytkowników (READ-ONLY)
- ✅ Przywracanie własnych leadów z rezygnacji

**Ograniczenia:**
- ❌ Nie może edytować leadów innych użytkowników
- ❌ Nie może edytować pola `final_budget`
- ❌ Nie może tworzyć użytkowników
- ❌ Nie może przenosić leadów innych użytkowników

---

### Bidder (Licytant)
**Uprawnienia:**
- ✅ Przeglądanie wszystkich leadów
- ✅ Edycja leadów w statusach >= `bidding_order`
- ✅ Edycja pola `final_budget` dla leadów w bidding pipeline
- ✅ Aktualizacja statusu bidding (`carfax_ok`, `won`, `lost`)
- ✅ Dodawanie komentarzy do leadów w bidding pipeline
- ✅ Edycja pól: `year_model`, `mileage`, `equipment`, `comment`

**Ograniczenia:**
- ❌ Nie może tworzyć leadów
- ❌ Nie może edytować leadów przed etapem `bidding_order`
- ❌ Nie może tworzyć użytkowników
- ❌ Nie może przenosić leadów w głównym pipeline (przed `bidding_order`)

---

## Flow Procesów

### 1. Flow Leada przez System

```
[User] Dodaje lead
  ↓
status: wants_car
  ↓
[User] Przenosi lead
  ↓
status: searching_no_contract
  ↓
[User] Przenosi lead
  ↓
status: contract_sent
  ↓
[User] Przenosi lead
  ↓
status: contract_signed
  ↓
[User] Przenosi lead
  ↓
status: deposit
  ↓
[User] Przenosi lead
  ↓
status: bidding_order
  ↓
[Lead trafia do Bidder pipeline]
  ↓
[Bidder] Sprawdza Carfax
  ↓
bidding_status: carfax_ok
  ↓
[Bidder] Decyzja:
  ├─→ Wygrana → status: won (koniec procesu)
  └─→ Przegrana → status: contract_signed (wraca do User)
```

### 2. Flow Rezygnacji

```
[User/Manager] Kliknięcie "Rezygnacja" na karcie leada
  ↓
Wybór powodu rezygnacji:
  - Kupił w Polsce
  - Nie chce importu
  - Rezygnuje całkowicie z auta
  - Chce nowe auto
  - Chce leasing
  ↓
Lead oznaczony jako: is_resigned = true
Status pozostaje bez zmian (historia)
  ↓
Lead znika z głównego pipeline
  ↓
Lead widoczny w zakładce "Rezygnacje"
  ↓
[Opcjonalnie] Przywrócenie leada:
  - Kliknięcie "Przywróć"
  - is_resigned = false
  - Lead wraca do pipeline
```

### 3. Flow Zarządzania Użytkownikami (Manager)

```
[Manager] Wchodzi w "Zarządzanie Użytkownikami"
  ↓
[Manager] Klika "Dodaj Użytkownika"
  ↓
Wypełnia formularz:
  - Email
  - Hasło
  - Imię i Nazwisko
  - Rola (User / Bidder)
  ↓
[Manager] Zapisuje
  ↓
Nowy user utworzony
  ↓
[Opcjonalnie] Edycja użytkownika:
  - Zmiana danych
  - Zmiana roli
  - Reset hasła
  ↓
[Opcjonalnie] Dezaktywacja użytkownika:
  - Sprawdzenie czy ma przypisane leady
  - Jeśli TAK: przepisanie leadów na innego usera
  - Jeśli NIE: dezaktywacja (soft delete)
```

### 4. Flow Importu CSV

```
[User/Manager] Wchodzi w "Import CSV"
  ↓
Wybiera plik CSV
  ↓
System wyświetla podgląd:
  - Lista kolumn z CSV
  - Sugerowane mapowanie
  - Pierwsze 5 wierszy
  ↓
[User/Manager] Mapuje kolumny:
  - Imię → first_name
  - Nazwisko → last_name
  - Telefon → phone
  - etc.
  ↓
[User/Manager] Klika "Importuj"
  ↓
System przetwarza:
  1. Walidacja każdego wiersza
  2. Sprawdzenie duplikatów
  3. Import leadów
  4. Utworzenie wpisów w historii
  ↓
Wyświetlenie raportu:
  - Sukces: X leadów
  - Pominięto: Y leadów
  - Błędy: lista błędów
```

---

## Stack Technologiczny - Rekomendacje

### Backend
```
Framework: Python FastAPI lub Node.js Express
Database: SQLite (development) / PostgreSQL (production)
ORM: SQLAlchemy (Python) / Prisma (Node.js)
Auth: JWT (JSON Web Tokens)
Password Hashing: bcrypt
CSV Parsing: pandas (Python) / papaparse (Node.js)
```

### Frontend
```
Framework: React 18+
State Management: React Query + Context API
UI Library: Tailwind CSS
Drag & Drop: react-beautiful-dnd lub @dnd-kit
Forms: React Hook Form + Zod (validation)
Date Picker: react-datepicker
Charts: recharts lub Chart.js
Icons: Lucide React
```

### Deployment
```
Containerization: Docker + Docker Compose
CI/CD: GitHub Actions
Hosting: 
  - Backend: Railway / Render / Fly.io
  - Frontend: Vercel / Netlify
  - Database: Supabase / Neon (PostgreSQL)
```

### Development Tools
```
API Documentation: Swagger / OpenAPI
Testing: pytest (Python) / Jest (Node.js)
Linting: ESLint + Prettier
Type Safety: TypeScript (Frontend), Pydantic (Backend)
```

---

## Dodatkowe Uwagi Implementacyjne

### 1. Bezpieczeństwo
- Wszystkie hasła muszą być hashowane (bcrypt)
- JWT token z expiration time (np. 24h)
- Rate limiting na endpoints logowania
- HTTPS w produkcji
- CORS configuration
- SQL injection prevention (używając ORM)
- XSS prevention (sanityzacja inputów)

### 2. Performance
- Indeksy na kolumnach: `phone`, `email`, `assigned_user_id`, `status`
- Pagination dla list leadów (np. 50 leadów na stronę)
- Caching dla dashboardów statystyk
- Lazy loading dla historii leadów

### 3. User Experience
- Loading states przy wszystkich operacjach async
- Error handling z przyjaznymi komunikatami
- Confirmation modals dla krytycznych akcji (usuwanie, rezygnacja)
- Toast notifications dla sukcesów/błędów
- Keyboard shortcuts (np. Ctrl+S do zapisania)
- Mobile responsive design

### 4. Data Integrity
- Foreign key constraints
- Transaction handling dla importu CSV
- Soft deletes zamiast hard deletes (is_active flag)
- Audit trail (lead_history table)
- Backup strategy

### 5. Skalowanie
- Struktura bazy danych gotowa na miliony rekordów
- Możliwość dodania sharding dla leadów
- Kolejka zadań dla długich operacji (np. import CSV)
- Websockets dla real-time updates w Kanban

---

## Przykładowe Workflow dla Claude Code

### Krok 1: Setup Projektu
```bash
# Backend (Python FastAPI)
mkdir crm-backend
cd crm-backend
python -m venv venv
source venv/bin/activate
pip install fastapi uvicorn sqlalchemy pydantic bcrypt pyjwt python-multipart pandas

# Frontend (React)
cd ..
npx create-react-app crm-frontend
cd crm-frontend
npm install react-query react-router-dom tailwindcss @dnd-kit/core react-hook-form zod
```

### Krok 2: Struktura Folderów

**Backend:**
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

**Frontend:**
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

---

## Gotowe do Implementacji

Ta dokumentacja zawiera wszystkie informacje potrzebne do implementacji systemu CRM:
- ✅ Kompletna struktura bazy danych
- ✅ Szczegółowe API endpoints
- ✅ Role i uprawnienia
- ✅ Flow procesów biznesowych
- ✅ Stack technologiczny
- ✅ Uwagi implementacyjne

**Instrukcja dla Claude Code:**
"Zaimplementuj system CRM zgodnie z załączoną dokumentacją. Zacznij od setup projektu, potem backend (modele, API), następnie frontend (komponenty, routing, integracja z API)."
