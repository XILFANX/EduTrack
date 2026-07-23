# Module: Admin Portal

## Purpose
The Admin Portal is the global oversight interface used strictly by `platform_owner` (admin) accounts to manage the SaaS infrastructure, school subscriptions, and global billing.

## Public Interface
- **Access Route:** `/admin/*`
- **Role Requirement:** `admin` (enforced via Edge Middleware)

## Implementation Notes
- **Middleware Override:** Because the root administrator operates outside the bounds of a specific school, the middleware (`apps/web/middleware.ts`) applies an override. If the logging-in user's email matches `process.env.PRODUCT_ADMINISTRATOR_EMAIL`, they are forcefully assigned the `admin` role, bypassing standard RLS checks for school tenants.

## Dependencies
- Calls: Supabase Admin API (bypassing RLS) to view all tenants in `public.schools`.

## Known Limitations / TODOs
- The admin dashboard currently lacks granular billing analytics for SaaS subscription renewals.
