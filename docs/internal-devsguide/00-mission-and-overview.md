# Mission & Overview

EduTrack is a unified school management system designed to eliminate the friction of fragmented WhatsApp groups, paper report cards, and manual fee ledgers. It connects Administrators, Teaching Staff, and Parents within a single digital ecosystem.

**Skimmable in 2 minutes.** This page covers the 4 decisions that shape every architectural choice in the codebase.

---

## 4 Decisions That Shape Everything

### 1. Unified Next.js Monorepo — Edge Middleware Guard

The entire product—serving 9 distinct roles—is served from a single Next.js App Router codebase in `apps/web/`. There are no microservices or decoupled APIs. A single edge-level middleware (`apps/web/middleware.ts`) intercepts every request and explicitly enforces route boundaries based on the user's role.

### 2. Multi-Tenancy via Postgres Row-Level Security (RLS)

EduTrack uses a **shared-schema multi-tenant model**. All schools share the same tables. Tenant isolation is strictly enforced at the PostgreSQL layer via Supabase RLS policies utilizing the `school_id` column.

The application layer cannot bypass this isolation. It is physically impossible for a Principal at School A to query data from School B, even if a developer forgets to include a `WHERE` clause in a route handler.

### 3. Unified Users Table (No Separate Parent/Teacher Tables)

Instead of scattering human actors across separate `parents`, `teachers`, and `principals` tables, everyone authenticates and exists in `public.users` with a `role` enum. Access to specific students is handled via a many-to-many junction table (`student_parents`).

**Why:** It vastly simplifies authentication, session management, and middleware role-checks.

### 4. Decentralized Onboarding via Token Invites

To prevent a massive administrative bottleneck at the start of a term, onboarding is distributed.
1. The Principal generates invite links for Teachers.
2. Class Teachers generate invite links for Parents.

When clicked, the token bypasses complex registration. The user sets a password and is immediately linked to their correct role and students.

---

## The 9-Tier Role Architecture

Every authenticated user maps to one of these roles in `public.users.role`.

| Role | Access Scope | Description |
|---|---|---|
| `admin` | Global (`/admin`) | Platform owner. Manages school SaaS subscriptions. |
| `principal` / `headteacher` | Single School (`/dashboard`) | Full oversight of students, classes, and finances. |
| `class_teacher` | Specific Class (`/teacher`) | Manages attendance and parent onboarding. |
| `subject_teacher` | Specific Subject (`/teacher`) | Can enter grades only for assigned subjects. |
| `bursar` | Financials (`/bursar`) | Manages fee structures and generates invoices. |
| `librarian` | Inventory (`/library`) | Manages library books and tracks fines. |
| `storekeeper` | Inventory (`/store`) | Manages kitchen/stationery ledgers. |
| `transport_matron` | Logistics (`/transport`) | Manages bus routes and pickup rosters. |
| `parent` | Read-only (`/parent`) | Views linked children's grades and pays fees. |

> **Note:** The `admin` role is typically assigned to the `PRODUCT_ADMINISTRATOR_EMAIL` configured in the environment variables and bypassed via the `/api/admin/bootstrap` script.

[Link: /admin/dashboard]
