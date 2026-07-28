# Auth & Middleware Module

**What it does:** Enforces portal isolation across the 9-tier role architecture.

**Why it exists:** With 9 distinct roles (Admin, Principal, Teachers, Bursar, Librarian, Storekeeper, Transport, Parent), a centralized edge guard is critical. `middleware.ts` intercepts all requests, parses the role, and redirects users if they attempt to access an unauthorized route.

---

## The `isAllowedForRole` Function

This is the core security loop inside `apps/web/middleware.ts`.

```typescript
function isAllowedForRole(role: string, pathname: string): boolean {
  if (pathname.startsWith('/admin') && role !== 'admin') return false;
  if (pathname.startsWith('/dashboard') && role !== 'principal' && role !== 'headteacher') return false;
  
  if (pathname.startsWith('/teacher')) {
      if (role !== 'class_teacher' && role !== 'subject_teacher') return false;
  }
  
  if (pathname.startsWith('/bursar') && role !== 'bursar') return false;
  if (pathname.startsWith('/parent') && role !== 'parent') return false;
  if (pathname.startsWith('/library') && role !== 'librarian') return false;
  if (pathname.startsWith('/store') && role !== 'storekeeper') return false;
  if (pathname.startsWith('/transport') && role !== 'transport_matron') return false;

  return true;
}
```

If this check fails, the user is redirected to `roleHome(role)`, returning them to their canonical portal.

---

## Session Refresh

Like EstateTrack, the middleware executes `updateSession()` on every request via `@supabase/ssr`. This reads the HTTP-only cookie, extends its lifespan, and queries the `users` table for the current `role` and `school_id`.

**Performance Note:** Do not expand the `select('role, school_id')` query to include extraneous user data, as this query runs on every page load and will impact global TTFB (Time To First Byte).
