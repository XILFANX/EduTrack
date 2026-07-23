# Module: Principal Dashboard

## Purpose
The central command center for a specific school. The Principal (Headteacher) uses this module to manage the structural hierarchy of the school (classes, subjects) and onboard staff.

## Public Interface
- **Access Route:** `/dashboard`, `/staff`, `/classes`, `/students`, `/subjects`, `/finance`, `/reports`, `/settings`
- **Role Requirement:** `principal` or `headteacher`

## Implementation Notes
- **Onboarding Flow:** Principals are unique in that they must complete a "School Setup" onboarding flow (`/onboarding`) before they can access their dashboard. The middleware enforces this by checking `!profile?.school_id`.
- **Delegated Invites:** Principals have the authority to write to `public.invitations` to generate secure token links for onboarding Teachers, Bursars, and Ancillary staff.

## Best Practices
- **Input Validation:** When inserting new `users` or `classes`, RLS ensures that the `school_id` is derived from `public.get_auth_school_id()` and cannot be spoofed.

## Dependencies
- Writes to: `public.users`, `public.classes`, `public.subjects`, `public.invitations`
- Reads from: All tenant-scoped tables for school-wide analytics.
