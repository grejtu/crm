# Dokumentacja UI/UX - CRM System

## Spis Treści
- [Layout Główny](#layout-główny)
- [Dashboard User](#dashboard-user)
- [Pipeline Kanban](#pipeline-kanban)
- [Karta Leada](#karta-leada)
- [Historia Kontaktu](#historia-kontaktu)
- [Zakładka Rezygnacje](#zakładka-rezygnacje)
- [Panel Bidder](#panel-bidder)
- [Panel Manager](#panel-manager)
- [Import CSV](#import-csv)

---

## Layout Główny

### Struktura Podstawowa
```
┌─────────────────────────────────────────────────────────┐
│ LOGO        [👤 Jan Kowalski (User)]    [⚙️] [Wyloguj] │
├─────────────────────────────────────────────────────────┤
│ [Dashboard] [Pipeline] [Leady] [Rezygnacje] [Import]   │ ← Menu dla User
├─────────────────────────────────────────────────────────┤
│                                                         │
│                    GŁÓWNA ZAWARTOŚĆ                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Menu dla Manager
```
[Dashboard] [Pipeline] [Leady] [Rezygnacje] [Import] [Użytkownicy] [Statystyki]
```

### Menu dla Bidder
```
[Moja Pipeline] [Wszystkie Leady]
```

---

## Dashboard User

```
┌─────────────────────────────────────────────────────────┐
│ DASHBOARD - Anna Nowak                                  │
├─────────────────────────────────────────────────────────┤
│ 📊 MOJE STATYSTYKI                                      │
│                                                         │
│ Wszystkich leadów: 24                                   │
│                                                         │
│ ┌──────────┬──────────┬──────────┬──────────┐          │
│ │ Chce     │ Umowa    │ Depozyt  │ Wygrane  │          │
│ │ auto: 8  │ wysł: 6  │     : 2  │      : 0 │          │
│ └──────────┴──────────┴──────────┴──────────┘          │
├─────────────────────────────────────────────────────────┤
│ 📅 KONTAKTY NA DZIŚ (3)                                 │
│                                                         │
│ 10:00 - Jan Kowalski (BMW X5)        [Otwórz kartę]   │
│ 14:00 - Anna Nowak (Audi A4)         [Otwórz kartę]   │
│ 16:30 - Piotr Maj (Tesla Model 3)    [Otwórz kartę]   │
├─────────────────────────────────────────────────────────┤
│ ⚠️ ZALEGŁE KONTAKTY (2)                                 │
│                                                         │
│ 25.01 - Ewa Lis (VW Golf)            [Otwórz kartę]   │
│ 26.01 - Marek Nowak (Mercedes C)     [Otwórz kartę]   │
└─────────────────────────────────────────────────────────┘
```

**Funkcjonalność:**
- Liczniki leadów na różnych etapach
- Lista kontaktów na dziś z godzinami
- Lista zaległych kontaktów (czerwone oznaczenie)
- Szybki dostęp do karty leada (kliknięcie w wiersz)

---

## Pipeline Kanban

```
┌──────────────────────────────────────────────────────────────────┐
│ PIPELINE                    [⚙️ Moje leady / Wszystkie]          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│ │ Chce    │ │ Szukanie│ │ Umowa   │ │ Umowa   │ │ Depozyt │   │
│ │ auto    │ │ bez um. │ │ wysłana │ │ podp.   │ │         │   │
│ │  (12)   │ │   (8)   │ │  (10)   │ │   (7)   │ │   (5)   │   │
│ ├─────────┤ ├─────────┤ ├─────────┤ ├─────────┤ ├─────────┤   │
│ │ Jan K.  │ │ Anna N. │ │ Piotr M.│ │ Ewa L.  │ │ Marek N.│   │
│ │ BMW X5  │ │ Audi A4 │ │ Tesla 3 │ │ VW Golf │ │ Merc C  │   │
│ │ [→]     │ │ [→]     │ │ [→]     │ │ [→]     │ │ [→]     │   │
│ ├─────────┤ ├─────────┤ ├─────────┤ ├─────────┤ ├─────────┤   │
│ │ Tomasz P│ │ Kasia W.│ │ Adam S. │ │         │ │         │   │
│ │ Porsche │ │ BMW M3  │ │ Audi S4 │ │         │ │         │   │
│ │ [→]     │ │ [→]     │ │ [→]     │ │         │ │         │   │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
│                                                                  │
│ ┌─────────┐ ┌─────────┐                                         │
│ │ Zlecenie│ │ Wygrana │                                         │
│ │ licyt.  │ │         │                                         │
│ │   (2)   │ │   (1)   │                                         │
│ ├─────────┤ ├─────────┤                                         │
│ │ Michał K│ │ Paweł D.│                                         │
│ │ BMW X7  │ │ Tesla Y │                                         │
│ │ [→]     │ │   ✅    │                                         │
│ └─────────┘ └─────────┘                                         │
└──────────────────────────────────────────────────────────────────┘

Drag & drop: Przeciągnij kartę leada do innej kolumny aby zmienić status
```

**Funkcjonalność:**
- Drag & drop między kolumnami
- Licznik leadów w każdej kolumnie
- Kliknięcie na kartę → otwarcie szczegółów
- Toggle "Moje leady / Wszystkie" (dla User i Manager)
- Kolory kolumn:
  - Niebieski: Początkowe etapy (wants_car, searching_no_contract)
  - Żółty: Etapy środkowe (contract_sent, contract_signed)
  - Zielony: Etapy końcowe (deposit, bidding_order, won)

### Karta Leada (READ-ONLY dla innych użytkowników)
```
┌─────────────┐
│ Jan K. 🔒   │ ← 🔒 oznacza READ-ONLY
│ BMW X5      │
│ (Anna N.)   │ ← Pokazuje kto jest przypisany
└─────────────┘
```

---

## Karta Leada

### Widok User (własny lead)

```
┌─────────────────────────────────────────────────────────┐
│ LEAD #123 - Jan Kowalski        [Edytuj] [Rezygnacja]  │
├─────────────────────────────────────────────────────────┤
│ [Dane] [Historia] [Rezygnacja (ukryte jeśli nie)]      │
├─────────────────────────────────────────────────────────┤
│ INFORMACJE KONTAKTOWE                                   │
│ Imię:              [Jan                              ]  │
│ Nazwisko:          [Kowalski                         ]  │
│ Telefon:           [+48123456789                     ]  │
│ Email:             [jan@example.com                  ]  │
├─────────────────────────────────────────────────────────┤
│ POJAZD                                                  │
│ Model:             [BMW X5                           ]  │
│ Rocznik:           [2020                             ]  │
│ Przebieg:          [45000 km                         ]  │
│ Budżet:            [150 000 PLN                      ]  │
│ Finalny budżet:    --- (tylko dla Bidder)               │
│ Wyposażenie:       [Autopilot, Premium Interior,    ]  │
│                    [19" Rims, Panorama              ]  │
│                    (textarea)                           │
├─────────────────────────────────────────────────────────┤
│ PSYCHOLOGIA KLIENTA                                     │
│ Trigger:           [Chce oszczędzić na ubezpieczeniu]  │
│                    [dla syna, auto ma być bezpieczne]  │
│                    (textarea)                           │
├─────────────────────────────────────────────────────────┤
│ KONTAKT                                                 │
│ Pierwsza data:     28.01.2024 14:30                     │
│ Kolejna data:      [01.02.2024  10:00]  (datepicker)   │
│ Komentarz:         [Klient bardzo zainteresowany,   ]  │
│                    [oddzwonić w czwartek           ]  │
│                    (textarea)                           │
├─────────────────────────────────────────────────────────┤
│ STATUS                                                  │
│ Aktualny:          Umowa wysłana                        │
│ Przypisany do:     Anna Nowak (Ja)                      │
├─────────────────────────────────────────────────────────┤
│                               [Zapisz] [Anuluj]         │
└─────────────────────────────────────────────────────────┘
```

**Funkcjonalność:**
- Wszystkie pola edytowalne dla właściciela
- Datepicker dla "Kolejna data kontaktu"
- Textarea z auto-resize dla długich pól
- Walidacja w czasie rzeczywistym
- Przycisk "Zapisz" aktywny tylko przy zmianach

---

### Widok User (lead innego usera - READ-ONLY)

```
┌─────────────────────────────────────────────────────────┐
│ LEAD #125 - Piotr Maj                   🔒 TYLKO ODCZYT │
├─────────────────────────────────────────────────────────┤
│ [Dane] [Historia]                                       │
├─────────────────────────────────────────────────────────┤
│ ℹ️ Ten lead jest przypisany do innego użytkownika.      │
│    Możesz go przeglądać, ale nie edytować.              │
├─────────────────────────────────────────────────────────┤
│ INFORMACJE KONTAKTOWE                                   │
│ Imię:              Piotr                                │
│ Nazwisko:          Maj                                  │
│ Telefon:           +48987654321                         │
│ Email:             piotr@example.com                    │
├─────────────────────────────────────────────────────────┤
│ POJAZD                                                  │
│ Model:             Tesla Model 3                        │
│ Rocznik:           2022                                 │
│ Przebieg:          30000 km                             │
│ Budżet:            180 000 PLN                          │
│ Wyposażenie:       Full opcja, Autopilot                │
├─────────────────────────────────────────────────────────┤
│ PSYCHOLOGIA KLIENTA                                     │
│ Trigger:           Ekologia, nowoczesne technologie     │
├─────────────────────────────────────────────────────────┤
│ KONTAKT                                                 │
│ Pierwsza data:     25.01.2024 09:00                     │
│ Kolejna data:      30.01.2024 15:00                     │
│ Komentarz:         Klient czeka na ofertę               │
├─────────────────────────────────────────────────────────┤
│ STATUS                                                  │
│ Aktualny:          Szukanie bez umowy                   │
│ Przypisany do:     Jan Kowalski                         │
└─────────────────────────────────────────────────────────┘
```

**Funkcjonalność:**
- Wszystkie pola tylko do odczytu
- Brak przycisków edycji i rezygnacji
- Komunikat informacyjny na górze
- Możliwość przeglądania historii

---

### Widok Bidder

```
┌─────────────────────────────────────────────────────────┐
│ LEAD #123 - Jan Kowalski                    [Edytuj]    │
├─────────────────────────────────────────────────────────┤
│ [Dane] [Historia]                                       │
├─────────────────────────────────────────────────────────┤
│ Status: Zlecenie licytacji                              │
├─────────────────────────────────────────────────────────┤
│ BUDŻET                                                  │
│ Budżet klienta:    150 000 PLN (tylko odczyt)          │
│ Finalny budżet:    [148 000 PLN                     ]  │
│ Różnica:           -2 000 PLN                           │
├─────────────────────────────────────────────────────────┤
│ POJAZD                                                  │
│ Model:             [BMW X5                           ]  │
│ Rocznik:           [2020                             ]  │
│ Przebieg:          [45000 km                         ]  │
│ Wyposażenie:       [Autopilot, Premium Interior     ]  │
├─────────────────────────────────────────────────────────┤
│ KOMENTARZ BIDDER                                        │
│                    [Znaleziono 3 opcje w USA,        ]  │
│                    [najlepsza w Kalifornii          ]  │
│                    (textarea)                           │
├─────────────────────────────────────────────────────────┤
│                               [Zapisz] [Anuluj]         │
└─────────────────────────────────────────────────────────┘
```

**Funkcjonalność:**
- Edycja tylko dla leadów w statusie >= bidding_order
- Pole "Finalny budżet" z automatycznym obliczaniem różnicy
- Focus na informacjach istotnych dla licytanta
- Możliwość dodawania notatek

---

## Historia Kontaktu

```
┌─────────────────────────────────────────────────────────┐
│ HISTORIA KONTAKTU                                       │
├─────────────────────────────────────────────────────────┤
│ 📅 28.01.2024 14:30                                     │
│ 👤 Anna Nowak (User)                                    │
│ ➕ Lead utworzony                                       │
├─────────────────────────────────────────────────────────┤
│ 📅 28.01.2024 15:00                                     │
│ 👤 Anna Nowak (User)                                    │
│ 📝 Zmieniono: Telefon                                   │
│ +48 123 456 789 → +48 111 222 333                      │
├─────────────────────────────────────────────────────────┤
│ 📅 28.01.2024 15:30                                     │
│ 👤 Anna Nowak (User)                                    │
│ 🔄 Zmieniono status                                     │
│ Chce auto → Szukanie bez umowy                          │
├─────────────────────────────────────────────────────────┤
│ 📅 28.01.2024 16:00                                     │
│ 🔨 Piotr Licytant (Bidder)                             │
│ 💰 Zmieniono: Finalny budżet                            │
│ 150 000 → 148 000                                       │
├─────────────────────────────────────────────────────────┤
│ 📅 28.01.2024 16:30                                     │
│ 🔨 Piotr Licytant (Bidder)                             │
│ 🔄 Zmieniono status bidding                             │
│ Zlecenie licytacji → Carfax OK                          │
├─────────────────────────────────────────────────────────┤
│ 📅 28.01.2024 17:00                                     │
│ 👑 Admin Manager (Manager)                              │
│ 👥 Zmieniono: Przypisany user                           │
│ Anna Nowak → Jan Kowalski                               │
└─────────────────────────────────────────────────────────┘
```

**Kolorowanie ról:**
- 👤 User - niebieski
- 🔨 Bidder - pomarańczowy
- 👑 Manager - złoty

**Ikony akcji:**
- ➕ Utworzenie
- 📝 Edycja pola
- 🔄 Zmiana statusu
- 💰 Zmiana budżetu
- 👥 Zmiana przypisania
- 🚫 Rezygnacja
- ↩️ Przywrócenie

---

## Zakładka Rezygnacje

```
┌─────────────────────────────────────────────────────────┐
│ REZYGNACJE                   [⚙️ Moje / Wszystkie]      │
├─────────────────────────────────────────────────────────┤
│ Filtruj po powodzie: [Wszystkie ▼]                      │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │ 🚫 KUPIŁ W POLSCE (5)                               ││
│ ├─────────────────────────────────────────────────────┤│
│ │ Jan Kowalski | BMW X5 | Umowa podpisana             ││
│ │ Data rezygnacji: 28.01.2024                         ││
│ │ [Otwórz kartę] [Przywróć]                           ││
│ ├─────────────────────────────────────────────────────┤│
│ │ Anna Nowak | Audi A4 | Depozyt                      ││
│ │ Data rezygnacji: 27.01.2024                         ││
│ │ [Otwórz kartę] [Przywróć]                           ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │ ❌ NIE CHCE IMPORTU (3)                              ││
│ ├─────────────────────────────────────────────────────┤│
│ │ Piotr Maj | Tesla Model 3 | Szukanie bez umowy      ││
│ │ Data rezygnacji: 26.01.2024                         ││
│ │ [Otwórz kartę] [Przywróć]                           ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │ 🚗 CHCE NOWE AUTO (2)                                ││
│ │ ...                                                  ││
│ └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

**Funkcjonalność:**
- Grupowanie po powodzie rezygnacji
- Licznik w każdej grupie
- Filtr dropdown do szybkiego przełączania
- Przycisk "Przywróć" z confirmation modal
- Możliwość otwarcia pełnej karty leada

**Ikony statusów rezygnacji:**
- 🚫 Kupił w Polsce
- ❌ Nie chce importu
- 🛑 Rezygnuje całkowicie
- 🚗 Chce nowe auto
- 💼 Chce leasing

---

## Panel Bidder

```
┌──────────────────────────────────────────────────────────┐
│ MOJA PIPELINE LICYTACJI                                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│ │ Zlecenie    │ │ Carfax OK   │ │ Wygrana     │        │
│ │ licytacji   │ │             │ │             │        │
│ │    (3)      │ │    (2)      │ │    (1)      │        │
│ ├─────────────┤ ├─────────────┤ ├─────────────┤        │
│ │ Jan K.      │ │ Piotr M.    │ │ Ewa L.      │        │
│ │ BMW X5      │ │ Tesla 3     │ │ VW Golf     │        │
│ │ 150k → 148k │ │ 180k → 178k │ │ 120k → 119k │        │
│ │             │ │             │ │   ✅        │        │
│ │ [Carfax ✓]  │ │ [Wygrana]   │ │             │        │
│ │ [Przegrana] │ │ [Przegrana] │ │             │        │
│ └─────────────┘ └─────────────┘ └─────────────┘        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Funkcjonalność:**
- 3 kolumny dla statusów bidding
- Wyświetlanie budżetu klienta → finalnego budżetu
- Przyciski akcji:
  - **[Carfax ✓]** → Przenieś do "Carfax OK"
  - **[Wygrana]** → Lead zamknięty jako wygrana
  - **[Przegrana]** → Lead wraca do User
- Kliknięcie na kartę → szczegóły z możliwością edycji

---

## Panel Manager

### Zarządzanie Użytkownikami

```
┌──────────────────────────────────────────────────────────┐
│ ZARZĄDZANIE UŻYTKOWNIKAMI          [+ Dodaj Użytkownika] │
├──────────────────────────────────────────────────────────┤
│ Imię           Email              Rola      Leady  Akcje │
│ Jan Kowalski   jan@firma.pl       User      24     [...]│
│ Anna Nowak     anna@firma.pl      User      18     [...]│
│ Piotr Lic      piotr@firma.pl     Bidder    -      [...]│
│ Kasia Admin    kasia@firma.pl     Manager   -      [...]│
└──────────────────────────────────────────────────────────┘

[...] menu:
- Edytuj
- Zmień hasło
- Dezaktywuj
- Pokaż leady
```

**Modal: Dodaj Użytkownika**
```
┌─────────────────────────────────────┐
│ DODAJ NOWEGO UŻYTKOWNIKA            │
├─────────────────────────────────────┤
│ Email:    [                       ] │
│ Hasło:    [                       ] │
│ Imię:     [                       ] │
│ Rola:     [User ▼]                  │
│           - User                    │
│           - Bidder                  │
├─────────────────────────────────────┤
│           [Anuluj] [Utwórz]         │
└─────────────────────────────────────┘
```

**Funkcjonalność:**
- Tabela z wszystkimi użytkownikami
- Sortowanie po kolumnach
- Menu kontekstowe dla każdego usera
- Modal do dodawania/edycji
- Walidacja formularza w czasie rzeczywistym

---

### Statystyki

```
┌──────────────────────────────────────────────────────────┐
│ STATYSTYKI                         [Dziś|Tydzień|Miesiąc]│
├──────────────────────────────────────────────────────────┤
│ UŻYTKOWNICY                                              │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Jan Kowalski (User)               [Pokaż szczegóły]│  │
│ │                                                    │  │
│ │ Wszystkich leadów: 45                              │  │
│ │ Konwersja do umowy: 45.5%                          │  │
│ │ Konwersja do wygranej: 12.5%                       │  │
│ │                                                    │  │
│ │ Pipeline:                                          │  │
│ │ ▓▓▓▓░░░░ Chce auto (12)                            │  │
│ │ ▓▓▓░░░░░ Szukanie (8)                              │  │
│ │ ▓▓▓▓▓░░░ Umowa wysłana (10)                        │  │
│ │ ▓▓▓░░░░░ Umowa podpisana (7)                       │  │
│ │ ▓▓░░░░░░ Depozyt (5)                               │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Anna Nowak (User)                 [Pokaż szczegóły]│  │
│ │ ...                                                │  │
│ └────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────┤
│ STATYSTYKI CZASOWE                                       │
│                                                          │
│ [Wykres] Nowe leady w czasie                             │
│     │                                                    │
│  10 │     ▄▄                                             │
│   5 │  ▄▄ ██ ▄▄                                          │
│   0 │▄▄██▄██▄██▄▄▄▄▄▄▄                                   │
│     └───────────────────                                 │
│      Pn Wt Śr Cz Pt Sb Nd                                │
└──────────────────────────────────────────────────────────┘
```

**Funkcjonalność:**
- Karty dla każdego użytkownika z mini-statystykami
- Progress bary dla pipeline'u
- Procenty konwersji
- Wykresy słupkowe/liniowe dla trendów czasowych
- Toggle między widokami: dzień/tydzień/miesiąc
- Ekspandowanie karty usera do pełnych szczegółów

---

## Import CSV

### Krok 1: Wybór Pliku

```
┌─────────────────────────────────────────────────────────┐
│ IMPORT LEADÓW Z CSV                                     │
├─────────────────────────────────────────────────────────┤
│ Krok 1: Wybierz plik                                    │
│                                                         │
│ [Wybierz plik CSV] lub przeciągnij tutaj               │
│                                                         │
│ ✅ leads_export.csv (234 KB) - 150 wierszy              │
└─────────────────────────────────────────────────────────┘
```

### Krok 2: Mapowanie Kolumn

```
┌─────────────────────────────────────────────────────────┐
│ IMPORT LEADÓW Z CSV                                     │
├─────────────────────────────────────────────────────────┤
│ Krok 2: Mapowanie kolumn                                │
│                                                         │
│ Kolumna w CSV         →    Pole w systemie             │
│ "Imię"                →    [first_name ▼]              │
│ "Nazwisko"            →    [last_name ▼]               │
│ "Telefon"             →    [phone ▼]                   │
│ "Email"               →    [email ▼]                   │
│ "Auto"                →    [vehicle ▼]                 │
│ "Budżet"              →    [budget ▼]                  │
│ "Notatka"             →    [comment ▼]                 │
│ "Kolumna X"           →    [--- Pomiń ---]             │
├─────────────────────────────────────────────────────────┤
│ Podgląd (pierwsze 3 wiersze):                           │
│                                                         │
│ Jan | Kowalski | +48123 | jan@... | BMW X5 | 150000    │
│ Anna | Nowak | +48987 | anna@... | Audi A4 | 120000    │
│ Piotr | Maj | +48555 | piotr@... | Tesla 3 | 180000    │
├─────────────────────────────────────────────────────────┤
│                           [Anuluj] [Importuj (150)]     │
└─────────────────────────────────────────────────────────┘
```

**Funkcjonalność:**
- Drag & drop dla pliku CSV
- Automatyczne wykrywanie kolumn
- Sugestie mapowania (matching po nazwach)
- Dropdown dla każdej kolumny z opcją "Pomiń"
- Podgląd pierwszych wierszy
- Walidacja przed importem
- Licznik wierszy do importu

### Krok 3: Raport

```
┌─────────────────────────────────────────────────────────┐
│ RAPORT IMPORTU                                          │
├─────────────────────────────────────────────────────────┤
│ ✅ Sukces: 145 leadów                                   │
│ ⚠️ Pominięto: 5 leadów (duplikaty)                      │
│                                                         │
│ Szczegóły pominiętych:                                  │
│ Wiersz 12: Duplikat telefonu: +48123456789             │
│ Wiersz 34: Duplikat telefonu: +48987654321             │
│ Wiersz 67: Brak wymaganego pola: phone                 │
│ Wiersz 89: Brak wymaganego pola: vehicle               │
│ Wiersz 103: Nieprawidłowy format email                 │
├─────────────────────────────────────────────────────────┤
│                                  [Zamknij] [Eksportuj]  │
└─────────────────────────────────────────────────────────┘
```

**Funkcjonalność:**
- Podsumowanie importu
- Lista błędów z numerami wierszy
- Opcja eksportu raportu do CSV
- Automatyczne przekierowanie do listy leadów po zamknięciu

---

## Wspólne Elementy UI

### Kolorystyka
- **Niebieski** (#3B82F6): Główny kolor akcji, User
- **Pomarańczowy** (#F97316): Bidder, ostrzeżenia
- **Złoty** (#EAB308): Manager, premium features
- **Zielony** (#10B981): Sukces, pozytywne akcje
- **Czerwony** (#EF4444): Błędy, rezygnacje
- **Szary** (#6B7280): Neutralne, disabled

### Typografia
- **Headers**: Font: Inter, Size: 24px, Weight: 600
- **Body**: Font: Inter, Size: 14px, Weight: 400
- **Labels**: Font: Inter, Size: 12px, Weight: 500
- **Buttons**: Font: Inter, Size: 14px, Weight: 500

### Komponenty
- **Buttons**: Rounded corners (6px), wysokość 40px
- **Inputs**: Border radius 4px, wysokość 40px
- **Cards**: Shadow: sm, Border radius 8px, Padding 16px
- **Modals**: Max width 500px, backdrop blur
- **Toasts**: Top-right corner, auto-dismiss 5s

### Ikony
- Biblioteka: Lucide React
- Rozmiar: 20px (standard), 16px (small), 24px (large)
- Stroke width: 2

### Responsywność
- **Desktop**: > 1024px - Pełna funkcjonalność
- **Tablet**: 768-1023px - Dopasowany layout
- **Mobile**: < 768px - Uproszczony widok, hamburger menu

---

## Stany i Feedback

### Loading States
```
Ładowanie... [Spinner]
```

### Empty States
```
┌─────────────────────────────────┐
│         📭                      │
│   Brak leadów do wyświetlenia   │
│   [Dodaj pierwszego leada]      │
└─────────────────────────────────┘
```

### Error States
```
┌─────────────────────────────────┐
│         ⚠️                       │
│   Wystąpił błąd                 │
│   [Spróbuj ponownie]            │
└─────────────────────────────────┘
```

### Success Toasts
```
✅ Lead został zapisany pomyślnie
✅ Użytkownik został utworzony
✅ Import zakończony: 145 leadów
```

### Confirmation Modals
```
┌─────────────────────────────────┐
│ Czy na pewno?                   │
├─────────────────────────────────┤
│ Ta akcja jest nieodwracalna.    │
│                                 │
│      [Anuluj]  [Potwierdź]      │
└─────────────────────────────────┘
```
