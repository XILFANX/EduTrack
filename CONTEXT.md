# CONTEXT.md — EduTrack Agent Library
# Read on demand by the harness. Not loaded wholesale into every turn.
# Harness entry point: `.agents/AGENTS.md`

---

## Mission Template

The harness creates `MISSION.md` at repo root at turn 0. Template:

```
# MISSION.md — Active Session

REQUEST:
<verbatim user prompt — never paraphrased>

UNDERSTOOD:
<agent's one-sentence restatement — if this differs from REQUEST, stop and re-read>

STAGE: UNDERSTAND | PLAN | EXECUTE | VERIFY | DONE

TASKS:
- [ ] <id> <name> — tier1: pending — commit: — docs:
```

`MISSION.md` is `.gitignore`d (local-only). The agent clears it on mission close.

---

## Verification Tiers

| | Tier 1 — Per-task | Tier 2 — Mission gate |
|---|---|---|
| **When** | After implementing each task, before its docs or commit | Once, after every task is checked off |
| **Scope** | `tsc --noEmit` + build + tests touching changed files | Full build + full lint + full test suite + doc re-sync |
| **On fail** | Fix and re-run. Task stays uncommitted and undocumented. | Fix as tagged commit (e.g. `1.3-fix`). Reopen the task line. Re-run Tier 2. |

---

## Documentation Map

Two doc roots. Never blend them. Never leak internal names into user-guide.

- `docs/internal-devsguide/` — developers/maintainers
- `docs/public-userguide/` — end users, no jargon

| Change type | Update this doc |
|---|---|
| Project purpose or core architecture changes | `docs/internal-devsguide/00-mission-and-overview.md` |
| New/changed API endpoint or response shape | `docs/internal-devsguide/03-api-reference.md` |
| New module or changed module responsibility | `docs/internal-devsguide/02-modules/<module-name>.md` |
| Data flow, service dependency, repo structure change | `docs/internal-devsguide/01-architecture.md` |
| Schema change, new table, changed relationship, new migration | `docs/internal-devsguide/04-data-model.md` |
| Auth, permissions, tenant scoping, session handling | `docs/internal-devsguide/05-multi-tenancy-and-security.md` |
| Design decision made, reversed, or superseded | New ADR in `docs/internal-devsguide/06-decisions/` |
| Known bug or tech debt knowingly left in place | `docs/internal-devsguide/07-known-issues-and-tech-debt.md` |
| New setup step, env var, local-dev requirement | `docs/internal-devsguide/08-onboarding.md` |
| New domain term or internal name | `docs/internal-devsguide/09-glossary.md` |
| New or changed user-facing feature or workflow | `docs/public-userguide/<feature-name>.md` |
| First-run, signup, or onboarding flow change | `docs/public-userguide/00-getting-started.md` |
| New common user failure mode | `docs/public-userguide/02-faq-and-troubleshooting.md` |
| Billing or account behavior change | `docs/public-userguide/03-account-and-billing.md` |
| Data collected, cookies, or third-party data change | `docs/public-userguide/04-legal-and-policies/` — flag for legal review |

The "Docs affected" field in every task cites a row from this table or `none: <reason>`. Never blank.

---

## Conventions (hold on every doc edit)

- **Internal docs:** every "best practice" claim carries a real file reference (path + line range).
- **User-guide:** max 4 sentences per paragraph. Numbered steps over prose for sequences. One concept per page. `> Note:` / `> Warning:` for risky or irreversible actions. Screenshots: `[SCREENSHOT: <route> — <what it shows>]`.
- **Diátaxis:** reference pages don't grow tutorial prose. How-to pages don't explain internals.
- **Legal pages** (`04-legal-and-policies/`) require a `DRAFT — requires legal review` marker on every agent-authored edit.

---

## History Log

| Date | Mission | Outcome |
|---|---|---|
| 2026-08-06 | Agent Harness Rewrite — Binary AGENTS.md gates, MISSION.md session scratchpad, slimmed CONTEXT.md, applied to EduTrack + EstateTrack | Shipped |
| 2026-08-04 | EduTrack Core Modules Rewrite (Timetable, Exams, Fees, Analytics) — school-wide timetable grid, 3-stage exam grading workflow, fee templates/bulk invoicing, financial analytics dashboard | Shipped `246b8c2` |
| 2026-08-04 | EduTrack Portals UI Refinement — blue hero across all subportals, Quick Actions grids, 3-item list truncation | Shipped |
| 2026-08-04 | UI Refinement: Minimalist Dashboards — minimalist profile cards, removed duplicate buttons, 3-item list truncation, bg-card themes | Shipped `2c3ed64` |
| 2026-08-04 | Tenant & Caretaker Portals Redesign — premium purple theme, floating nav, quick action grids | Shipped `6569c80` |
| 2026-08-02 | Payment UX v5, Engine Flows, Nav Fixes, Subscription Gating | Shipped |
| 2026-08-02 | UI Consistency, Navigation Overlaps, Robust Parsing Enforcement | Shipped `abaa99a` |
| 2026-08-01 | Payment Parsing & UI Consistency — rebuilt M-Pesa/Bank parser, portal nav fixes | Shipped |
| 2026-08-01 | Payment Settlement Reconciliation Engine (v4) | Shipped `3a9402a` |
| 2026-07-31 | Payment Settlement Reconciliation Engine — full replacement (two-witness model) | Shipped `195ac59` |
