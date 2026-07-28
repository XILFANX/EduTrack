# Multi-Tenancy & Security

Security in EduTrack operates identically to EstateTrack, using PostgreSQL Row-Level Security (RLS) as the absolute source of truth.

---

## 1. RLS (Database Layer)

All tenant tables contain a `school_id` column.

We rely on two secure PostgreSQL functions to evaluate the current context:

```sql
create or replace function public.get_auth_school_id() returns uuid as $$
  select school_id from public.users where id = auth.uid();
$$ language sql security definer;

create or replace function public.get_auth_role() returns text as $$
  select role from public.users where id = auth.uid();
$$ language sql security definer;
```

### The Parent Isolation Pattern

Parents must never see data for students that are not theirs. This is enforced via the `student_parents` join table:

```sql
create policy "Parents can view their own children"
  on public.students for select
  using (
    id in (
      select student_id from public.student_parents where parent_id = auth.uid()
    )
  );
```

Because of this policy, querying `supabase.from('students').select('*')` as a parent will securely return *only* their children. No application-level filtering is required or recommended.

---

## 2. Middleware Route Guard (Edge Layer)

**File:** `apps/web/middleware.ts`

To prevent a parent from navigating to `/bursar/dashboard` or a teacher from opening `/admin/dashboard`, the middleware intercepts every request.

The `isAllowedForRole()` function acts as the gatekeeper:

```typescript
function isAllowedForRole(role: string, pathname: string): boolean {
  if (pathname.startsWith('/admin') && role !== 'admin') return false
  if (pathname.startsWith('/teacher') && role !== 'class_teacher' && role !== 'subject_teacher') return false
  if (pathname.startsWith('/bursar') && role !== 'bursar') return false
  // ...
  return true
}
```

---

## 3. The `admin` Role Trap

Unlike standard users, the `admin` (Platform Owner) does **not** have a `school_id` because they manage the SaaS platform as a whole.

When writing RLS policies, if an `admin` needs to read data, you must explicitly allow them via the role function, otherwise they will be locked out of tenant tables:

```sql
create policy "Admins can view all invoices"
  on public.invoices for select
  using (public.get_auth_role() = 'admin');
```

---

## Security Checklist for Developers

1. **Adding a table?** Add `school_id`, enable RLS, and write policies using `get_auth_school_id()`.
2. **Server-side query?** Use `createClient()` (validates RLS). Do NOT use `createAdminClient()` (bypasses RLS) unless in a secure webhook or cron job.
3. **Data mutation?** Never trust a client-provided `school_id`. Let RLS enforce it via a `WITH CHECK (school_id = get_auth_school_id())` policy.

[Link: /admin/dashboard]
