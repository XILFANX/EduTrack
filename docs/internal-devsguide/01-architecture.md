# Architecture

## The Big Picture
EduTrack is built as a scalable monorepo. The core application logic is served by Next.js, while data persistence, real-time subscriptions, and security rules are handled by Supabase.

### Module Dependency Graph
```mermaid
graph TD
    A[Next.js Frontend apps/web] --> B[Supabase Backend]
    
    subgraph Frontend Portals
    P1[Admin Portal]
    P2[Principal Dashboard]
    P3[Teacher Portal]
    P4[Bursar Portal]
    P5[Parent Portal]
    end
    
    P1 --> A
    P2 --> A
    P3 --> A
    P4 --> A
    P5 --> A
    
    subgraph Supabase Backend
    DB[(PostgreSQL)]
    RLS{Row Level Security}
    Auth[Supabase Auth]
    Edge[Edge Functions]
    end
    
    B --> Auth
    B --> RLS
    RLS --> DB
    B --> Edge
```

## Repository Structure
- `apps/web/`: The Next.js 16 (App Router) application serving all portals.
- `backend/supabase/`: Database schemas, migrations (`production_migration.sql`), and Edge Functions.
- `docs/`: The documentation you are currently reading.

> **Note:** The PRD mentions an `apps/mobile/` Expo app for parents, but this has not yet been built. The Next.js web application is currently fully responsive and serves mobile users.

## Core Request Flow: Auth & Routing
```mermaid
sequenceDiagram
    participant User
    participant Middleware (apps/web/middleware.ts)
    participant Next.js (Server)
    participant Supabase

    User->>Middleware: GET /teacher/dashboard
    Middleware->>Supabase: check session cookie
    Supabase-->>Middleware: returns { user, profile: { role: 'class_teacher' } }
    Middleware->>Middleware: isAllowedForRole('class_teacher', '/teacher/dashboard')
    Middleware-->>Next.js: Proxy request to route
    Next.js-->>User: Render Dashboard
```

## Where State Lives
- **Primary Data:** Supabase PostgreSQL (handles users, schools, invoices, attendance, exams).
- **Session State:** Secure HTTP-only cookies (`sb-access-token`, `sb-refresh-token`).
- **Files/Media:** (Planned) Supabase Storage for profile pictures and PDF report cards.
