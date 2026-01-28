# Dokumentacja API - CRM System

## Spis Treści
- [Autentykacja](#autentykacja)
- [Zarządzanie Użytkownikami](#zarządzanie-użytkownikami)
- [Zarządzanie Leadami](#zarządzanie-leadami)
- [Pipeline Kanban](#pipeline-kanban)
- [Import CSV](#import-csv)
- [Filtrowanie po Dacie](#filtrowanie-po-dacie)
- [Wyszukiwanie](#wyszukiwanie)
- [Rezygnacje](#rezygnacje)
- [Panel Bidder](#panel-bidder)
- [Panel Manager - Statystyki](#panel-manager---statystyki)
- [Panel User](#panel-user)

---

## Autentykacja

### `POST /auth/login`
**Opis:** Logowanie użytkownika

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "Jan Kowalski",
    "email": "user@example.com",
    "role": "user"
  }
}
```

**Response (401):**
```json
{
  "error": "Nieprawidłowy email lub hasło"
}
```

---

### `POST /auth/logout`
**Opis:** Wylogowanie użytkownika (opcjonalne - frontend usuwa token)

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Wylogowano pomyślnie"
}
```

---

## Zarządzanie Użytkownikami

### `GET /manager/users`
**Opis:** Lista wszystkich użytkowników

**Headers:**
```
Authorization: Bearer {token}
```

**Permissions:** Tylko Manager

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Jan Kowalski",
    "email": "jan@firma.pl",
    "role": "user",
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z",
    "leads_count": 24
  },
  {
    "id": 2,
    "name": "Piotr Licytant",
    "email": "piotr@firma.pl",
    "role": "bidder",
    "is_active": true,
    "created_at": "2024-01-16T11:00:00Z",
    "leads_count": 0
  }
]
```

---

### `POST /manager/users/create`
**Opis:** Tworzenie nowego użytkownika

**Headers:**
```
Authorization: Bearer {token}
```

**Permissions:** Tylko Manager

**Request Body:**
```json
{
  "email": "nowy@firma.pl",
  "password": "password123",
  "name": "Anna Nowak",
  "role": "user"
}
```

**Validation:**
- `email`: required, format email, unique
- `password`: required, min 8 znaków
- `name`: required, min 2 znaki
- `role`: required, enum: 'user' | 'bidder'

**Response (201):**
```json
{
  "id": 3,
  "name": "Anna Nowak",
  "email": "nowy@firma.pl",
  "role": "user",
  "is_active": true,
  "created_at": "2024-01-28T14:30:00Z"
}
```

**Response (400):**
```json
{
  "error": "Email już istnieje w systemie"
}
```

---

### `PUT /manager/users/{user_id}`
**Opis:** Edycja użytkownika

**Headers:**
```
Authorization: Bearer {token}
```

**Permissions:** Tylko Manager

**Request Body (wszystkie pola opcjonalne):**
```json
{
  "name": "Anna Kowalska",
  "role": "bidder",
  "password": "newpassword123",
  "is_active": false
}
```

**Response (200):**
```json
{
  "id": 3,
  "name": "Anna Kowalska",
  "email": "nowy@firma.pl",
  "role": "bidder",
  "is_active": false,
  "updated_at": "2024-01-28T15:00:00Z"
}
```

---

### `DELETE /manager/users/{user_id}`
**Opis:** Dezaktywacja użytkownika (soft delete)

**Headers:**
```
Authorization: Bearer {token}
```

**Permissions:** Tylko Manager

**Response (200):**
```json
{
  "message": "Użytkownik został dezaktywowany"
}
```

**Response (400):**
```json
{
  "error": "Użytkownik ma przypisane aktywne leady. Najpierw przepisz je na innego użytkownika."
}
```

---

## Zarządzanie Leadami

### `POST /leads`
**Opis:** Dodawanie nowego leada

**Headers:**
```
Authorization: Bearer {token}
```

**Permissions:** User, Manager

**Request Body:**
```json
{
  "first_name": "Jan",
  "last_name": "Kowalski",
  "phone": "+48123456789",
  "email": "jan@example.com",
  "vehicle": "BMW X5",
  "budget": 150000,
  "year_model": 2020,
  "mileage": 45000,
  "equipment": "Autopilot, Premium Interior",
  "client_trigger": "Chce oszczędzić na ubezpieczeniu",
  "next_contact_date": "2024-02-01T10:00:00Z",
  "comment": "Klient bardzo zainteresowany",
  "assigned_user_id": 1
}
```

**Pola required:**
- `first_name`, `last_name`, `phone`, `vehicle`

**Pola opcjonalne:**
- `email`, `budget`, `year_model`, `mileage`, `equipment`, `client_trigger`, `next_contact_date`, `comment`
- `assigned_user_id` (jeśli nie podano, przypisuje do zalogowanego usera)

**Process:**
1. Walidacja danych
2. Sprawdzenie duplikatów (po `phone` i `email`)
3. Utworzenie leada z `status = 'wants_car'` i `first_contact_date = now()`
4. Utworzenie wpisu w `lead_history` (typ: `lead_created`)

**Response (201):**
```json
{
  "id": 123,
  "first_name": "Jan",
  "last_name": "Kowalski",
  "phone": "+48123456789",
  "email": "jan@example.com",
  "vehicle": "BMW X5",
  "budget": 150000,
  "final_budget": null,
  "year_model": 2020,
  "mileage": 45000,
  "equipment": "Autopilot, Premium Interior",
  "client_trigger": "Chce oszczędzić na ubezpieczeniu",
  "status": "wants_car",
  "is_resigned": false,
  "first_contact_date": "2024-01-28T14:30:00Z",
  "next_contact_date": "2024-02-01T10:00:00Z",
  "comment": "Klient bardzo zainteresowany",
  "assigned_user_id": 1,
  "created_at": "2024-01-28T14:30:00Z"
}
```

**Response (400):**
```json
{
  "error": "Lead z tym numerem telefonu już istnieje"
}
```

---

### `GET /leads`
**Opis:** Lista leadów

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `view_mode`: 'my' | 'all' (default: 'my')
- `status`: filtrowanie po statusie (opcjonalnie)
- `assigned_user_id`: filtrowanie po użytkowniku (opcjonalnie, tylko Manager)

**Permissions:**
- User: może zobaczyć własne (`my`) lub wszystkie (`all`) - leady innych tylko READ-ONLY
- Manager: widzi wszystkie
- Bidder: widzi wszystkie

**Response (200):**
```json
[
  {
    "id": 123,
    "first_name": "Jan",
    "last_name": "Kowalski",
    "phone": "+48123456789",
    "vehicle": "BMW X5",
    "status": "contract_sent",
    "assigned_user_id": 1,
    "assigned_user_name": "Anna Nowak",
    "can_edit": true,
    "is_mine": true
  },
  {
    "id": 124,
    "first_name": "Piotr",
    "last_name": "Maj",
    "phone": "+48987654321",
    "vehicle": "Tesla Model 3",
    "status": "wants_car",
    "assigned_user_id": 2,
    "assigned_user_name": "Jan Kowalski",
    "can_edit": false,
    "is_mine": false
  }
]
```

---

### `GET /leads/{id}`
**Opis:** Szczegóły leada

**Headers:**
```
Authorization: Bearer {token}
```

**Permissions:** Wszyscy (z odpowiednimi flagami uprawnień)

**Response (200):**
```json
{
  "id": 123,
  "first_name": "Jan",
  "last_name": "Kowalski",
  "phone": "+48123456789",
  "email": "jan@example.com",
  "vehicle": "BMW X5",
  "budget": 150000,
  "final_budget": 148000,
  "year_model": 2020,
  "mileage": 45000,
  "equipment": "Autopilot, Premium Interior",
  "client_trigger": "Chce oszczędzić na ubezpieczeniu",
  "status": "bidding_order",
  "resignation_status": null,
  "is_resigned": false,
  "first_contact_date": "2024-01-28T14:30:00Z",
  "next_contact_date": "2024-02-01T10:00:00Z",
  "comment": "Klient bardzo zainteresowany",
  "assigned_user_id": 1,
  "assigned_user_name": "Anna Nowak",
  "created_at": "2024-01-28T14:30:00Z",
  "updated_at": "2024-01-28T16:00:00Z",
  "permissions": {
    "can_edit": true,
    "can_edit_final_budget": true,
    "can_change_status": true,
    "can_delete": false
  }
}
```

**Logika permissions:**
```javascript
if (user_role === 'manager') {
  permissions = { can_edit: true, can_edit_final_budget: true, can_change_status: true, can_delete: true }
}
else if (user_role === 'user') {
  permissions = {
    can_edit: (lead.assigned_user_id === user_id),
    can_edit_final_budget: false,
    can_change_status: (lead.assigned_user_id === user_id),
    can_delete: false
  }
}
else if (user_role === 'bidder') {
  permissions = {
    can_edit: (lead.status >= 'bidding_order'),
    can_edit_final_budget: true,
    can_change_status: (lead.status >= 'bidding_order'),
    can_delete: false
  }
}
```

---

### `PUT /leads/{id}`
**Opis:** Edycja leada

**Headers:**
```
Authorization: Bearer {token}
```

**Permissions:**
- Manager: może edytować wszystko
- User: może edytować tylko własne leady (oprócz `final_budget`)
- Bidder: może edytować tylko leady w statusach >= `bidding_order`

**Request Body (wszystkie pola opcjonalne):**
```json
{
  "first_name": "Jan",
  "phone": "+48111222333",
  "budget": 155000,
  "final_budget": 150000,
  "year_model": 2021,
  "mileage": 40000,
  "equipment": "Full opcja",
  "client_trigger": "Szuka auta dla syna",
  "next_contact_date": "2024-02-05T10:00:00Z",
  "comment": "Nowy komentarz"
}
```

**Process:**
1. Sprawdzenie uprawnień
2. Zapisanie zmian
3. Dla każdego zmienionego pola: wpis w `lead_history` z `user_id`, `user_role`, `user_name`
4. Aktualizacja `updated_at`

**Response (200):**
```json
{
  "id": 123,
  ...updated_lead_data
}
```

**Response (403):**
```json
{
  "error": "Nie możesz edytować leadów innych użytkowników"
}
```
lub
```json
{
  "error": "Nie masz uprawnień do edycji finalnego budżetu"
}
```
lub
```json
{
  "error": "Możesz edytować tylko leady w etapie licytacji lub dalej"
}
```

---

### `GET /leads/{id}/history`
**Opis:** Historia zmian leada

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
[
  {
    "id": 1,
    "timestamp": "2024-01-28T14:30:00Z",
    "user_name": "Anna Nowak",
    "user_role": "user",
    "change_type": "lead_created",
    "field_changed": null,
    "old_value": null,
    "new_value": null
  },
  {
    "id": 2,
    "timestamp": "2024-01-28T15:00:00Z",
    "user_name": "Anna Nowak",
    "user_role": "user",
    "change_type": "field_update",
    "field_changed": "phone",
    "old_value": "+48123456789",
    "new_value": "+48111222333"
  },
  {
    "id": 3,
    "timestamp": "2024-01-28T16:00:00Z",
    "user_name": "Piotr Licytant",
    "user_role": "bidder",
    "change_type": "field_update",
    "field_changed": "final_budget",
    "old_value": "150000",
    "new_value": "148000"
  }
]
```

---

## Pipeline Kanban

### `GET /pipeline`
**Opis:** Leady pogrupowane po statusach (dla widoku Kanban)

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `user_id`: filtrowanie po użytkowniku (opcjonalnie, tylko Manager)

**Permissions:**
- User: widzi tylko własne leady
- Manager: widzi wszystkie lub filtrowane po użytkowniku
- Bidder: widzi leady >= `bidding_order`

**Response (200):**
```json
{
  "wants_car": [
    {
      "id": 123,
      "first_name": "Jan",
      "last_name": "Kowalski",
      "vehicle": "BMW X5"
    }
  ],
  "searching_no_contract": [],
  "contract_sent": [
    {
      "id": 124,
      "first_name": "Anna",
      "last_name": "Nowak",
      "vehicle": "Tesla Model 3"
    }
  ],
  "contract_signed": [],
  "deposit": [],
  "bidding_order": [],
  "won": []
}
```

---

### `POST /leads/{id}/move`
**Opis:** Przeniesienie leada do innego statusu (drag & drop w Kanban)

**Headers:**
```
Authorization: Bearer {token}
```

**Permissions:**
- User: może przenosić tylko własne leady
- Manager: może przenosić wszystkie leady
- Bidder: może przenosić tylko leady w bidding pipeline

**Request Body:**
```json
{
  "new_status": "contract_sent"
}
```

**Process:**
1. Sprawdzenie uprawnień
2. Zmiana statusu
3. Wpis w `lead_history` (typ: `status_change`)
4. Jeśli `new_status = 'bidding_order'`: utworzenie wpisu w `bidding_pipeline`

**Response (200):**
```json
{
  "id": 123,
  "status": "contract_sent",
  "updated_at": "2024-01-28T17:00:00Z"
}
```

---

## Import CSV

### `POST /leads/import/preview`
**Opis:** Podgląd kolumn z CSV przed importem

**Headers:**
```
Authorization: Bearer {token}
```

**Permissions:** User, Manager

**Request Body (multipart/form-data):**
```
file: [CSV file]
```

**Response (200):**
```json
{
  "columns": ["Imię", "Nazwisko", "Telefon", "Email", "Auto", "Budżet", "Notatka"],
  "suggested_mapping": {
    "Imię": "first_name",
    "Nazwisko": "last_name",
    "Telefon": "phone",
    "Email": "email",
    "Auto": "vehicle",
    "Budżet": "budget",
    "Notatka": "comment"
  },
  "preview_rows": [
    ["Jan", "Kowalski", "123456789", "jan@example.com", "BMW X5", "150000", "Pilne"],
    ["Anna", "Nowak", "987654321", "anna@example.com", "Audi A4", "120000", ""]
  ]
}
```

---

### `POST /leads/import/execute`
**Opis:** Wykonanie importu CSV

**Headers:**
```
Authorization: Bearer {token}
```

**Permissions:** User, Manager

**Request Body (multipart/form-data):**
```
file: [CSV file]
mapping: {
  "Imię": "first_name",
  "Nazwisko": "last_name",
  "Telefon": "phone",
  "Email": "email",
  "Auto": "vehicle",
  "Budżet": "budget"
}
```

**Process:**
1. Parsowanie CSV
2. Walidacja każdego wiersza
3. Sprawdzenie duplikatów (po `phone` i `email`) - pomijanie lub merge
4. Bulk insert do `leads`
5. Bulk insert do `lead_history` (typ: `lead_created`)

**Response (200):**
```json
{
  "success_count": 145,
  "skipped_count": 5,
  "errors": [
    {
      "row": 12,
      "error": "Brak wymaganego pola: phone"
    },
    {
      "row": 34,
      "error": "Duplikat numeru telefonu: +48123456789"
    }
  ]
}
```

---

## Filtrowanie po Dacie

### `GET /leads/by-date`
**Opis:** Leady filtrowane po dacie następnego kontaktu

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `filter`: 'today' | 'overdue' | 'upcoming' (required)
- `user_id`: filtrowanie po użytkowniku (opcjonalnie, tylko Manager)

**Logika filtrowania:**
- `today`: `next_contact_date = DATE(now())`
- `overdue`: `next_contact_date < DATE(now()) AND next_contact_date IS NOT NULL`
- `upcoming`: `next_contact_date > DATE(now())`

**Permissions:**
- User: widzi tylko własne leady
- Manager: widzi wszystkie lub filtrowane po użytkowniku

**Response (200):**
```json
[
  {
    "id": 123,
    "first_name": "Jan",
    "last_name": "Kowalski",
    "phone": "+48123456789",
    "vehicle": "BMW X5",
    "status": "contract_sent",
    "next_contact_date": "2024-01-28T10:00:00Z",
    "assigned_user_name": "Anna Nowak"
  }
]
```

---

## Wyszukiwanie

### `GET /leads/search`
**Opis:** Wyszukiwanie leadów po numerze telefonu lub email

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters (co najmniej jeden):**
- `phone`: numer telefonu (opcjonalnie)
- `email`: adres email (opcjonalnie)

**Response (200):**
```json
[
  {
    "id": 123,
    "first_name": "Jan",
    "last_name": "Kowalski",
    "phone": "+48123456789",
    "email": "jan@example.com",
    "vehicle": "BMW X5",
    "status": "contract_sent",
    "assigned_user_name": "Anna Nowak"
  }
]
```

---

## Rezygnacje

### `POST /leads/{id}/resign`
**Opis:** Oznaczenie leada jako rezygnacja

**Headers:**
```
Authorization: Bearer {token}
```

**Permissions:**
- User: może oznaczać tylko własne leady
- Manager: może oznaczać wszystkie leady

**Request Body:**
```json
{
  "resignation_status": "bought_in_poland"
}
```

**Możliwe wartości `resignation_status`:**
- `bought_in_poland`
- `no_import`
- `resigns_completely`
- `wants_new_car`
- `wants_leasing`

**Process:**
1. Ustawienie `is_resigned = true`
2. Ustawienie `resignation_status`
3. Status pozostaje bez zmian (zachowujemy historię)
4. Wpis w `lead_history` (typ: `resigned`)

**Response (200):**
```json
{
  "id": 123,
  "is_resigned": true,
  "resignation_status": "bought_in_poland",
  "updated_at": "2024-01-28T18:00:00Z"
}
```

---

### `POST /leads/{id}/restore`
**Opis:** Przywrócenie leada z rezygnacji

**Headers:**
```
Authorization: Bearer {token}
```

**Permissions:**
- User: może przywracać tylko własne leady
- Manager: może przywracać wszystkie leady

**Process:**
1. Ustawienie `is_resigned = false`
2. Wyczyszczenie `resignation_status = null`
3. Wpis w `lead_history` (typ: `restored`)

**Response (200):**
```json
{
  "id": 123,
  "is_resigned": false,
  "resignation_status": null,
  "updated_at": "2024-01-28T18:30:00Z"
}
```

---

### `GET /leads/resigned`
**Opis:** Lista leadów z rezygnacją

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `user_id`: filtrowanie po użytkowniku (opcjonalnie, tylko Manager)

**Permissions:**
- User: widzi tylko własne rezygnacje
- Manager: widzi wszystkie lub filtrowane po użytkowniku

**Response (200):**
```json
{
  "bought_in_poland": [
    {
      "id": 123,
      "first_name": "Jan",
      "last_name": "Kowalski",
      "phone": "+48123456789",
      "email": "jan@example.com",
      "vehicle": "BMW X5",
      "status": "contract_signed",
      "resignation_status": "bought_in_poland",
      "resignation_date": "2024-01-28T18:00:00Z",
      "assigned_user_name": "Anna Nowak"
    }
  ],
  "no_import": [],
  "resigns_completely": [],
  "wants_new_car": [],
  "wants_leasing": []
}
```

---

## Panel Bidder

### `GET /bidder/pipeline`
**Opis:** Leady w pipeline licytacji

**Headers:**
```
Authorization: Bearer {token}
```

**Permissions:** Tylko Bidder

**Response (200):**
```json
{
  "bidding_order": [
    {
      "id": 123,
      "first_name": "Jan",
      "last_name": "Kowalski",
      "vehicle": "BMW X5",
      "budget": 150000,
      "final_budget": null,
      "bidding_status": "pending"
    }
  ],
  "carfax_ok": [
    {
      "id": 124,
      "first_name": "Anna",
      "last_name": "Nowak",
      "vehicle": "Audi A4",
      "budget": 120000,
      "final_budget": 118000,
      "bidding_status": "carfax_ok"
    }
  ],
  "won": []
}
```

---

### `POST /bidder/leads/{id}/update-status`
**Opis:** Aktualizacja statusu licytacji

**Headers:**
```
Authorization: Bearer {token}
```

**Permissions:** Tylko Bidder

**Request Body:**
```json
{
  "bidding_status": "carfax_ok"
}
```

**Możliwe wartości:**
- `carfax_ok` - Carfax OK
- `won` - Wygrana
- `lost` - Przegrana

**Process:**
1. Jeśli `lost`:
   - Zmiana `lead.status = 'contract_signed'`
   - Usunięcie z `bidding_pipeline`
   - Lead wraca do Usera
2. Jeśli `carfax_ok`:
   - Update `bidding_pipeline.bidding_status`
3. Jeśli `won`:
   - Zmiana `lead.status = 'won'`
   - Update `bidding_pipeline.bidding_status`
4. Wpis w `lead_history`

**Response (200):**
```json
{
  "id": 123,
  "status": "won",
  "bidding_status": "won",
  "updated_at": "2024-01-28T19:00:00Z"
}
```

---

## Panel Manager - Statystyki

### `GET /manager/dashboard`
**Opis:** Dashboard z statystykami wszystkich użytkowników

**Headers:**
```
Authorization: Bearer {token}
```

**Permissions:** Tylko Manager

**Response (200):**
```json
{
  "users": [
    {
      "user_id": 1,
      "user_name": "Anna Nowak",
      "stats": {
        "total_leads": 45,
        "by_status": {
          "wants_car": 12,
          "searching_no_contract": 8,
          "contract_sent": 10,
          "contract_signed": 7,
          "deposit": 5,
          "bidding_order": 2,
          "won": 1
        },
        "conversions": {
          "wants_car_to_contract_signed": 45.5,
          "contract_signed_to_won": 12.5
        },
        "avg_time_in_stage": {
          "wants_car": 3.5,
          "searching_no_contract": 5.2,
          "contract_sent": 2.1,
          "contract_signed": 7.8
        }
      }
    }
  ],
  "time_stats": {
    "daily": [
      {
        "date": "2024-01-28",
        "new_leads": 5,
        "won": 1
      },
      {
        "date": "2024-01-27",
        "new_leads": 3,
        "won": 0
      }
    ],
    "weekly": [
      {
        "week": "2024-W04",
        "new_leads": 23,
        "won": 4
      }
    ],
    "monthly": [
      {
        "month": "2024-01",
        "new_leads": 87,
        "won": 12
      }
    ]
  }
}
```

**Kalkulacja konwersji:**
```javascript
conversions.wants_car_to_contract_signed = 
  (leads_in_contract_signed_or_later / total_leads_created) * 100

conversions.contract_signed_to_won = 
  (leads_in_won / leads_in_contract_signed_or_later) * 100
```

**Kalkulacja avg_time_in_stage:**
```javascript
avg_time_in_stage[status] = 
  AVERAGE(time_between_entering_and_leaving_status) in days
```

---

### `GET /manager/users/{user_id}/leads`
**Opis:** Wszystkie leady konkretnego użytkownika

**Headers:**
```
Authorization: Bearer {token}
```

**Permissions:** Tylko Manager

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "name": "Anna Nowak"
  },
  "leads": [
    {
      "id": 123,
      "first_name": "Jan",
      "last_name": "Kowalski",
      "vehicle": "BMW X5",
      "status": "contract_sent",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "stats": {
    ...same_structure_as_dashboard
  }
}
```

---

## Panel User

### `GET /user/dashboard`
**Opis:** Dashboard użytkownika z własnymi leadami

**Headers:**
```
Authorization: Bearer {token}
```

**Permissions:** User

**Response (200):**
```json
{
  "my_leads_count": 24,
  "by_status": {
    "wants_car": 8,
    "searching_no_contract": 5,
    "contract_sent": 6,
    "contract_signed": 3,
    "deposit": 2,
    "bidding_order": 0,
    "won": 0
  },
  "today_contacts": [
    {
      "id": 123,
      "first_name": "Jan",
      "last_name": "Kowalski",
      "vehicle": "BMW X5",
      "next_contact_date": "2024-01-28T10:00:00Z"
    }
  ],
  "overdue_contacts": [
    {
      "id": 124,
      "first_name": "Anna",
      "last_name": "Nowak",
      "vehicle": "Audi A4",
      "next_contact_date": "2024-01-25T14:00:00Z"
    }
  ]
}
```

---

## Middleware - Sprawdzanie Uprawnień

### Przykład Middleware (pseudokod):
```javascript
function checkLeadEditPermissions(req, res, next) {
  const { lead_id } = req.params;
  const { user_id, user_role } = req.user; // z JWT
  const { fields_to_update } = req.body;
  
  // Pobierz lead z bazy
  const lead = db.getLeadById(lead_id);
  
  if (user_role === 'manager') {
    // Manager może wszystko
    return next();
  }
  
  if (user_role === 'user') {
    // User może edytować tylko własne leady
    if (lead.assigned_user_id !== user_id) {
      return res.status(403).json({
        error: "Nie możesz edytować leadów innych użytkowników"
      });
    }
    
    // User nie może edytować final_budget
    if (fields_to_update.includes('final_budget')) {
      return res.status(403).json({
        error: "Nie masz uprawnień do edycji finalnego budżetu"
      });
    }
    
    return next();
  }
  
  if (user_role === 'bidder') {
    // Bidder może edytować tylko leady w bidding pipeline
    if (!['bidding_order', 'won'].includes(lead.status)) {
      return res.status(403).json({
        error: "Możesz edytować tylko leady w etapie licytacji lub dalej"
      });
    }
    
    return next();
  }
  
  return res.status(403).json({ error: "Brak uprawnień" });
}
```
