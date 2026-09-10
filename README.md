# Appointment Board

A full-stack appointment management board designed for a small team to create, manage, and track appointments from a single agenda-style interface.

The application supports appointment creation, editing, completion, cancellation, date/status filtering, server-side pagination, time-slot conflict prevention, validation, responsive UI, toast notifications, confirmation dialogs, and light/dark theme support.

> **Technical assignment submission for the Full Stack Developer Intern role at Appening Infotech.**

---

## Features

### Appointment Management

- Create appointments with:
  - Title
  - Optional description
  - Appointment date
  - Start time
  - End time
- Edit scheduled appointments.
- Mark scheduled appointments as completed.
- Cancel scheduled appointments.
- Completed appointments remain visible as historical records.
- Cancelled appointments remain visible as historical records.
- Completed and cancelled appointments are read-only.

### Validation

- Required fields are validated.
- End time must be strictly later than start time.
- Invalid appointment data is rejected by the backend.
- Frontend validation provides immediate user feedback.
- Backend validation remains the authoritative source of truth.

### Conflict Prevention

The backend prevents overlapping scheduled appointments on the same date.

For example:

```text
10:00 – 11:00
10:30 – 11:30
```

is rejected because the appointments overlap.

However:

```text
10:00 – 11:00
11:00 – 12:00
```

is valid because adjacent appointments do not overlap.

Only `scheduled` appointments reserve a time slot. Completed and cancelled appointments remain available for history without blocking future scheduled appointments.

### Filtering

Appointments can be filtered by:

- Date
- Status
- Date + status together

Filtering is performed on the backend/database query rather than filtering only the records already loaded in the browser.

### Pagination

The appointment list supports server-side pagination.

Example:

```text
GET /api/appointments?page=1&page_size=10
```

Pagination works together with date and status filters.

The API returns:

- current page
- page size
- total records
- total pages
- appointment records for the requested page

### User Feedback

The interface provides:

- Success toast notifications
- Error notifications
- Form validation messages
- Loading states
- Empty states
- API error states
- Retry behavior where appropriate
- Confirmation dialogs for important state-changing actions

Browser-native `alert()` and `confirm()` are not used.

### Responsive UI

The interface is designed to work across:

- Desktop
- Tablet
- Mobile

The appointment board uses an agenda-style layout to keep date/time, appointment information, status, and actions easy to scan.

### Theme Support

The application supports:

- Light mode
- Dark mode

The selected theme is persisted in the browser so the preference remains after refreshing the page.

The theme is applied consistently across:

- Appointment board
- Forms
- Dialogs
- Toast notifications
- Loading skeletons
- Date/time controls
- Empty states
- Error states

---

# Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React | Component-based UI |
| Frontend tooling | Vite | Development and production build tooling |
| Styling | Tailwind CSS | Responsive UI and component styling |
| HTTP client | Axios | Frontend-to-backend API communication |
| Date controls | react-datepicker | Date selection UI |
| Date utilities | date-fns | Date formatting and manipulation |
| Notifications | react-hot-toast | Success/error feedback |
| Backend | FastAPI | REST API |
| ORM | SQLAlchemy | Database access and models |
| Validation | Pydantic | API request/response validation |
| Database | PostgreSQL | Persistent appointment storage |
| Database hosting | Neon PostgreSQL | Hosted PostgreSQL environment |
| Migrations | Alembic | Database schema migrations |
| Testing | pytest | Backend automated tests |

---

# Architecture

The application follows a separated frontend/backend architecture.

```text
┌──────────────────────────────┐
│          React UI            │
│                              │
│ Pages / Components / Hooks   │
└──────────────┬───────────────┘
               │
               │ Axios
               ▼
┌──────────────────────────────┐
│        FastAPI API           │
│                              │
│ Routes / Request Validation  │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│      Appointment Service     │
│                              │
│ Business Rules / Conflicts   │
│ State Transitions / Queries  │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│         SQLAlchemy           │
│                              │
│ Models / Database Queries    │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│       PostgreSQL / Neon      │
└──────────────────────────────┘
```

