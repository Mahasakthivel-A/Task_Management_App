# Technical decisions

This file explains the choices I made where the assessment left room for interpretation. If something behaves a certain way and you're wondering "why?", it's probably written here.

---

## Architecture

### Single repo, two folders

I kept backend and frontend in one repository (`/backend` and `/frontend`) rather than splitting them. For a project this size it's easier to clone, run, and review. Separate repos would make sense if different teams owned each side.

### Express over NestJS

The brief allowed either. I went with Express + TypeScript because it's lighter and the app doesn't need Nest's dependency injection or module system. The tradeoff is you have to enforce structure yourself — which I tried to do with controllers, validators, and middleware layers.

---

## Authentication

### JWT in localStorage (not HttpOnly cookies)

The token lives in `localStorage` and goes out as `Authorization: Bearer <token>`.

**Why:** It's straightforward with Vite's dev proxy and doesn't require cookie/`SameSite`/`credentials` wiring during local development.

**Tradeoff:** An XSS attack could steal the token. In production I'd prefer HttpOnly cookies with CSRF protection. Helmet headers help, but they're not a full substitute.

### No role-based permissions on tasks

Any authenticated user can create, edit, or delete any task. Comments are different — only the author can delete their own.

**Why:** The assessment asked for "at least two users so task assignment can be demonstrated," not ownership rules. For a small team tool, shared edit access felt reasonable.

**In production I'd add:** task creator permissions, or an admin role.

---

## Data & API behavior

### Comments: delete only, no edit

You can delete your comment and write a new one, but there's no edit button. Keeps the discussion history honest and avoids "who said what when" confusion.

### Cascade delete on tasks

Deleting a task also deletes all its comments. Otherwise you'd end up with orphaned comment records pointing at nothing.

### Pagination defaults to 12

The frontend requests 12 tasks per page because that fills a 4-column grid cleanly (12 ÷ 4 = 3 rows). The API allows up to 100 per page if you need it.

### Search is debounced (400 ms)

Typing in the search box waits 400 ms after you stop before hitting the API. Cuts down on request spam without needing a "Search" button.

### Priority sort happens in memory — with a caveat

MongoDB sorts string fields alphabetically. For `high`, `medium`, `low`, alphabetical order is wrong (`high < low < medium`).

So when you sort by priority, the API fetches the page from MongoDB first, *then* re-sorts that page in memory using a numeric map (`high=3, medium=2, low=1`).

**This works for small datasets but has a real limitation:** if you have 50 tasks and you're on page 1, you're only sorting the 12 tasks on that page — not the full dataset. For an assessment with a handful of tasks, that's fine. At scale I'd store priority as a number in the database and sort in the query.

### Due date is optional

If a task has no due date, the card shows when it was created (relative time). If it does have one, the card shows the due date instead.

---

## Frontend

### Custom UI components (Radix + Tailwind)

I used Radix UI primitives (dialog, select, avatar) with hand-built Tailwind styling rather than importing the full ShadCN component library. Same visual direction — reusable `Button`, `Badge`, `Modal`, etc. — without pulling in every ShadCN file.

### Toast notifications for feedback

Create, update, delete, and errors all show as dismissible toasts. Keeps the layout stable instead of sprinkling inline alert banners everywhere.

### Vite proxy in development

`/api` requests from the frontend get proxied to `localhost:5000`. Avoids CORS headaches during dev without turning off backend CORS checks.

---

## Testing

### In-memory MongoDB for tests

Tests spin up `mongodb-memory-server` so reviewers can run `npm test` without installing MongoDB. The tradeoff is you're not testing real connection pooling — irrelevant at this scale.

### What tests cover

- Auth: register, login, validation errors, token checks
- Tasks: CRUD, pagination, search, status/priority filters, auth rejection
- Comments: add, list, author-only delete, forbidden delete for others

**Not covered yet:** assignee filter, sort order, frontend components, E2E flows.

---

## Assumptions I made

| Topic | Assumption |
|-------|------------|
| Auth on API routes | Every `/api/tasks` and comment route requires a valid JWT |
| User list endpoint | Any logged-in user can fetch all users (needed for assignee dropdown) |
| Pagination | Server-side, not client-side |
| Task assignment | Assignee must be a registered user; validated on create/update |
| Status values | `todo`, `in_progress`, `done` |
| Priority values | `low`, `medium`, `high` |

If any of these feel wrong for a follow-up interview question, I can explain or change them quickly.
