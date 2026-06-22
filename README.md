# ATELIER — Premium Fashion E-Commerce Platform

ATELIER is a state-of-the-art, editorial-focused e-commerce storefront and admin panel built for a luxury footwear and ready-to-wear fashion brand. The platform features minimal aesthetic layouts, fluid micro-animations, fully responsive views, dynamic URL query filtering, persistent shopping cart/wishlist management, and secure mock Stripe Elements payment flows.

---

## Tech Stack Overview

- **Frontend & Routing:** TanStack Start (Vite-based Next-like modern SSR framework, React 19)
- **Database & Auth:** Supabase (PostgreSQL, Row Level Security, RPC functions, Supabase Auth)
- **State Management:** Zustand + LocalStorage (Cart & Wishlist persistence)
- **Styling:** Tailwind CSS + custom HSL design system + Lucide Icons + Framer Motion
- **Payments:** Stripe Elements mock checkout integration
- **Forms & Validation:** React Hook Form + Zod input schemas

---

## Project Structure

```
/src
  /assets         → Brand assets, high-res images
  /components
    /ui           → shadcn/ui primitives
    /store        → Customer-facing storefront components (ShopGrid, Header, CartDrawer, etc.)
    /admin        → Admin dashboard layout & forms
  /hooks          → React Hooks (useAuth for user/role fetching)
  /integrations   → Supabase clients, middleware, types
  /lib            → Core utility functions, orders/products/categories/reviews CRUD functions
  /routes         → Route handlers (storefront, authenticated dashboard /admin/*)
  /store          → Zustand state stores (cart, wishlist, ui)
/supabase
  /migrations     → PostgreSQL database migrations (schema, triggers, functions, indexes)
  seed.sql        → Base database seed file for local or production SQL editor
/scripts
  seed.ts         → CLI TypeScript database seed script
```

---

## Setup & Local Installation

### 1. Prerequisites
Ensure you have [Bun](https://bun.sh) (recommended) or Node.js (v18+) installed.

### 2. Install Dependencies
```bash
bun install
# or npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory (based on `.env.example`):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUz...
VITE_SUPABASE_PROJECT_ID=your-project-id

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUz...
SUPABASE_PROJECT_ID=your-project-id
```

### 4. Database Setup & Seeding
Deploy migrations to your Supabase project. You have two options to seed the database:

#### Option A: Supabase SQL Editor (Recommended)
Copy the contents of `supabase/seed.sql` and paste them into a new query run inside the **SQL Editor** tab of the Supabase dashboard.

#### Option B: CLI Seeding Command
Ensure your `.env` contains the required keys (use your `SUPABASE_SERVICE_ROLE_KEY` if you want to seed with RLS bypassed) and execute:
```bash
bun run db:seed
```

---

## Running Development Server

Start the local development server:
```bash
bun run dev
# or npm run dev
```

The application will run locally at [http://localhost:3000](http://localhost:3000) (or the port specified by Vite dev console).

---

## Key Features Built & Configured

### Storefront Features
- **Editorial Hero Section:** Homepage contains generous whitespace, high-resolution lifestyle images, brand values sections, and interactive custom grids.
- **Advanced Filtering Grid:** The `/shop` subroutes map category, search query, sizing, color swatches, and price ranges to URL search parameters for absolute shareability.
- **Product Gallery Zoom:** Custom mouse coordinates calculate micro-adjustments for smooth zoom-on-hover card presentation.
- **Reviews & Size Guide:** Authenticated users can write star reviews. Footwear/apparel maps render sizes inside a custom modal.
- **Zustand Cart & Wishlist Drawer:** Full persistent side drawer checkout sync with instant updates.

### Admin Dashboard (`/admin/*`)
- **KPI Summary Overview:** Real-time revenue charts (via Recharts Area diagrams), total customer spend tallies, and active orders dashboard.
- **Visual Category Tree:** Admin categories view maps parent categories to infinite children levels in indented trees.
- **Advanced Products Catalog Table:** Multi-selection row controls, bulk deletion/status toggle, product cloning, and paginated searches.
- **Order Management:** View delivery details, edit state statuses (Pending, Shipped, Delivered, Cancelled) via secure context modifiers.