## Why frontend and backend are separated

The frontend is responsible for:

- presentation
- user interactions
- client-side validation
- loading states
- notifications
- responsive UI

The backend is responsible for:

- authoritative validation
- appointment business rules
- conflict detection
- state transitions
- database operations
- filtering
- pagination

This prevents important business rules from being implemented only in the browser.

---

# Request Flow

For example, when a user creates an appointment:

```text
User submits form
       ↓
React validates basic fields
       ↓
Axios sends POST request
       ↓
FastAPI receives request
       ↓
Pydantic validates request
       ↓
Appointment service applies business rules
       ↓
Service checks time-slot conflict
       ↓
SQLAlchemy writes appointment
       ↓
PostgreSQL stores record
       ↓
FastAPI returns response
       ↓
React updates appointment list
       ↓
Success toast is displayed
```

For an invalid or conflicting request:

```text
React
  ↓
FastAPI
  ↓
Validation / Business Rule
  ↓
Error response
  ↓
React handles error
  ↓
User receives useful feedback
```

---

# Project Structure

```text
appointment-board/
│
├── README.md
│
├── backend/
│   │
│   ├── app/
│   │   ├── core/
│   │   │   └── config.py
│   │   │
│   │   ├── database/
│   │   │   ├── connection.py
│   │   │   └── base.py
│   │   │
│   │   ├── models/
│   │   │   └── appointment.py
│   │   │
│   │   ├── schemas/
│   │   │   └── appointment.py
│   │   │
│   │   ├── routes/
│   │   │   └── appointments.py
│   │   │
│   │   ├── services/
│   │   │   └── appointment_service.py
│   │   │
│   │   └── main.py
│   │
│   ├── alembic/
│   │   └── versions/
│   │
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_appointments.py
│   │   └── test_validation.py
│   │
│   ├── requirements.txt
│   ├── alembic.ini
│   └── .env.example
│
└── frontend/
    │
    ├── src/
    │   │
    │   ├── components/
    │   │   ├── hooks/
    │   ├── pages/
    │   ├── services/
    │   ├── utils/
    │   ├── constants/
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    │
    ├── public/
    ├── package.json
    ├── vite.config.js
    └── .env.example
```

The exact file structure may evolve during development, but responsibilities remain separated between UI, API communication, business logic, and persistence.

---

# Database Design

The main database table is:

```text
appointments
```

It contains:

| Column | Purpose |
|---|---|
| `id` | UUID primary key |
| `title` | Appointment title |
| `description` | Optional appointment description |
| `appointment_date` | Appointment date |
| `start_time` | Start time |
| `end_time` | End time |
| `status` | Current appointment state |
| `created_at` | Record creation timestamp |
| `updated_at` | Last update timestamp |

## Appointment ID

Appointments use UUID identifiers rather than sequential integers.

Advantages include:

- globally unique identifiers
- less predictable IDs
- suitable for distributed systems
- avoids exposing simple sequential record numbers

UUIDs are stored using the database's UUID type rather than being treated as arbitrary strings.

UUIDs are an identifier strategy, not an authorization mechanism. Authentication and authorization were not required by the assignment and therefore were intentionally not added.

---

# Appointment Lifecycle

Appointments follow a simple state machine:

```text
                ┌───────────────┐
                │   Scheduled   │
                └───────┬───────┘
                        │
              ┌─────────┴─────────┐
              │                   │
              ▼                   ▼
        ┌───────────┐       ┌───────────┐
        │ Completed │       │ Cancelled │
        └───────────┘       └───────────┘
```

Valid transitions:

```text
scheduled → completed
scheduled → cancelled
```

Completed and cancelled appointments are read-only.

This means:

- completed appointments cannot be edited
- completed appointments cannot be cancelled again
- cancelled appointments cannot be edited
- cancelled appointments cannot be completed
- cancelled appointments are not deleted

