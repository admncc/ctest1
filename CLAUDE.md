# CLAUDE.md

This file provides guidance to AI assistants (Claude and others) working in this repository.

## Project Overview

**HandwerkerNetz** is a free, open-source marketplace platform similar to MyHammer that connects
customers (Auftraggeber) with craftsmen/tradespeople (Handwerker) in Germany.

- **Purpose**: Two-sided marketplace — customers post jobs, craftsmen submit bids
- **Language**: JavaScript (Node.js backend, React frontend)
- **Backend**: Node.js 20 + Express 4 + SQLite (via better-sqlite3)
- **Frontend**: React 18 + Vite 5 + React Router 6
- **Auth**: JWT (jsonwebtoken) + bcryptjs
- **Deployment**: Docker Compose (backend + frontend via nginx)

## Repository Structure

```
/
├── backend/
│   ├── src/
│   │   ├── index.js              # Express app entry point
│   │   ├── db/database.js        # SQLite setup + schema + category seed data
│   │   ├── middleware/auth.js    # JWT authenticate middleware + requireRole()
│   │   └── routes/
│   │       ├── auth.js           # POST /register, POST /login, GET /me
│   │       ├── users.js          # GET /:id, PUT /me, GET /:id/jobs
│   │       ├── jobs.js           # CRUD jobs + GET /categories + GET /mine/list
│   │       ├── bids.js           # POST /, PUT /:id, DELETE /:id, POST /:id/accept|reject
│   │       ├── reviews.js        # POST /, GET /user/:id
│   │       └── messages.js       # GET /conversations, GET /:userId, POST /
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── main.jsx              # React entry point
│   │   ├── App.jsx               # Routes + AuthProvider wrapper
│   │   ├── index.css             # Global CSS (CSS custom properties, utility classes)
│   │   ├── api/axios.js          # Axios instance with JWT interceptor
│   │   ├── context/AuthContext.jsx  # Auth state, login/register/logout
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── JobCard.jsx
│   │   │   └── StarRating.jsx    # StarDisplay + StarPicker
│   │   └── pages/
│   │       ├── Home.jsx          # Landing page with hero, categories, latest jobs
│   │       ├── Login.jsx
│   │       ├── Register.jsx      # Role selector (customer/craftsman)
│   │       ├── Jobs.jsx          # Browse + filter jobs
│   │       ├── JobDetail.jsx     # Job details, bid list, accept/reject, review
│   │       ├── PostJob.jsx       # Create new job (customer only)
│   │       ├── Dashboard.jsx     # User dashboard with stats
│   │       ├── Profile.jsx       # Public profile + edit own profile
│   │       └── Messages.jsx      # Conversation list + chat
│   ├── vite.config.js            # Vite config with /api proxy to backend:3001
│   ├── Dockerfile                # Multi-stage build → nginx
│   ├── nginx.conf                # SPA fallback + /api proxy
│   └── package.json
├── docker-compose.yml
├── .gitignore
└── CLAUDE.md
```

## Development Commands

### Backend

```bash
cd backend
npm install
npm run dev        # nodemon — auto-reload on changes
npm start          # production
```

### Frontend

```bash
cd frontend
npm install
npm run dev        # Vite dev server on http://localhost:5173
npm run build      # Build to dist/
npm run preview    # Preview production build
```

### Docker (full stack)

```bash
docker-compose up --build    # Build and start everything
docker-compose down          # Stop
docker-compose logs -f       # Follow logs
```

The frontend Vite dev server proxies `/api/*` → `http://localhost:3001`, so no CORS issues in development.

## API Reference

