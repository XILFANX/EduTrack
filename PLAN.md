# PLAN: UI Consistency Enforcement

## Context summary
The user requested tight UI consistency across all portals. EduTrack must strictly use its primary `blue` palette. All other strange decorative colors (like cyan, teal, rose, emerald, fuchsia, pink, violet, indigo, sky) will be removed or replaced with `blue`. Alert/destructive colors (green, red, yellow) will be replaced with `orange` (as requested: "exempt the alert colors like the orange...").

## Milestone 1: Standardize UI Colors to Blue and Orange

### Task 1.1: Replace decorative colors with blue
**Type:** Fix existing
**What exists today:** Various components use cyan, teal, indigo, sky, emerald, fuchsia, pink, rose, violet for backgrounds, text, and borders.
**Work:** Find and replace all tailwind color classes using these decorative colors with equivalent `blue` classes.
**Tier 1 gate:** build + lint + relevant tests
**Commit:** 1.1: enforce blue theme across EduTrack UI
**Docs affected:** none: Pure UI color consistency change.

### Task 1.2: Standardize alert colors to orange
**Type:** Fix existing
**What exists today:** Alerts, statuses, and destructive buttons use red, green, yellow, amber.
**Work:** Find and replace red, green, yellow, amber tailwind classes with equivalent `orange` classes for alerts and confirmations.
**Tier 1 gate:** build + lint + relevant tests
**Commit:** 1.2: standardize alert colors to orange in EduTrack
**Docs affected:** none: Pure UI color consistency change.

## Milestone 2: UI Consistency, Navigation, and Robust Parsing (v4.1)

### Task 2.1: Robust Parsing Engine (§7.0)
**Type:** Feature/Refactor
**What exists today:** Client-side parsing uses basic regex that misses identities and is prone to errors.
**Work:** Extract a shared `payment-parser.ts` implementing full §7.0 rules (detect identity, exact amount, channel, timestamp fallback) and wire it into `verify-client.tsx` and `post-subscription-payment.tsx`.
**Tier 1 gate:** build
**Commit:** pending
**Docs affected:** none

### Task 2.2: Subscription Pages & Missing Links
**Type:** Fix existing
**What exists today:** `/bursar/billing` doesn't exist in EduTrack. Landlord `/billing` dead-ends.
**Work:** Create EduTrack Bursar billing page based on EstateTrack. Ensure form is accessible.
**Tier 1 gate:** build + UI check
**Commit:** pending
**Docs affected:** none

### Task 2.3: Dashboard Quick Actions & Naming Conventions
**Type:** Refactor
**What exists today:** Duplicate quick action grids; inconsistent terms like "Record Payment" instead of "Verify Payments".
**Work:** Consolidate Quick Actions. Enforce strict `blue` theme for EduTrack. Rename "Record Payment" to "Verify Payments" (for payee) and "Post Payment" (for payer). Fix Parent Portal to allow "Post Payment" even when balance is 0.
**Tier 1 gate:** build
**Commit:** pending
**Docs affected:** none