This preserves appointment history while preventing invalid lifecycle changes.

---

# Conflict Detection

Only scheduled appointments reserve time slots.

Two scheduled appointments conflict when they are on the same date and:

```text
existing_start < new_end
AND
existing_end > new_start
```

This represents half-open time intervals:

```text
[start, end)
```

### Example — Conflict

```text
Existing: 10:00 ───── 11:00
New:           10:30 ───── 11:30
```

These overlap and are rejected.

### Example — Exact overlap

```text
Existing: 10:00 ───── 11:00
New:      10:00 ───── 11:00
```

Rejected.

### Example — Adjacent appointments

```text
Existing: 10:00 ───── 11:00
New:                    11:00 ───── 12:00
```

Allowed.

### Example — Different dates

```text
September 10: 10:00 ─ 11:00
September 11: 10:00 ─ 11:00
```

Allowed.

### Updating an appointment

When an appointment is edited, its own ID is excluded from the conflict query.

Otherwise, every appointment would conflict with itself.

Conflict detection is implemented on the backend because the backend is the authoritative source for scheduling rules.

---

# Validation Strategy

Validation exists at two levels.

## Frontend validation

The frontend provides immediate feedback for usability.

Examples:

- missing title
- missing date
- missing start time
- missing end time
- end time before start time

This allows users to correct simple errors without waiting for an API request.

## Backend validation

FastAPI/Pydantic validates incoming data, while the appointment service enforces business rules.

The backend validates:

- required fields
- time relationships
- appointment state
- conflicts
- resource existence

Frontend validation is therefore treated as a UX improvement, not a security boundary.

---

# Filtering

The appointment list supports:

```text
GET /api/appointments?date=YYYY-MM-DD
```

```text
GET /api/appointments?status=scheduled
```

and combined filtering:

```text
GET /api/appointments?date=YYYY-MM-DD&status=scheduled
```

Filtering is performed before pagination.

Conceptually:

```text
Database
   ↓
Apply date filter
   ↓
Apply status filter
   ↓
Calculate total
   ↓
Apply stable ordering
   ↓
Apply pagination
   ↓
Return results
```

This avoids loading the entire appointment table into application memory.

---

# Pagination

The appointment collection endpoint supports server-side pagination.

Example:

```text
GET /api/appointments?page=1&page_size=10
```

The response contains:

```json
{
  "items": [],
  "page": 1,
  "page_size": 10,
  "total": 25,
  "total_pages": 3
}
```

Pagination is implemented at the database/query layer using the equivalent of:

```text
COUNT
LIMIT
OFFSET
```

The frontend provides controls for navigating between pages.

When filters change, pagination resets to page 1 to avoid displaying an empty page caused by stale pagination state.

---

# API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | API health check |
| `GET` | `/api/appointments` | List appointments with filtering and pagination |
| `GET` | `/api/appointments/{id}` | Retrieve one appointment |
| `POST` | `/api/appointments` | Create appointment |
| `PUT` | `/api/appointments/{id}` | Update scheduled appointment |
| `PATCH` | `/api/appointments/{id}/complete` | Complete appointment |
| `PATCH` | `/api/appointments/{id}/cancel` | Cancel appointment |

### List query parameters

```text
date
status
page
page_size
```

Example:

```text
GET /api/appointments?status=scheduled&page=1&page_size=10
```

---

# HTTP Error Handling

The API uses meaningful HTTP responses for expected conditions.

Examples:

| Status | Meaning |
|---|---|
| `200` | Successful read/update/action |
| `201` | Appointment created |
| `404` | Appointment does not exist |
| `409` | Conflict or invalid state transition |
| `422` | Validation error |
| `500` | Unexpected server error |

Examples of business-rule errors:

```text
This time slot conflicts with another scheduled appointment.
```

```text
Completed appointments cannot be edited.
```

```text
Cancelled appointments cannot be completed.
```

The frontend converts API failures into user-friendly feedback rather than exposing raw server errors.

