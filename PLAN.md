# PLAN.md

## Task 1: Fix EduTrack Invite Link
- **What exists today:** `apps/web/app/invite/[token]/page.tsx` (InvitePage function)
- **What changes:** Remove `schools ( name )` join from the Supabase query to prevent foreign key relation errors. Fetch the school name in a separate query using the `school_id` from the invite.
- **Docs affected:** none: bug fix
- **Tier 1 gate:** `npm run build`

## Task 2: Global Color Sweep
- **What exists today:** Hundreds of hardcoded `blue` classes in EduTrack, and `blue/indigo` in EstateTrack.
- **What changes:** Run a Node.js script to replace `blue-*` with `cyan-*` in EduTrack, and `blue/indigo` with `fuchsia/purple` in EstateTrack across `apps/web/app` and `apps/web/components`.
- **Docs affected:** none: styling update
- **Tier 1 gate:** `npm run build`

## Task 3: Global CSS Updates
- **What exists today:** `apps/web/app/globals.css` with legacy `--primary` and `--ring`.
- **What changes:** Update `--primary` and `--ring` to Cyan (EduTrack) and Fuchsia (EstateTrack).
- **Docs affected:** none: styling update
- **Tier 1 gate:** `npm run build`

## Task 4: Bold UI Enforcement (Navigations)
- **What exists today:** `*-nav.tsx` components in both repos using subtle styling (`w-12 h-12`, `bg-muted`, `font-semibold text-[10px]`).
- **What changes:** Redesign these to match the Quick Access styling: gradient squircles (`rounded-[1.25rem]`, `w-14 h-14`), bold labels (`font-bold text-sm`), solid icons (`w-6 h-6` with thick strokes), heavy shadows, and hover transitions. 
- **Docs affected:** none: styling update
- **Tier 1 gate:** `npm run build`
