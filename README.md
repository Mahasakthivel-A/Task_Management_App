# TaskFlow

A small multi-user task management app built for the **A2V2.ai Full-Stack Engineer** assessment. Think of it as a lightweight internal tool for a small engineering team — create tasks, assign them, filter the list, and discuss work in comments.

---

## What's in the stack

| Layer    | Tech |
|----------|------|
| Frontend | React 18, TypeScript, Tailwind CSS, React Router |
| Backend  | Node.js, Express, TypeScript |
| Database | MongoDB with Mongoose |
| Auth     | JWT + bcrypt (12 salt rounds) |
| Tests    | Jest, supertest, mongodb-memory-server |

The UI uses Radix UI primitives with custom Tailwind components (ShadCN-style patterns, not a full ShadCN install).

---

## Project layout

```
A2V2- Task/
├── backend/          # Express API
│   └── src/
│       ├── config/       # DB + env
│       ├── controllers/  # auth, tasks, comments
│       ├── middleware/   # auth guard, validation, errors
│       ├── models/       # User, Task, Comment
│       ├── routes/
│       ├── validators/
│       └── __tests__/    # integration tests
└── frontend/         # React SPA
    └── src/
        ├── components/   # layout, tasks, ui
        ├── contexts/     # AuthContext
        ├── pages/        # login, register, task list, task detail
        └── services/     # API calls
```

---

## Before you run it

You'll need:

- **Node.js 18+**
- **MongoDB** running locally on port 27017, *or* a MongoDB Atlas connection string

---

## Getting started

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

API runs at **http://localhost:5000**

### 2. Frontend (separate terminal)

```bash
cd frontend
npm install
npm run dev
```

App runs at **http://localhost:5173**

### 3. Try it out

Since there's no seed script, register **two users** (e.g. Alice and Bob) so you can assign tasks between them:

1. Open http://localhost:5173/register and create User A
2. Log out, register User B
3. Log in as either user, click **New Task**, and assign it to the other person
4. Use filters, search, and open a task to add comments

---

## Environment variables

Copy `backend/.env.example` to `backend/.env`:

| Variable         | Default                                 | Notes |
|------------------|-----------------------------------------|-------|
| `NODE_ENV`       | `development`                           | Set to `test` automatically during tests |
| `PORT`           | `5000`                                  | API port |
| `MONGODB_URI`    | `mongodb://localhost:27017/taskmanager` | Your Mongo connection |
| `JWT_SECRET`     | *(placeholder in example)*              | **Change this in production** |
| `JWT_EXPIRES_IN` | `7d`                                    | Token lifetime |
| `CORS_ORIGIN`    | `http://localhost:5173`                 | Frontend URL |

---

## Running tests

Tests use an in-memory MongoDB — you don't need a real database running.

```bash
cd backend
npm test
```

For coverage:

```bash
npm run test:coverage
```

As of the last run: **29 tests passing** across auth, tasks, and comments.

---

## How it's wired (architecture)

```
Browser (React)
    ↕  REST + JWT Bearer token
Express API
    ↕  Mongoose
MongoDB
```

- **Auth:** Register/login returns a JWT. The frontend stores it in `localStorage` and sends it on every API call.
- **Protected routes:** All task and comment endpoints require a valid token. The React app redirects unauthenticated users to `/login`.
- **Validation:** Server-side via `express-validator`; the frontend also validates forms before submit.
- **Dev proxy:** Vite forwards `/api` to the backend so you don't hit CORS issues locally.

---

## API reference

Base path: `/api`

### Auth

| Method | Endpoint         | Auth | Description |
|--------|------------------|------|-------------|
| POST   | `/auth/register` | No   | Create account, returns token |
| POST   | `/auth/login`    | No   | Sign in, returns token |
| GET    | `/auth/me`       | Yes  | Current user profile |
| GET    | `/auth/users`    | Yes  | All users (for assignee dropdown) |

### Tasks

| Method | Endpoint       | Auth | Description |
|--------|----------------|------|-------------|
| GET    | `/tasks`       | Yes  | List with pagination, search, filters, sort |
| POST   | `/tasks`       | Yes  | Create task |
| GET    | `/tasks/:id`   | Yes  | Task detail |
| PUT    | `/tasks/:id`   | Yes  | Update task |
| DELETE | `/tasks/:id`   | Yes  | Delete task (+ its comments) |

**Query params for `GET /tasks`:**

- `page`, `limit` — pagination (default limit on frontend: 12)
- `search` — matches title or description (case-insensitive)
- `status` — `todo` | `in_progress` | `done`
- `priority` — `low` | `medium` | `high`
- `assignee` — user ObjectId
- `sortBy` — `createdAt` | `updatedAt` | `priority` | `title`
- `sortOrder` — `asc` | `desc`

### Comments

| Method | Endpoint                             | Auth | Description |
|--------|--------------------------------------|------|-------------|
| GET    | `/tasks/:taskId/comments`            | Yes  | List comments |
| POST   | `/tasks/:taskId/comments`            | Yes  | Add comment |
| DELETE | `/tasks/:taskId/comments/:commentId` | Yes  | Delete own comment only |

All responses follow a consistent shape: `{ success, data?, message?, pagination? }`.

---

## What works today

- Register / login with hashed passwords (never stored in plain text)
- Full task CRUD with title, description, status, priority, assignee, creator, optional due date, timestamps
- Paginated task grid with debounced search, status/priority/assignee filters, and sorting
- Task detail page with inline edit, delete, and a comments thread
- Loading, empty, and error states across the UI
- Toast feedback for user actions
- Responsive layout (1–4 column grid depending on screen width)
- API hardening: Helmet, rate limiting, NoSQL sanitization, request size limits

---

## Known limitations (honest list)

These are intentional scope cuts for an assessment-sized project, not oversights:

- No email verification or password reset
- No real-time updates — refresh happens after each action
- Comments can be deleted but not edited
- No file attachments
- Any logged-in user can edit/delete any task (no owner-only permissions)
- **Priority sorting** is applied in-memory *after* pagination, so sort order is only correct within the current page — fine for small datasets, wrong at scale (see `DECISIONS.md`)
- Tests cover the backend only; no frontend unit/E2E tests yet
- No Git history in the submission folder yet — initialize before submitting if reviewers expect commits

---

## Production build

```bash
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run build
# Serve frontend/dist/ with any static host; point API URL via env/proxy
```
