# Multi-Tenancy & Security

Security and tenant isolation in EduTrack are handled via a robust, multi-layered approach. **Do not bypass these mechanisms.**

## 1. Row-Level Security (RLS) - The Data Layer
The database is the ultimate source of truth for isolation. We use a shared-schema multi-tenant model. 

Every tenant-owned table has a `school_id` column.
Tenant isolation is enforced via Supabase RLS.

**Key Helper Functions:**
```sql
create or replace function public.get_auth_school_id() returns uuid as $$
  select school_id from public.users where id = auth.uid();
$$ language sql security definer;

create or replace function public.get_auth_role() returns public.user_role as $$
  select role from public.users where id = auth.uid();
$$ language sql security definer;
```

**Example Isolation Policy:**
```sql
create policy "Users can view classes in their school"
  on public.classes for select
  using (school_id = public.get_auth_school_id());
```

**Role-Based Isolation:**
Parents are strictly prevented from viewing all students. They can only view students linked to them in the `student_parents` table:
```sql
create policy "Parents can view their own children"
  on public.students for select
  using (
    id in (
      select student_id from public.student_parents where parent_id = auth.uid()
    )
  );
```

## 2. Middleware Routing Guard - The Edge Layer
To prevent a Parent from accessing the Bursar's dashboard, or a Teacher from accessing the Principal's settings, `apps/web/middleware.ts` acts as an Edge guard.

The `isAllowedForRole(role, pathname)` function intercepts every request:
- `/admin/*` requires `admin`
- `/teacher/*` requires `class_teacher` or `subject_teacher`
- `/bursar/*` requires `bursar`
- `/parent/*` requires `parent`

If a user navigates to a portal they don't own, they are instantly redirected to their designated `roleHome()`.

## Best Practices for Developers
1. **Never write raw SQL queries bypassing RLS:** Always use the authenticated Supabase client (`createClient()`) so that Postgres executes the query in the context of the user's `auth.uid()`.
2. **Never expose `school_id` as an editable form field:** The `school_id` should always be derived server-side from the authenticated user's profile to prevent tenant-hopping attacks.