---

# Frontend Architecture

The frontend is organized by responsibility.

### Components

Reusable UI components such as:

- AppointmentCard
- AppointmentForm
- AppointmentFilters
- StatusBadge
- ConfirmationDialog
- Toast
- EmptyState
- LoadingSkeleton
- ErrorMessage

### Pages

Page-level composition such as:

```text
AppointmentBoardPage
```

### Hooks

Application state and reusable appointment/theme behavior.

### Services

Centralized API communication.

For example:

```text
apiClient
appointmentService
```

Components do not contain scattered Axios requests.

This keeps API communication separate from presentation logic.

---

# Theme System

The application supports light and dark themes.

The selected theme is persisted in browser storage.

Theme styling is applied consistently throughout the application instead of only changing the main page background.

Components covered include:

- page layout
- appointment cards
- forms
- inputs
- buttons
- dialogs
- toast notifications
- skeleton loaders
- empty states
- date pickers

---

# UX Design Decisions

Several UX decisions were made intentionally.

## Confirmation before Complete

Completing an appointment changes its lifecycle state and makes it read-only.

Therefore, the user must confirm the action.

## Confirmation before Cancel

Cancellation changes the appointment state, so confirmation reduces accidental actions.

## Cancel instead of Delete

Appointments are not deleted through the UI.

Cancelled records remain visible so that appointment history is preserved.

## Read-only historical records

Completed and cancelled appointments remain visible but cannot be modified.

This prevents users from accidentally changing historical records.

## Backend-first business rules

Important rules such as overlap detection and state transitions are enforced by the backend.

The frontend only improves the user experience.

## Pessimistic mutations

Important state-changing actions wait for backend confirmation before the UI treats them as successful.

This avoids showing a completed/cancelled state when the server rejected the operation.

---

# Local Development Setup

## Prerequisites

Install:

- Python 3.x
- Node.js and npm
- PostgreSQL-compatible database

A Neon PostgreSQL database can be used for development.

---

## 1. Clone the Repository

```bash
git clone <repository-url>
cd appointment-board
```

---

# 2. Backend Setup

Enter the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create the environment file:

```powershell
Copy-Item .env.example .env
```

Set the PostgreSQL connection string inside:

```text
backend/.env
```

Example:

```env
DATABASE_URL=your_postgresql_connection_string
```

Do not commit the real `.env` file.

---

# 3. Database Migration

Apply the latest Alembic migration:

```bash
alembic upgrade head
```

This creates/updates the required database schema.

---

# 4. Start Backend

From the `backend` directory:

```bash
uvicorn app.main:app --reload
```

The API will normally be available at:

```text
http://localhost:8000
```

Interactive Swagger documentation:

```text
http://localhost:8000/docs
```

---

# 5. Frontend Setup

Open another terminal.

From the project root:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create the environment file:

```powershell
Copy-Item .env.example .env
```

Set:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Start the frontend:

```bash
npm run dev
```

Vite will display the local development URL, normally:

```text
http://localhost:5173
```

---

# Environment Variables

## Backend

File:

```text
backend/.env
```

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |

Example:

```env
DATABASE_URL=your_database_connection_string
```

## Frontend

File:

```text
frontend/.env
```

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the FastAPI server |

Example:

```env
VITE_API_BASE_URL=http://localhost:8000
```

The frontend must not contain database credentials or private API secrets.

---

# Testing

Backend tests are located in:

```text
backend/tests/
```

Run them from the backend directory:

```bash
pytest -v
```

The tests cover areas such as:

- appointment creation
- validation
- appointment retrieval
- appointment updates
- UUID handling
- overlap detection
- adjacent appointments
- different dates
- completed/cancelled behavior
- invalid state transitions
- date filtering
- status filtering
- combined filters
- pagination
- error responses

Tests should use a controlled test database/session configuration rather than modifying the normal development/production database.

---

# Frontend Quality Checks

From the frontend directory:

