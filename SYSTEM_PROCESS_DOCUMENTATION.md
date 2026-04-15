# Sustainex System Process Documentation

This document explains how the **frontend** and **backend** work, and how data flows through the full application.

---

## 1) High-Level Architecture

Sustainex has two major parts:

- **Frontend**: React + TypeScript + Vite UI (`frontend/`)
- **Backend**: FastAPI service (`backend/`)

The frontend calls backend APIs using `/api/...` routes (proxied in development), and renders:

- Product passport views
- Routing engine decisions
- Materials intelligence insights
- Sustainability dashboard metrics

---

## 2) Backend Process (FastAPI)

Backend entrypoint: `backend/app/main.py`

### 2.1 Startup and API Configuration

At startup, FastAPI initializes:

- API metadata (title/version)
- CORS middleware
- In-memory store (`InMemoryStore`) from `data_store.py`

The in-memory store contains:

- Seed facilities (now India-based)
- Seed products with passport + lifecycle + coordinates

### 2.2 Core Backend Modules

- `schemas.py`: Pydantic models (contracts for request/response validation)
- `data_store.py`: in-memory persistence and seed data
- `services/routing_engine.py`: scoring logic and route recommendation
- `services/materials_intel.py`: material recoverability and embodied carbon calculations
- `services/sustainability.py`: aggregated dashboard metrics
- `services/geospatial.py`: Haversine distance calculation

### 2.3 Request Processing Flow

Typical process for a routing request:

1. Frontend sends `POST /routing/decide` with `product_id`.
2. Backend fetches product from store.
3. Routing engine:
   - reads product condition
   - computes material signals
   - computes nearest capable facility by geospatial distance
   - scores actions (`reuse`, `refurbish`, `remanufacture`, `recycle`)
4. Backend returns:
   - recommended action
   - confidence
   - action score breakdown
   - estimated value retained
   - estimated carbon saved
   - matched facility

### 2.4 Data Persistence Behavior

- Current persistence is **in-memory only**.
- Data survives while backend process runs.
- Restarting backend resets to seed data.

---

## 3) Frontend Process (React + Vite)

Frontend entrypoint: `frontend/src/main.tsx`

### 3.1 App Boot Sequence

1. React app mounts in `main.tsx`.
2. `BrowserRouter` enables route-based navigation.
3. `LenisProvider` enables smooth scrolling behavior.
4. `CursorTracker` renders a custom cursor indicator.
5. `App.tsx` renders route pages under `Layout`.

### 3.2 Routing and Page Composition

Defined in `frontend/src/App.tsx`:

- `/` -> Home page
- `/dashboard` -> Sustainability dashboard
- `/products` -> Product list
- `/products/:id` -> Product detail page
- `/router` -> Router lab page

Global shell (`components/Layout.tsx`) handles:

- top navigation
- section hash navigation
- smooth scroll to sections
- view transitions

### 3.3 API Communication Layer

Frontend API helper: `frontend/src/lib/api.ts`

Responsibilities:

- wraps `fetch`
- standardizes JSON headers
- throws detailed errors for failed HTTP responses
- exposes typed methods:
  - `listProducts`, `getProduct`, `createProduct`
  - `decide`, `materials`, `dashboard`, `facilities`, `simulateReturn`

### 3.4 Home Page Process

Home page (`pages/HomePage.tsx`) handles multiple flows:

- loads dashboard + product list on mount
- auto-selects a product
- requests routing decision for selected product
- displays impact snapshot and action chart
- supports user product input form

User product input process:

1. User fills details (name/category/condition/value/material score/city).
2. User accepts terms.
3. Frontend builds a valid product passport payload:
   - generated `product_id`
   - default material component
   - lifecycle manufactured event
   - city-based lat/lon
4. Frontend calls `createProduct`.
5. On success, product is inserted in state and selected immediately.
6. Routing engine dropdown reflects the new product.

### 3.5 Product Detail Process

Product detail page (`pages/ProductDetailPage.tsx`) runs:

- parallel load of:
  - product passport
  - material insight
  - routing decision
- supports:
  - condition override for what-if routing
  - return simulation endpoint (`/demo/return/{id}`)

---

## 4) End-to-End Process (Frontend <-> Backend)

### 4.1 Example: Route Decision

1. User selects product in UI dropdown.
2. Frontend calls `POST /routing/decide`.
3. Backend scores actions + finds nearest facility.
4. Frontend renders recommendation, impact numbers, facility.

### 4.2 Example: Add New User Product

1. User submits form in Home page.
2. Frontend sends `POST /products`.
3. Backend upserts in store.
4. Frontend updates local product list and selection.
5. New decision request runs for selected product.
6. UI updates impact snapshot + nearest facility.

---

## 5) Animation and Interaction Process

### 5.1 Smooth Scroll

- Lenis runs inside an animation frame loop in `main.tsx`.
- Scroll interpolation creates smooth movement.

### 5.2 Scroll Reveal

- `useScrollReveal` uses `IntersectionObserver`.
- Elements with `data-reveal` animate in/out when entering viewport.

### 5.3 Section Motion

- `useSectionTransitions` computes section transform/opacity based on viewport center.
- Values are tuned to avoid scroll jitter.

### 5.4 Cursor Tracking

- `CursorTracker` follows mouse position.
- Ring size/color adjusts on interactive elements.
- Disabled for reduced-motion / coarse pointer environments.

---

## 6) Operational Notes

- Backend is currently not connected to a persistent database.
- If permanent storage is required, replace `InMemoryStore` with DB-backed repository methods.
- API contracts in `schemas.py` should be kept stable when integrating a DB.

---

## 7) Future Improvements

- Add real database (PostgreSQL + SQLAlchemy/Alembic).
- Add authentication and user-specific product ownership.
- Add geocoding API for free-text city input.
- Add background jobs for analytics precomputation.
- Add test suites for API routes and scoring logic.

