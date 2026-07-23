# ADR: Single Users Table vs. Role-Specific Tables

> reconstructed retroactively from code, confidence: high

## Context
EduTrack has 9 distinct user roles (Admin, Principal, Class Teacher, Subject Teacher, Bursar, Librarian, Storekeeper, Transport Matron, Parent). We needed to decide whether to create separate tables for each entity (e.g. a `parents` table, a `teachers` table) or consolidate them.

## Decision
We chose to consolidate all human actors into a single `public.users` table, utilizing a `role` enum (`user_role`) to distinguish them.

## Consequences
- **Authentication Simplicity:** The Supabase Auth `auth.users` table only needs to map to a single `public.users` table, greatly simplifying triggers and RLS policies.
- **Middleware Routing:** The `apps/web/middleware.ts` can fetch a single `profile` object and instantly know the user's role to direct them to the correct dashboard (`roleHome()`).
- **Data Sparse-ness:** Some columns might be irrelevant to certain roles (e.g., a parent doesn't strictly need an employee ID, though we don't currently have one). This is an acceptable tradeoff for the sheer simplicity of single-table auth lookups.
