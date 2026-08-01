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
