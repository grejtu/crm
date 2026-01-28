# Dokumentacja Walidacji - CRM System

## Spis Treści
- [Walidacje Użytkowników](#walidacje-użytkowników)
- [Walidacje Leadów](#walidacje-leadów)
- [Walidacje Rezygnacji](#walidacje-rezygnacji)
- [Walidacje Importu CSV](#walidacje-importu-csv)
- [Walidacje Permissions](#walidacje-permissions)

---

## Walidacje Użytkowników

### Tworzenie Użytkownika (`POST /manager/users/create`)

```javascript
{
  email: {
    required: true,
    error: "Email jest wymagany",
    format: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    error_format: "Nieprawidłowy format email",
    unique: true,
    error_unique: "Email już istnieje w systemie",
    max_length: 255,
    error_max_length: "Email może mieć maksymalnie 255 znaków"
  },
  
  password: {
    required: true,
    error: "Hasło jest wymagane",
    min_length: 8,
    error_min_length: "Hasło musi mieć minimum 8 znaków",
    // Opcjonalne dodatkowe wymagania:
    requires_number: false, // jeśli true: musi zawierać cyfrę
    requires_uppercase: false, // jeśli true: musi zawierać wielką literę
    requires_special: false // jeśli true: musi zawierać znak specjalny
  },
  
  name: {
    required: true,
    error: "Imię i nazwisko jest wymagane",
    min_length: 2,
    error_min_length: "Imię musi mieć minimum 2 znaki",
    max_length: 100,
    error_max_length: "Imię może mieć maksymalnie 100 znaków",
    format: /^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s\-]+$/,
    error_format: "Imię może zawierać tylko litery, spacje i myślniki"
  },
  
  role: {
    required: true,
    error: "Rola jest wymagana",
    enum: ['user', 'bidder'],
    error_enum: "Rola musi być 'user' lub 'bidder'"
  }
}
```

**Przykład walidacji w JavaScript:**
```javascript
function validateUser(data) {
  const errors = {};
  
  // Email
  if (!data.email) {
    errors.email = "Email jest wymagany";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Nieprawidłowy format email";
  } else if (data.email.length > 255) {
    errors.email = "Email może mieć maksymalnie 255 znaków";
  }
  
  // Password
  if (!data.password) {
    errors.password = "Hasło jest wymagane";
  } else if (data.password.length < 8) {
    errors.password = "Hasło musi mieć minimum 8 znaków";
  }
  
  // Name
  if (!data.name) {
    errors.name = "Imię i nazwisko jest wymagane";
  } else if (data.name.length < 2) {
    errors.name = "Imię musi mieć minimum 2 znaki";
  } else if (data.name.length > 100) {
    errors.name = "Imię może mieć maksymalnie 100 znaków";
  }
  
  // Role
  if (!data.role) {
    errors.role = "Rola jest wymagana";
  } else if (!['user', 'bidder'].includes(data.role)) {
    errors.role = "Rola musi być 'user' lub 'bidder'";
  }
  
  return Object.keys(errors).length === 0 ? null : errors;
}
```

---

### Edycja Użytkownika (`PUT /manager/users/{user_id}`)

```javascript
{
  email: {
    required: false, // przy edycji opcjonalne
    format: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    error_format: "Nieprawidłowy format email",
    unique: true, // sprawdź czy nie jest zajęty przez innego użytkownika
    error_unique: "Email już istnieje w systemie",
    max_length: 255
  },
  
  password: {
    required: false, // przy edycji opcjonalne
    min_length: 8,
    error_min_length: "Hasło musi mieć minimum 8 znaków"
  },
  
  name: {
    required: false,
    min_length: 2,
    max_length: 100
  },
  
  role: {
    required: false,
    enum: ['user', 'bidder', 'manager']
  },
  
  is_active: {
    required: false,
    type: 'boolean'
  }
}
```

**Business Logic Validation:**
```javascript
// Sprawdź czy użytkownik ma aktywne leady przed dezaktywacją
if (data.is_active === false) {
  const activeLeads = await db.getLeadCount({ 
    assigned_user_id: user_id, 
    is_resigned: false 
  });
  
  if (activeLeads > 0) {
    throw new Error(
      "Użytkownik ma przypisane aktywne leady. Najpierw przepisz je na innego użytkownika."
    );
  }
}
```

---

## Walidacje Leadów

### Dodawanie Leada (`POST /leads`)

```javascript
{
  first_name: {
    required: true,
    error: "Imię jest wymagane",
    min_length: 2,
    error_min_length: "Imię musi mieć minimum 2 znaki",
    max_length: 50,
    error_max_length: "Imię może mieć maksymalnie 50 znaków",
    format: /^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s\-]+$/,
    error_format: "Imię może zawierać tylko litery, spacje i myślniki"
  },
  
  last_name: {
    required: true,
    error: "Nazwisko jest wymagane",
    min_length: 2,
    error_min_length: "Nazwisko musi mieć minimum 2 znaki",
    max_length: 50,
    error_max_length: "Nazwisko może mieć maksymalnie 50 znaków",
    format: /^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s\-]+$/,
    error_format: "Nazwisko może zawierać tylko litery, spacje i myślniki"
  },
  
  phone: {
    required: true,
    error: "Numer telefonu jest wymagany",
    format: /^\+?[0-9]{9,15}$/,
    error_format: "Nieprawidłowy format numeru telefonu (9-15 cyfr, opcjonalnie +)",
    duplicate_check: true, // sprawdź czy nie istnieje już lead z tym numerem
    error_duplicate: "Lead z tym numerem telefonu już istnieje"
  },
  
  email: {
    required: false,
    format: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    error_format: "Nieprawidłowy format email",
    max_length: 255,
    duplicate_check: true, // sprawdź czy nie istnieje już lead z tym emailem
    error_duplicate: "Lead z tym adresem email już istnieje"
  },
  
  vehicle: {
    required: true,
    error: "Model pojazdu jest wymagany",
    min_length: 2,
    error_min_length: "Model pojazdu musi mieć minimum 2 znaki",
    max_length: 100,
    error_max_length: "Model pojazdu może mieć maksymalnie 100 znaków"
  },
  
  budget: {
    required: false,
    type: 'integer',
    error_type: "Budżet musi być liczbą całkowitą",
    min: 0,
    error_min: "Budżet nie może być ujemny",
    max: 10000000,
    error_max: "Budżet nie może przekraczać 10 000 000"
  },
  
  final_budget: {
    required: false,
    type: 'integer',
    min: 0,
    max: 10000000,
    editable_by: ['bidder', 'manager'],
    error_permission: "Tylko Bidder i Manager mogą edytować finalny budżet"
  },
  
  year_model: {
    required: false,
    type: 'integer',
    error_type: "Rocznik musi być liczbą całkowitą",
    min: 1900,
    error_min: "Rocznik nie może być wcześniejszy niż 1900",
    max: () => new Date().getFullYear() + 1, // funkcja zwracająca aktualny rok + 1
    error_max: "Rocznik nie może być późniejszy niż przyszły rok"
  },
  
  mileage: {
    required: false,
    type: 'integer',
    error_type: "Przebieg musi być liczbą całkowitą",
    min: 0,
    error_min: "Przebieg nie może być ujemny",
    max: 1000000,
    error_max: "Przebieg nie może przekraczać 1 000 000 km"
  },
  
  equipment: {
    required: false,
    type: 'text',
    max_length: 1000,
    error_max_length: "Wyposażenie może mieć maksymalnie 1000 znaków"
  },
  
  client_trigger: {
    required: false,
    type: 'text',
    max_length: 500,
    error_max_length: "Trigger klienta może mieć maksymalnie 500 znaków"
  },
  
  comment: {
    required: false,
    type: 'text',
    max_length: 1000,
    error_max_length: "Komentarz może mieć maksymalnie 1000 znaków"
  },
  
  next_contact_date: {
    required: false,
    type: 'datetime',
    error_type: "Data musi być w formacie datetime",
    // Opcjonalnie: nie może być w przeszłości
    min: () => new Date(),
    error_min: "Data następnego kontaktu nie może być w przeszłości"
  },
  
  assigned_user_id: {
    required: false, // jeśli nie podano, przypisuje do zalogowanego usera
    type: 'integer',
    exists_check: true, // sprawdź czy user o tym ID istnieje
    error_exists: "Użytkownik o tym ID nie istnieje"
  }
}
```

**Przykład walidacji duplikatów:**
```javascript
async function checkDuplicateLead(phone, email) {
  const existingByPhone = await db.findLead({ phone });
  if (existingByPhone) {
    return {
      duplicate: true,
      field: 'phone',
      message: `Lead z numerem ${phone} już istnieje (ID: ${existingByPhone.id})`
    };
  }
  
  if (email) {
    const existingByEmail = await db.findLead({ email });
    if (existingByEmail) {
      return {
        duplicate: true,
        field: 'email',
        message: `Lead z emailem ${email} już istnieje (ID: ${existingByEmail.id})`
      };
    }
  }
  
  return { duplicate: false };
}
```

---

### Edycja Leada (`PUT /leads/{id}`)

**Wszystkie pola opcjonalne przy edycji, ale te same reguły walidacji jak przy tworzeniu.**

**Dodatkowe walidacje uprawnień:**
```javascript
async function validateLeadEditPermissions(lead_id, user_id, user_role, fields_to_update) {
  const lead = await db.getLeadById(lead_id);
  
  // Manager może wszystko
  if (user_role === 'manager') {
    return { allowed: true };
  }
  
  // User może edytować tylko własne leady
  if (user_role === 'user') {
    if (lead.assigned_user_id !== user_id) {
      return {
        allowed: false,
        error: "Nie możesz edytować leadów innych użytkowników"
      };
    }
    
    // User nie może edytować final_budget
    if (fields_to_update.includes('final_budget')) {
      return {
        allowed: false,
        error: "Nie masz uprawnień do edycji finalnego budżetu"
      };
    }
    
    return { allowed: true };
  }
  
  // Bidder może edytować tylko leady w bidding pipeline
  if (user_role === 'bidder') {
    const allowedStatuses = ['bidding_order', 'won'];
    if (!allowedStatuses.includes(lead.status)) {
      return {
        allowed: false,
        error: "Możesz edytować tylko leady w etapie licytacji lub dalej"
      };
    }
    
    return { allowed: true };
  }
  
  return { allowed: false, error: "Brak uprawnień" };
}
```

---

## Walidacje Rezygnacji

### Oznaczenie Leada jako Rezygnacja (`POST /leads/{id}/resign`)

```javascript
{
  resignation_status: {
    required: true,
    error: "Powód rezygnacji jest wymagany",
    enum: [
      'bought_in_poland',
      'no_import',
      'resigns_completely',
      'wants_new_car',
      'wants_leasing'
    ],
    error_enum: "Nieprawidłowy powód rezygnacji"
  }
}
```

**Business Logic Validation:**
```javascript
// Sprawdź czy lead nie jest już oznaczony jako rezygnacja
if (lead.is_resigned === true) {
  throw new Error("Lead jest już oznaczony jako rezygnacja");
}

// Sprawdź uprawnienia (User może oznaczać tylko własne leady)
if (user_role === 'user' && lead.assigned_user_id !== user_id) {
  throw new Error("Nie możesz oznaczać jako rezygnacja leadów innych użytkowników");
}
```

---

### Przywrócenie Leada z Rezygnacji (`POST /leads/{id}/restore`)

**Walidacja:**
```javascript
// Sprawdź czy lead jest oznaczony jako rezygnacja
if (lead.is_resigned === false) {
  throw new Error("Lead nie jest oznaczony jako rezygnacja");
}

// Sprawdź uprawnienia
if (user_role === 'user' && lead.assigned_user_id !== user_id) {
  throw new Error("Nie możesz przywracać leadów innych użytkowników");
}
```

---

## Walidacje Importu CSV

### Walidacja Pliku CSV (`POST /leads/import/preview`)

```javascript
{
  file: {
    required: true,
    error: "Plik CSV jest wymagany",
    mime_type: ['text/csv', 'application/csv'],
    error_mime_type: "Plik musi być w formacie CSV",
    max_size: 10 * 1024 * 1024, // 10 MB
    error_max_size: "Plik nie może być większy niż 10 MB"
  }
}
```

**Walidacja struktury CSV:**
```javascript
function validateCSVStructure(csvData) {
  const errors = [];
  
  // Sprawdź czy plik nie jest pusty
  if (csvData.length === 0) {
    errors.push("Plik CSV jest pusty");
    return errors;
  }
  
  // Sprawdź czy są nagłówki
  const headers = csvData[0];
  if (!headers || headers.length === 0) {
    errors.push("Brak nagłówków w pliku CSV");
    return errors;
  }
  
  // Sprawdź czy wszystkie wiersze mają tę samą liczbę kolumn
  const columnCount = headers.length;
  csvData.forEach((row, index) => {
    if (row.length !== columnCount) {
      errors.push(`Wiersz ${index + 1}: Nieprawidłowa liczba kolumn (oczekiwano ${columnCount}, otrzymano ${row.length})`);
    }
  });
  
  return errors;
}
```

---

### Walidacja Mapowania (`POST /leads/import/execute`)

```javascript
{
  mapping: {
    required: true,
    error: "Mapowanie kolumn jest wymagane",
    type: 'object',
    
    // Sprawdź czy wymagane pola są zamapowane
    required_fields: ['first_name', 'last_name', 'phone', 'vehicle'],
    error_required_fields: "Musisz zamapować wymagane pola: Imię, Nazwisko, Telefon, Pojazd"
  }
}
```

**Walidacja każdego wiersza przed importem:**
```javascript
async function validateCSVRow(row, rowIndex, mapping) {
  const errors = [];
  const lead = {};
  
  // Mapuj kolumny
  for (const [csvColumn, dbField] of Object.entries(mapping)) {
    if (dbField !== '--- Pomiń ---') {
      lead[dbField] = row[csvColumn];
    }
  }
  
  // Waliduj zgodnie z regułami leadów
  const validation = validateLead(lead);
  if (validation) {
    errors.push({
      row: rowIndex,
      errors: validation
    });
  }
  
  // Sprawdź duplikaty
  const duplicate = await checkDuplicateLead(lead.phone, lead.email);
  if (duplicate.duplicate) {
    errors.push({
      row: rowIndex,
      field: duplicate.field,
      error: duplicate.message,
      action: 'skip' // lub 'merge' jeśli zaimplementowano
    });
  }
  
  return errors;
}
```

---

## Walidacje Permissions

### Sprawdzanie Uprawnień do Akcji

```javascript
const PERMISSIONS = {
  // Zarządzanie użytkownikami
  'users.create': ['manager'],
  'users.edit': ['manager'],
  'users.delete': ['manager'],
  'users.view_all': ['manager'],
  
  // Zarządzanie leadami
  'leads.create': ['user', 'manager'],
  'leads.edit_own': ['user', 'manager'],
  'leads.edit_all': ['manager'],
  'leads.edit_in_bidding': ['bidder', 'manager'],
  'leads.view_all': ['user', 'manager', 'bidder'],
  'leads.delete': ['manager'],
  
  // Finalne budżety
  'final_budget.edit': ['bidder', 'manager'],
  
  // Rezygnacje
  'resignation.mark_own': ['user', 'manager'],
  'resignation.mark_all': ['manager'],
  'resignation.restore_own': ['user', 'manager'],
  'resignation.restore_all': ['manager'],
  
  // Statystyki
  'stats.view_own': ['user', 'manager'],
  'stats.view_all': ['manager'],
  
  // Bidding pipeline
  'bidding.view': ['bidder', 'manager'],
  'bidding.update': ['bidder', 'manager']
};

function hasPermission(user_role, permission) {
  return PERMISSIONS[permission]?.includes(user_role) || false;
}
```

**Przykład użycia:**
```javascript
// Sprawdź czy user może edytować finalny budżet
if (!hasPermission(user_role, 'final_budget.edit')) {
  return res.status(403).json({
    error: "Nie masz uprawnień do edycji finalnego budżetu"
  });
}
```

---

## Walidacje Frontend (React Hook Form + Zod)

### Przykład Schema z Zod dla Formularza Leada

```javascript
import { z } from 'zod';

const leadSchema = z.object({
  first_name: z.string()
    .min(2, 'Imię musi mieć minimum 2 znaki')
    .max(50, 'Imię może mieć maksymalnie 50 znaków')
    .regex(/^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s\-]+$/, 'Imię może zawierać tylko litery'),
  
  last_name: z.string()
    .min(2, 'Nazwisko musi mieć minimum 2 znaki')
    .max(50, 'Nazwisko może mieć maksymalnie 50 znaków')
    .regex(/^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s\-]+$/, 'Nazwisko może zawierać tylko litery'),
  
  phone: z.string()
    .regex(/^\+?[0-9]{9,15}$/, 'Nieprawidłowy format numeru telefonu'),
  
  email: z.string()
    .email('Nieprawidłowy format email')
    .optional()
    .or(z.literal('')),
  
  vehicle: z.string()
    .min(2, 'Model pojazdu musi mieć minimum 2 znaki')
    .max(100, 'Model pojazdu może mieć maksymalnie 100 znaków'),
  
  budget: z.number()
    .int('Budżet musi być liczbą całkowitą')
    .min(0, 'Budżet nie może być ujemny')
    .max(10000000, 'Budżet nie może przekraczać 10 000 000')
    .optional(),
  
  year_model: z.number()
    .int('Rocznik musi być liczbą całkowitą')
    .min(1900, 'Rocznik nie może być wcześniejszy niż 1900')
    .max(new Date().getFullYear() + 1, 'Rocznik nie może być późniejszy niż przyszły rok')
    .optional(),
  
  mileage: z.number()
    .int('Przebieg musi być liczbą całkowitą')
    .min(0, 'Przebieg nie może być ujemny')
    .max(1000000, 'Przebieg nie może przekraczać 1 000 000 km')
    .optional(),
  
  equipment: z.string()
    .max(1000, 'Wyposażenie może mieć maksymalnie 1000 znaków')
    .optional(),
  
  client_trigger: z.string()
    .max(500, 'Trigger klienta może mieć maksymalnie 500 znaków')
    .optional(),
  
  comment: z.string()
    .max(1000, 'Komentarz może mieć maksymalnie 1000 znaków')
    .optional(),
  
  next_contact_date: z.date()
    .min(new Date(), 'Data nie może być w przeszłości')
    .optional()
});

export type LeadFormData = z.infer<typeof leadSchema>;
```

**Użycie w komponencie React:**
```javascript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

function LeadForm() {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema)
  });
  
  const onSubmit = async (data: LeadFormData) => {
    try {
      await api.createLead(data);
      toast.success('Lead został utworzony');
    } catch (error) {
      toast.error('Wystąpił błąd');
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('first_name')} />
      {errors.first_name && <span>{errors.first_name.message}</span>}
      
      <input {...register('last_name')} />
      {errors.last_name && <span>{errors.last_name.message}</span>}
      
      {/* ... pozostałe pola */}
      
      <button type="submit">Zapisz</button>
    </form>
  );
}
```

---

## Komunikaty Błędów - Best Practices

### Dobre Praktyki
✅ **Konkretne**: "Imię musi mieć minimum 2 znaki" zamiast "Nieprawidłowe dane"
✅ **Pomocne**: "Numer telefonu musi zawierać 9-15 cyfr" zamiast "Błąd walidacji"
✅ **Po polsku**: Wszystkie komunikaty w języku polskim
✅ **Kontekstowe**: Pokazuj błędy przy konkretnych polach, nie tylko globalnie

### Złe Praktyki
❌ **Ogólne**: "Wystąpił błąd"
❌ **Techniczne**: "Validation error: field 'phone' failed regex match"
❌ **Po angielsku**: "Invalid email format"
❌ **Bez kontekstu**: Globalny komunikat błędu bez wskazania pola

### Przykłady Dobrych Komunikatów
```javascript
const ERROR_MESSAGES = {
  // Ogólne
  required: (field) => `${field} jest wymagane`,
  invalid: (field) => `${field} ma nieprawidłowy format`,
  
  // Email
  email_format: 'Adres email musi być w formacie: nazwa@domena.pl',
  email_exists: 'Ten adres email jest już zarejestrowany',
  
  // Telefon
  phone_format: 'Numer telefonu musi zawierać 9-15 cyfr (opcjonalnie poprzedź znakiem +)',
  phone_exists: 'Lead z tym numerem telefonu już istnieje w systemie',
  
  // Hasło
  password_min: 'Hasło musi zawierać minimum 8 znaków',
  password_strength: 'Hasło musi zawierać wielką literę, małą literę, cyfrę i znak specjalny',
  
  // Permissions
  no_permission: 'Nie masz uprawnień do wykonania tej akcji',
  not_owner: 'Możesz edytować tylko własne leady',
  not_in_stage: 'Lead musi być w odpowiednim etapie, aby wykonać tę akcję',
  
  // Duplikaty
  duplicate_phone: (phone) => `Lead z numerem ${phone} już istnieje`,
  duplicate_email: (email) => `Lead z emailem ${email} już istnieje`
};
```

---

## Summary - Kluczowe Punkty Walidacji

1. **Walidacja na wielu poziomach**:
   - Frontend (React Hook Form + Zod)
   - Backend (przed zapisem do bazy)
   - Baza danych (constraints, foreign keys)

2. **Sprawdzanie uprawnień** przed każdą operacją modyfikującą dane

3. **Walidacja biznesowa** (np. sprawdzenie duplikatów, aktywnych leadów)

4. **Przyjazne komunikaty błędów** w języku polskim

5. **Consistent error handling** - zwracanie błędów w tym samym formacie

6. **Walidacja w czasie rzeczywistym** na frontendzie dla lepszego UX

7. **Backend jako źródło prawdy** - ostateczna walidacja zawsze na serwerze
