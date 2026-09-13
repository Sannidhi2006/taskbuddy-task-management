# TaskBuddy 📝
> **"Your friendly task manager"** — A full-stack, real-time productivity web application with dark/light themes, Pomodoro focus sessions, smart analytics, streak tracking, and mobile-first responsive design.

---

## 📑 Table of Contents
1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
3. [Tech Stack](#tech-stack)
4. [Folder Structure](#folder-structure)
5. [How Authentication Works](#how-authentication-works)
6. [API Reference](#api-reference)
7. [Database Models](#database-models)
8. [Real-Time Socket.IO Synchronization](#real-time-socketio-synchronization)
9. [Environment Variables](#environment-variables)
10. [Installation & Getting Started](#installation--getting-started)
11. [Running Tests & Verification](#running-tests--verification)
12. [Feature Checklist](#feature-checklist)

---

## 🌟 Project Overview

**TaskBuddy** is a full-stack task management application built for real productivity:

- **Rich task management** with priority tags, category labels, and due dates.
- **My Day view** that automatically surfaces tasks due today or overdue.
- **Streak tracking** — consecutive daily completion streaks with best-ever records.
- **Daily Goals** — configurable per-day targets with live progress tracking.
- **Pomodoro Focus Mode** — a distraction-free 25/5 minute timer with session recording.
- **Analytics dashboard** — completion rate, streak data, focus counts, habits, weekly bar chart.
- **Search, Filter & Sort** — live debounced search + status/priority/category filters + 7 sort modes.
- **Dark & Light Mode** — theme toggle persisted per user in the database.
- **Toast notifications** for every meaningful action, plus inline contextual messages.
- **Real-time multi-tab sync** via authenticated Socket.IO private user rooms.
- **Strict User Isolation** — cryptographically enforced; no cross-user data access is possible.

---

## ✨ Key Features

### 🔐 Authentication & Security
- Cookie-based JWT authentication (`httpOnly`, `SameSite=Lax`, `Path=/`) with bcrypt password hashing.
- Automatic session expiry detection: any 401 response triggers a graceful redirect to login with a toast notification.
- Protected routes on both frontend (React Router) and backend (authMiddleware on every endpoint).

### ✅ Task Management
- **Create** tasks with title (required), priority (High / Medium / Low), category (General / Work / Personal), and optional due date.
- **Inline edit** title, priority, category, and due date directly on the card.
- **Complete** tasks (strikethrough + CompletionHistory record) and **undo** instantly.
- **Delete** single tasks or **Clear All** (with confirmation modal).
- Backend validation: invalid due date format → 400, unrecognised priority/category → 400 (case-insensitive matching — `"high"` is accepted and normalised to `"High"`).

### 🔍 Search, Filter & Sort
- **Live search** with 300 ms debounce — searches task titles in real time.
- **Status filter**: All / Pending / Completed segmented tabs.
- **Priority filter**: All / High / Medium / Low dropdown.
- **Category filter**: All / General / Work / Personal dropdown.
- **Sort**: Newest, Oldest, High→Low Priority, Low→High Priority, Pending First, Completed First, Due Date.
- All filters compose: every active filter refines the same result set.
- Result count badge + Reset button appears when any filter is active.

### 📊 Statistics
- Live stat cards: **Total**, **Completed**, **Pending**.
- Animated percentage progress bar with gradient fill.
- Live text counter: `"{completed} of {total} tasks completed"`.

### ☀️ My Day
- Smart view that shows only tasks with a due date of **today or earlier** (pending + overdue).
- Remaining count badge updates in real time alongside the tab.

### 🔥 Streak & Daily Goal
- **Streak**: counts consecutive calendar days on which the user completed at least one task.
  - Streak continues if you completed a task today **or** yesterday (grace period).
  - Best-ever streak tracked independently.
- **Daily Goal**: configurable target (default: 5 tasks/day) with a live progress bar.
  - Inline +/− controls to adjust the goal.
  - "🔥 You did it! Today's goal is complete!" toast fires exactly once when the target is hit.

### 📈 Analytics
- Accessed via the **📊 Analytics** tab on the dashboard.
- Cards: Completion Rate, Consistency Streak (current + best), Total Tasks created, Top Category & Priority.
- Today vs This Week tasks-completed banner.
- **Weekly bar chart** (Mon–Sun of the current week) — today's bar highlighted with accent glow.
- Refresh button to reload data on demand.
- All metrics return **zeros** (not errors) when the user has no data yet.

### 🌙 Dark / Light Mode
- Theme toggle (🌙 / ☀️) in the header next to the user menu.
- Choice is persisted via `PATCH /api/users/theme` and applied immediately without page reload.
- Dark mode is the default; light mode uses a matching yellow/orange accent palette.

### 🔔 Toast Notifications & Contextual Messages
**Success toasts:**
- Task added / updated / deleted / restored (undo) / all cleared
- "🎉 Nice! One more task off your list!" — on task complete
- "🔥 You did it! Today's goal is complete!" — on daily goal hit

**Error toasts:**
- "Please enter a task." — empty submit
- "Invalid email or password." — wrong credentials
- "Something went wrong. Please try again." — generic API failure
- "Session has expired. Please log in again." — 401 on any protected request

**Inline contextual messages (small text, not toasts):**
- `👀 You've got {n} tasks waiting. Let's tackle one!` — when 5+ tasks pending
- `🥳 You're all done! Amazing work!` — when all tasks completed
- `🌱 Start small. Add your first task!` — empty state (zero tasks)

### 📱 Responsive Design
- Fully mobile-first: 320 px → desktop. Zero horizontal scroll on any screen.
- Stat cards stack vertically on mobile (`grid-cols-1 sm:grid-cols-3`).
- Filter controls wrap cleanly on narrow screens.
- Task cards with long due-date badges wrap inside the card.
- Analytics weekly chart fits within 320 px screens with responsive bar widths.

---

## 🛠️ Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 (dark charcoal `#090a0c`, amber/orange accents) |
| Icons | Lucide React |
| Routing | React Router DOM v7 |
| Toast Notifications | Sonner |
| Real-Time Client | Socket.IO Client |

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js (ES Modules) |
| Framework | Express.js |
| Database / ODM | MongoDB + Mongoose |
| Authentication | JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, `cookie-parser` |
| Real-Time Server | Socket.IO Server |
| CORS | Express `cors` middleware with explicit credential support |
| Testing | Node.js native test runner (`node:test` + `node:assert`) |

---

## 📁 Folder Structure

```
TaskManagement/
├── backend/
│   ├── config/
│   │   ├── db.js                    # MongoDB connection
│   │   └── socket.js                # Authenticated Socket.IO private user rooms
│   ├── controllers/
│   │   ├── analytics.controller.js  # GET /api/analytics
│   │   ├── auth.controller.js       # Register, login, logout, getMe
│   │   ├── focus.controller.js      # Focus session create & today count
│   │   ├── goal.controller.js       # Daily goal get & update
│   │   ├── health.controller.js     # Health check
│   │   ├── streak.controller.js     # Streak calculation
│   │   ├── task.controller.js       # Full task CRUD, stats, search/filter/sort
│   │   └── user.controller.js       # Theme preference persistence
│   ├── middleware/
│   │   └── auth.middleware.js       # JWT verification, req.userId injection
│   ├── models/
│   │   ├── CompletionHistory.js     # One record per task-completion event
│   │   ├── FocusSession.js          # One record per completed Pomodoro session
│   │   ├── Task.js                  # Task schema (title, priority, category, dueDate)
│   │   └── User.js                  # User schema (name, email, dailyGoal, themePreference)
│   ├── routes/
│   │   ├── analytics.routes.js      # GET /api/analytics
│   │   ├── auth.routes.js           # /api/auth/*
│   │   ├── focus.routes.js          # /api/focus-sessions/*
│   │   ├── goal.routes.js           # /api/goals
│   │   ├── health.routes.js         # GET /api/health
│   │   ├── streak.routes.js         # GET /api/streak
│   │   ├── task.routes.js           # /api/tasks/*
│   │   └── user.routes.js           # PATCH /api/users/theme
│   ├── tests/
│   │   ├── analytics.test.js        # Analytics endpoint tests
│   │   ├── api.test.js              # Core auth + task CRUD tests
│   │   ├── focus.test.js            # Focus session tests
│   │   ├── goal.test.js             # Daily goal tests
│   │   ├── streak.test.js           # Streak calculation tests
│   │   └── validation-errors.test.js # Input validation & error handling tests
│   ├── .env.example
│   ├── package.json
│   └── server.js                    # Express app entry point + Socket.IO init
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AnalyticsView.tsx    # Analytics tab with bar chart & metric cards
│   │   │   ├── DailyGoalProgress.tsx# Daily goal progress bar + inline controls
│   │   │   ├── FocusModeView.tsx    # Pomodoro timer, session recording, retry UI
│   │   │   ├── Header.tsx           # Top bar, theme toggle, branding
│   │   │   ├── ProtectedRoute.tsx   # Auth-gated route wrapper
│   │   │   ├── TaskFilterControls.tsx # Search + status/priority/category/sort
│   │   │   ├── TaskInput.tsx        # Task creation form
│   │   │   ├── TaskItem.tsx         # Task card (view, inline edit, due date badge)
│   │   │   ├── TaskList.tsx         # Task list + empty state
│   │   │   ├── TaskProgress.tsx     # Progress bar + counter
│   │   │   ├── TaskStatsCards.tsx   # Total / Completed / Pending stat cards
│   │   │   └── UserMenu.tsx         # Avatar dropdown, logout, theme toggle
│   │   ├── context/
│   │   │   ├── AuthContext.tsx      # Auth state, session-expiry listener
│   │   │   └── ThemeContext.tsx     # Dark/light theme state + persistence
│   │   ├── hooks/
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx    # Main dashboard orchestrator
│   │   │   ├── LoginPage.tsx        # Login view
│   │   │   └── RegisterPage.tsx     # Registration view
│   │   ├── services/
│   │   │   ├── api.ts               # authFetch wrapper (auto 401 handling)
│   │   │   ├── authService.ts       # Auth API calls
│   │   │   ├── socket.ts            # Socket.IO singleton
│   │   │   └── taskService.ts       # All task, analytics, focus, goal API calls
│   │   ├── App.tsx
│   │   ├── index.css                # Tailwind directives, CSS variables, animations
│   │   └── main.tsx
│   ├── .env.example
│   ├── package.json
│   └── vite.config.ts
│
├── .env.example                     # Root overview of all env vars
└── README.md
```

---

## 🔒 How Authentication Works

1. **Registration**: `POST /api/auth/register` validates name/email/password, checks for duplicate email, hashes the password with bcrypt (10 rounds), and stores the user.
2. **Login**: `POST /api/auth/login` verifies the password with bcrypt and issues a signed JWT (7-day expiry) via a `Set-Cookie` header:
   ```javascript
   {
     httpOnly: true,       // Blocks XSS / JS token theft
     secure: (NODE_ENV === 'production'),  // HTTP in dev, HTTPS in prod
     sameSite: (NODE_ENV === 'production') ? 'strict' : 'lax',
     path: '/',
     maxAge: 7 * 24 * 60 * 60 * 1000   // 7 days
   }
   ```
3. **Session verification**: `authMiddleware` extracts `req.cookies.token`, verifies the JWT signature, and sets `req.userId`. The user ID is never read from request body or query params.
4. **Logout**: `POST /api/auth/logout` clears the cookie with `maxAge: 0`.
5. **Expired session**: The frontend `authFetch` wrapper intercepts any `401 Unauthorized` response. It dispatches a `taskbuddy:auth-expired` custom event which `AuthContext` catches — clearing user state and redirecting to `/login` with a toast notification.

---

## 📡 API Reference

All endpoints except health and auth require a valid session cookie (`credentials: 'include'`).

### Health

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/health` | Server & DB health status | No |

### Authentication

| Method | Endpoint | Body | Description | Auth |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | `{ name, email, password }` | Create account | No |
| `POST` | `/api/auth/login` | `{ email, password }` | Login & set cookie | No |
| `POST` | `/api/auth/logout` | — | Clear session cookie | Yes |
| `GET` | `/api/auth/me` | — | Get current user profile | Yes |

### Tasks

| Method | Endpoint | Query / Body | Description | Auth |
|---|---|---|---|---|
| `GET` | `/api/tasks` | `?search=&status=&priority=&category=&sortBy=` | Get filtered & sorted tasks | Yes |
| `POST` | `/api/tasks` | `{ title, priority?, category?, dueDate? }` | Create task | Yes |
| `PUT` | `/api/tasks/:id` | `{ title?, priority?, category?, dueDate? }` | Update task | Yes |
| `PATCH` | `/api/tasks/:id/complete` | — | Mark complete | Yes |
| `PATCH` | `/api/tasks/:id/undo` | — | Mark incomplete | Yes |
| `DELETE` | `/api/tasks/:id` | — | Delete task | Yes |
| `DELETE` | `/api/tasks` | — | Clear all tasks (user-scoped) | Yes |
| `GET` | `/api/tasks/stats` | — | `{ total, completed, pending }` | Yes |

**Query parameters for `GET /api/tasks`:**

| Param | Values | Default |
|---|---|---|
| `search` | any string | `""` |
| `status` | `all` \| `pending` \| `completed` | `all` |
| `priority` | `all` \| `High` \| `Medium` \| `Low` | `all` |
| `category` | `all` \| `General` \| `Work` \| `Personal` | `all` |
| `sortBy` | `newest` \| `oldest` \| `priority-high` \| `priority-low` \| `pending-first` \| `completed-first` \| `dueDate` | `newest` |

**Validation rules:**
- `dueDate` must be a parseable ISO date string or `null` — invalid formats return `400`.
- `priority` must be `High`, `Medium`, or `Low` (case-insensitive) — unknown values return `400`.
- `category` must be `General`, `Work`, or `Personal` (case-insensitive) — unknown values return `400`.

### Streak

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/streak` | `{ currentStreak, bestStreak }` | Yes |

### Daily Goal

| Method | Endpoint | Body | Description | Auth |
|---|---|---|---|---|
| `GET` | `/api/goals` | — | `{ dailyGoal, tasksCompletedToday }` | Yes |
| `PUT` | `/api/goals` | `{ dailyGoal }` (integer ≥ 1) | Update daily target | Yes |

### Focus Sessions

| Method | Endpoint | Body | Description | Auth |
|---|---|---|---|---|
| `POST` | `/api/focus-sessions` | `{ taskId, duration }` | Record a completed session | Yes |
| `GET` | `/api/focus-sessions/today` | — | `{ count }` — sessions completed today | Yes |

**Validation:** `taskId` must be a valid MongoDB ObjectId if provided — invalid format returns `400`.

### Analytics

| Method | Endpoint | Query | Description | Auth |
|---|---|---|---|---|
| `GET` | `/api/analytics` | `?timezone=` (IANA tz, e.g. `Asia/Kolkata`) | Full analytics payload | Yes |

**Response shape:**
```json
{
  "success": true,
  "totalTasks": 12,
  "completedTasks": 8,
  "pendingTasks": 4,
  "completionRate": 67,
  "currentStreak": 3,
  "bestStreak": 7,
  "totalFocusSessions": 15,
  "mostUsedCategory": "Work",
  "mostCommonPriority": "High",
  "tasksCompletedToday": 2,
  "tasksCompletedThisWeek": 9,
  "weeklyBreakdown": [
    { "day": "Mon", "date": "2026-09-07", "count": 1 },
    { "day": "Tue", "date": "2026-09-08", "count": 3 },
    "... (7 entries, Mon–Sun of current week)"
  ]
}
```

### User Preferences

| Method | Endpoint | Body | Description | Auth |
|---|---|---|---|---|
| `PATCH` | `/api/users/theme` | `{ theme: "dark" \| "light" }` | Persist theme choice | Yes |

---

## 🗄️ Database Models

### User
| Field | Type | Notes |
|---|---|---|
| `name` | String | 2–50 chars, required |
| `email` | String | Unique, lowercase, validated format |
| `passwordHash` | String | bcrypt hash, never returned in JSON |
| `dailyGoal` | Number | Default: 5, min: 1 |
| `themePreference` | String | `"dark"` (default) or `"light"` |
| `createdAt` | Date | Auto-generated |

### Task
| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId | Reference to User, indexed |
| `title` | String | 1–150 chars, required |
| `priority` | String | `High` / `Medium` (default) / `Low` |
| `category` | String | `General` (default) / `Work` / `Personal` |
| `completed` | Boolean | Default: false |
| `dueDate` | Date | Nullable, optional |
| `completedAt` | Date | Set on completion, cleared on undo |
| `createdAt` / `updatedAt` | Date | Auto-managed |

### CompletionHistory
One document is created each time a task is completed. Used for streak and daily-goal calculations.

| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId | Reference to User |
| `taskId` | ObjectId | Reference to Task |
| `completedAt` | Date | Timestamp of completion |

### FocusSession
One document per completed 25-minute Pomodoro session.

| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId | Reference to User |
| `taskId` | ObjectId | Reference to Task |
| `duration` | Number | Minutes (typically 25) |
| `recordedAt` | Date | Timestamp of session completion |

---

## ⚡ Real-Time Socket.IO Synchronization

1. **Handshake**: The client connects with `withCredentials: true`. The server verifies the JWT from `socket.handshake.headers.cookie` — unauthenticated connections are rejected.
2. **Private rooms**: Each socket joins `user:${userId}` — events are scoped exclusively to the authenticated user.
3. **Events broadcast on each operation:**

| Event | Triggered By |
|---|---|
| `task:created` | `POST /api/tasks` |
| `task:updated` | `PUT /api/tasks/:id` |
| `task:completed` | `PATCH /api/tasks/:id/complete` |
| `task:undone` | `PATCH /api/tasks/:id/undo` |
| `task:deleted` | `DELETE /api/tasks/:id` |
| `tasks:cleared` | `DELETE /api/tasks` |

The dashboard listens for all six events and refreshes tasks, stats, streak, goal, focus count, and analytics automatically.

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | HTTP server port |
| `DATABASE_URL` | `mongodb://localhost:27017/taskbuddy` | MongoDB connection string |
| `JWT_SECRET` | *(required)* | Secret key for JWT signing — use a long random string in production |
| `CLIENT_URL` | `http://localhost:5173` | Frontend origin for CORS and Socket.IO |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5000/api` | Backend REST API base URL |
| `VITE_SOCKET_URL` | `http://localhost:5000` | Backend Socket.IO server URL |

> **No new environment variables** were introduced in the feature additions (Prompts 3–13). All features operate through the existing four backend variables.

---

## 🚀 Installation & Getting Started

### Prerequisites
- **Node.js** v18 or later
- **npm** v9 or later
- A **MongoDB** instance (local or cloud Atlas — the `DATABASE_URL` in `.env`)

### 1. Clone & Install

```bash
# Clone the repository
git clone <repo-url>
cd TaskManagement

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

**Backend:**
```bash
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL and JWT_SECRET at minimum
```

**Frontend:**
```bash
cd ../frontend
cp .env.example .env
# VITE_API_URL and VITE_SOCKET_URL default to localhost — no changes needed for local dev
```

### 3. Run Locally

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# → http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# → http://localhost:5173
```

Open **http://localhost:5173** in your browser and register an account to get started.

---

## 🧪 Running Tests & Verification

### Backend Test Suite

Covers all 6 feature domains — 42 tests total:

```bash
cd backend
npm test
```

| Test File | Coverage |
|---|---|
| `api.test.js` | Auth (register, login, logout, me), task CRUD, user isolation, clear all |
| `analytics.test.js` | Analytics endpoint, zero-task baseline, full metrics calculation |
| `focus.test.js` | Focus session creation, today count |
| `goal.test.js` | Daily goal get/update, validation, tasksCompletedToday increments |
| `streak.test.js` | Streak calculation, multi-day continuity, undo behaviour |
| `validation-errors.test.js` | Invalid dueDate/priority/category → 400, case-insensitive normalisation, zero-task safety |

### Frontend Build & Type Check

```bash
cd frontend
npm run build
# tsc -b && vite build — must exit 0 with no TypeScript errors
```

---

## 📋 Feature Checklist

### Authentication
- [x] Register with name, email, password (min 6 chars) validation
- [x] Login with JWT issued in `httpOnly` cookie
- [x] Logout clears cookie immediately
- [x] Protected routes redirect unauthenticated users to `/login`
- [x] Passwords hashed with bcrypt (10 rounds) — never stored in plaintext
- [x] Expired session (401) triggers toast + redirect to login without data loss

### Authorization
- [x] All task, goal, streak, focus, and analytics endpoints require valid JWT
- [x] `req.userId` derived from verified JWT — never from request body
- [x] User B cannot read, update, complete, or delete User A's tasks
- [x] Socket.IO events broadcast only to the authenticated user's private room

### Task Management
- [x] Create task — title required, priority/category default if omitted
- [x] Read tasks — filtered and sorted via query parameters
- [x] Update task — inline edit of title, priority, category, due date
- [x] Delete single task
- [x] Complete task (strikethrough + CompletionHistory record)
- [x] Undo completed task (restores pending state, removes CompletionHistory)
- [x] Clear all tasks (modal confirmation, user-scoped)
- [x] Task stats endpoint returns `{ total, completed, pending }` — zeros if no tasks

### Task Options & Validation
- [x] Priority: High / Medium / Low (case-insensitive input normalised)
- [x] Category: General / Work / Personal (case-insensitive input normalised)
- [x] Due date: ISO date, optional, nullable — invalid format returns 400
- [x] Unknown priority or category value returns 400

### Statistics
- [x] Stat cards: Total, Completed, Pending — all dynamic
- [x] Completion percentage badge on Completed card
- [x] Animated gradient progress bar fills proportionally
- [x] All update immediately on every task operation

### Productivity Features
- [x] **My Day**: shows tasks due today or overdue; empty state when none
- [x] **Daily Goal**: configurable target, live progress bar, goal-complete toast
- [x] **Streak**: current consecutive days + personal best, grace period for yesterday
- [x] **Focus Mode**: distraction-free overlay, 25-min focus + 5-min break, task display
- [x] **Pomodoro timer**: animated countdown, progress bar, pause/reset/switch mode
- [x] **Focus session recording**: saved to DB on completion; retry UI on API failure
- [x] **Analytics**: completion rate, streak, focus count, habits, today vs week, bar chart

### Discovery
- [x] Search — 300 ms debounced live filter on task titles
- [x] Status filter — All / Pending / Completed
- [x] Priority filter — All / High / Medium / Low
- [x] Category filter — All / General / Work / Personal
- [x] Sort — 7 modes including due date
- [x] Combined filters compose correctly
- [x] Result count + Reset button visible when any filter is active

### UI & Themes
- [x] Dark mode — default, dark charcoal palette with amber/orange accents
- [x] Light mode — matching layout and accent colour on light backgrounds
- [x] Theme toggle in header, persisted via `PATCH /api/users/theme`
- [x] Empty state — 📝 "No tasks yet!" with call to action (zero tasks + after Clear All)
- [x] Toast notifications for all success/error/info events (via Sonner)
- [x] Inline contextual messages (5+ pending, all done, empty state)
- [x] Loading skeletons/spinners on stat cards, task list, analytics
- [x] Inline error banner with retry button on API failures
- [x] Responsive — mobile (320px+), tablet, desktop — no horizontal scroll

### Real-Time
- [x] Task created → `task:created` broadcast → all tabs refresh
- [x] Task updated → `task:updated` broadcast
- [x] Task completed → `task:completed` broadcast
- [x] Task undone → `task:undone` broadcast
- [x] Task deleted → `task:deleted` broadcast
- [x] Tasks cleared → `tasks:cleared` broadcast → immediate local clear + server sync
- [x] Socket.IO handshake requires valid JWT — unauthenticated connections rejected

### Backend
- [x] All REST APIs return consistent `{ success, ... }` JSON envelopes
- [x] MongoDB with Mongoose ODM; compound index on `(userId, createdAt)`
- [x] `authMiddleware` on every protected route
- [x] Input validation at controller layer (not relying solely on Mongoose)
- [x] Zero-task states return zeros, not 500 errors
- [x] WebSocket authenticated and user-isolated
- [x] 42 automated tests — all passing

### Documentation
- [x] README covers all features, all API endpoints, all environment variables
- [x] `.env.example` files present for root, backend, and frontend
- [x] Setup instructions cover prerequisites, install, configure, and run steps
- [x] API reference table with method, path, body/query, description, auth requirement
- [x] Database model field reference tables
