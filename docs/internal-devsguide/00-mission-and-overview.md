# Mission & Overview

## What is EduTrack?
EduTrack is a premium, automated SaaS platform serving as the digital infrastructure for modern schools. It eliminates fragmented tools (like WhatsApp groups, manual fee ledgers, and paper reports) in favor of a centralized system connecting administrators, teaching staff, and parents.

## Who is it for?
EduTrack supports a 9-tier role architecture spanning the entire educational ecosystem:
1. **Admin (Platform Owner):** Manages school subscriptions across the SaaS platform.
2. **Principal / Headteacher:** Has grand overview and control over a single school (the tenant).
3. **Class Teacher:** Manages specific classes, attendance, and parent onboarding.
4. **Subject Teacher:** Manages grades for specific subjects.
5. **Bursar:** Manages fee structures, invoicing, and M-Pesa payments.
6. **Librarian:** Manages books and library inventory.
7. **Storekeeper:** Manages kitchen and stationery inventory.
8. **Transport Matron:** Manages bus routes and student transit.
9. **Parent:** Read-only portal for tracking child performance, attendance, and paying fees.

## The 3 Key Architectural Decisions

1. **Multi-Tenant via Row-Level Security (RLS)**
   Rather than managing separate databases or schemas for each school, all schools share the same tables. Tenant isolation is strictly enforced at the database layer via Supabase RLS using the `school_id` column.

2. **Unified Users Table with Enum Roles**
   Instead of scattering users across a `parents` table, a `teachers` table, and a `principals` table, all human actors are stored in `public.users` with a `role` enum. This drastically simplifies authentication and the middleware routing logic.

3. **Delegated Onboarding via Token Invites**
   To prevent administrative bottlenecks at the start of a term, onboarding is decentralized. Principals invite Teachers, and Class Teachers invite Parents using secure token links. When a token is clicked, the invitee bypasses complex registration flows.
