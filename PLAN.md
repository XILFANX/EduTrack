# PLAN

## Task 1: Fix EduTrack Invite Link Issue
- **What exists today**: `apps/web/app/invite/[token]/page.tsx` uses `.single()` which throws an error if 0 rows are found or if the Supabase SDK encounters an issue with complex joins over RLS. It also has an `isReturningUser` check that uses `listUsers()` without pagination.
- **What changes**: Update `page.tsx` to use `.maybeSingle()`, maintain the `schools(name)` join since it's valid for this DB, and use `admin.auth.admin.getUserById` after getting the user ID from the `users` table instead of relying on `listUsers()`.
- **Docs affected**: none: Bug fix only.
- **Tier 1 gate**: `npm run build`

## Task 2: Fix Navigation Bar Overflow
- **What exists today**: Multiple nav files (e.g. `components/bursar/bursar-nav.tsx`) have `w-6 h-6 stroke-[2.5]` icons and `text-[10px]` text in the bottom bar, which overflows on mobile when there are many items.
- **What changes**: Run a script across all `-nav.tsx` files to reduce bottom tab icons to `w-5 h-5 stroke-[2.5]`, reduce text to `text-[9px] tracking-tight`, ensure `flex-1 min-w-0 px-1` on the link wrapper, and slightly widen the container `max-w-[min(calc(100vw-2rem),32rem)]`.
- **Docs affected**: none: Styling only.
- **Tier 1 gate**: `npm run build`

## Task 3: Replace EduTrack Logo
- **What exists today**: `apps/web/public/logo.png` and assorted icon sizes are using the old logo.
- **What changes**: Create a Node.js script to take the newly provided logo and resize it to replace `logo.png`, Apple touch icons, and all PWA `icon-*.png` sizes.
- **Docs affected**: none: Asset update.
- **Tier 1 gate**: `npm run build`