```bash
npm run lint
```

Build the production bundle:

```bash
npm run build
```

---

# Security and Configuration

The repository intentionally does not contain:

- database passwords
- Neon credentials
- API secrets
- private keys
- authentication tokens

Environment files containing secrets are excluded through Git configuration.

Only `.env.example` files containing placeholder values should be committed.

---

# Scope and Assumptions

The project intentionally stays within the requirements of the appointment-board assignment.

The following are outside the current scope:

- Authentication
- Authorization
- User accounts
- Roles/RBAC
- Recurring appointments
- Email notifications
- SMS notifications
- Calendar synchronization
- Multi-timezone scheduling
- Drag-and-drop scheduling
- Appointment deletion
- Advanced analytics
- Reporting dashboards

Authentication and RBAC were not implemented because they were not required for the assignment.

The application is designed around a small-team appointment board rather than a multi-tenant scheduling platform.

---

# Design Assumptions

The following assumptions are used:

1. An appointment requires a title, date, start time, and end time.
2. Description is optional.
3. End time must be later than start time.
4. Only scheduled appointments reserve a time slot.
5. Overlapping scheduled appointments on the same date are rejected.
6. Adjacent appointments are allowed.
7. Completed appointments are historical/read-only records.
8. Cancelled appointments are historical/read-only records.
9. Cancelled appointments are not deleted.
10. The appointment being updated is excluded from its own conflict check.
11. Backend validation is authoritative.
12. UUIDs are used for appointment identifiers.
13. Pagination is performed server-side.
14. Date and status filtering is performed server-side.
15. Timezone conversion is outside the scope of this assignment.
16. Recurring appointments are outside the scope of this assignment.

---

# Engineering Decisions

## Why FastAPI?

FastAPI provides:

- typed request/response models
- automatic API documentation
- Pydantic validation
- clean route definitions
- good separation between API and business logic

## Why SQLAlchemy?

SQLAlchemy provides a structured ORM/database access layer and keeps database operations separate from API handlers.

## Why PostgreSQL?

PostgreSQL provides:

- strong relational data modeling
- reliable constraints
- UUID support
- mature SQL capabilities
- good compatibility with SQLAlchemy

## Why UUIDs?

UUIDs provide non-sequential, globally unique identifiers and are a better long-term identifier choice than exposing simple sequential record IDs.

## Why React state instead of Redux/Zustand?

The application has relatively small and localized state requirements.

React's built-in state and hooks are sufficient for:

- appointments
- filters
- pagination
- forms
- loading state
- dialogs
- theme state

Adding a global state library would increase complexity without solving a current problem.

## Why server-side conflict detection?

Appointment conflicts are a business rule.

If conflict detection existed only in the frontend, another client or direct API request could bypass it.

Therefore, the backend remains authoritative.

## Why pagination at the database level?

Fetching every appointment and slicing the results in the frontend would become inefficient as the dataset grows.

Database-level pagination allows the API to retrieve only the records required for the requested page.

---

# Future Improvements

If this application were extended beyond the assignment, possible improvements could include:

- Authentication and authorization
- Team/user ownership
- Role-based permissions
- Recurring appointments
- Calendar integrations
- Timezone-aware scheduling
- Email/SMS reminders
- Advanced search
- Audit history
- Appointment categories
- Team availability
- More advanced scheduling constraints

These features were intentionally excluded from the assignment implementation to keep the project focused.

---

# Assignment Context

This project was developed as a technical assignment for a **Full Stack Developer Intern** position.

The implementation focuses on demonstrating:

- frontend development
- REST API design
- backend validation
- business-rule implementation
- relational database integration
- conflict detection
- state management
- pagination
- responsive UI development
- error handling
- automated backend testing
- clean separation of responsibilities

The goal was to build a maintainable solution while keeping the scope aligned with the assignment requirements.

---

# License

This project was created as a technical assignment and demonstration project.

If this repository is used beyond the assignment, an appropriate project-specific license can be added.