All API routes are prefixed with `/api`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/register | – | Register new user |
| POST | /auth/login | – | Login, returns JWT |
| GET | /auth/me | ✓ | Get own profile |
| GET | /users/:id | – | Public profile |
| PUT | /users/me | ✓ | Update own profile |
| GET | /jobs | – | List jobs (filter: category, location, status, page) |
| GET | /jobs/categories | – | List all categories |
| GET | /jobs/:id | – | Job detail + bids |
| POST | /jobs | ✓ customer | Create job |
| PUT | /jobs/:id | ✓ owner | Update open job |
| DELETE | /jobs/:id | ✓ owner | Cancel job |
| POST | /jobs/:id/complete | ✓ owner | Mark completed |
| GET | /jobs/mine/list | ✓ | Own jobs / bids |
| POST | /bids | ✓ craftsman | Submit bid |
| PUT | /bids/:id | ✓ craftsman | Update pending bid |
| DELETE | /bids/:id | ✓ craftsman | Withdraw pending bid |
| POST | /bids/:id/accept | ✓ customer | Accept bid (sets job in_progress) |
| POST | /bids/:id/reject | ✓ customer | Reject bid |
| POST | /reviews | ✓ | Leave review (job must be completed) |
| GET | /reviews/user/:id | – | Reviews for a user |
| GET | /messages/conversations | ✓ | List conversations |
| GET | /messages/:userId | ✓ | Messages with a user |
| POST | /messages | ✓ | Send message |
| GET | /messages/unread/count | ✓ | Unread count |

## Database Schema

SQLite tables (defined in `backend/src/db/database.js`):

- **users** — id, email, password, name, role (`customer`|`craftsman`), location, bio, phone, avatar
- **categories** — id, name, icon (emoji), slug
- **craftsman_profiles** — user_id (1:1), specializations (JSON array), hourly_rate, service_radius
- **jobs** — id, title, description, category_id, location, budget_min, budget_max, status (`open`|`in_progress`|`completed`|`cancelled`), customer_id, accepted_bid_id
- **bids** — id, job_id, craftsman_id, amount, message, status (`pending`|`accepted`|`rejected`). Unique constraint on (job_id, craftsman_id)
- **reviews** — id, job_id, reviewer_id, reviewee_id, rating (1–5), comment. Unique on (job_id, reviewer_id)
- **messages** — id, sender_id, receiver_id, job_id (optional), content, read

## Code Conventions

- **Language**: JavaScript (no TypeScript)
- **Backend**: CommonJS (`require`/`module.exports`), synchronous SQLite with better-sqlite3 (no async DB calls)
- **Frontend**: ESM (`import`/`export`), functional React components with hooks
- **Naming**: camelCase for JS, snake_case for DB columns and API query params
- **Styling**: CSS custom properties (`var(--primary)` etc.) defined in `index.css`. Utility classes (`.btn`, `.card`, `.badge-*`, `.grid-*`). No external CSS framework.
- **API errors**: always return `{ error: "message" }` with appropriate HTTP status
- **Auth guard**: use `authenticate` middleware for protected routes, `requireRole('customer'|'craftsman')` for role-based access

## Key Business Rules

1. Only **customers** can post jobs and accept/reject bids
2. Only **craftsmen** can submit bids
3. A craftsman can only submit one bid per job
4. Accepting a bid automatically rejects all other bids and sets job status to `in_progress`
5. Reviews can only be submitted after a job is `completed`
6. Customers review craftsmen; craftsmen review customers
7. Each party can only review once per job

## Environment Variables

```
# backend
PORT=3001
JWT_SECRET=change_this_in_production   # Required to change for production
DB_PATH=/app/data/platform.db          # SQLite file location
NODE_ENV=development

# frontend (vite.config.js proxy handles this in dev)
# In production, set VITE_API_URL if not using nginx proxy
```

## Testing

No automated tests are currently set up. To add them:
- Backend: Jest + supertest (test API routes)
- Frontend: Vitest + React Testing Library

## Notes for AI Assistants

- The SQLite DB is auto-created with schema and seed data on first start — no migrations needed
- better-sqlite3 is **synchronous** — do not use async/await for DB queries
- JWT tokens expire after 7 days; the axios interceptor handles 401s globally
- The Vite proxy (`/api → localhost:3001`) means frontend code always calls relative `/api/...` URLs
- CSS is hand-written with utility classes — do not install Tailwind or other CSS frameworks
- When adding a new route, also update this CLAUDE.md API reference table
- Run `npm run dev` in both `backend/` and `frontend/` simultaneously for local development
- The `data/` directory is gitignored — it holds the SQLite DB file (created at runtime)
