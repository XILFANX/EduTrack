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
| **Scope** | `npm run build` + lint + tests touching changed files | Full build + full lint + full test suite + doc re-sync |
| **On fail** | Fix and re-run. Task stays uncommitted and undocumented. | Fix as tagged commit (e.g. `1.3-fix`). Reopen the task line. Re-run Tier 2 in full. |

**Tier 1 — extra checks per task type:**
- **External input / auth / tenant boundary** — validate input; no secrets hardcoded or logged; confirm Tenant A cannot read Tenant B's data.
- **Schema migration** — confirm it is reversible; run against realistic data shape, not an empty dev DB.
- **API shape change** — something must catch the contract break before a dependent service breaks in production.

**Tier 2 — what "doc re-sync" means:**
Every "Docs affected" path across the whole plan still matches current behavior. A fix made during Tier 2 can invalidate a doc that was already correct at Tier 1 — re-check all of them, not just the tasks that changed.

---

## Documentation Bootstrap

Runs once per doc set when `docs/internal-devsguide/` and/or `docs/public-userguide/` don't exist. Treat as Milestone 1 of a normal `PLAN.md`/`TASKS.md`.

1. **Discovery** — read any PRD/spec plus actual code; map modules, repo structure, dependency graph, APIs, data model, auth/tenant mechanism, config/env. Flag anything inferred rather than read directly.
2. **Outline** — propose headings-only outlines for both doc sets using the Documentation Map as the file list. Get user sign-off before writing content — this is a separate gate from PLAN.md approval.
3. **Populate, staged** — write `00-mission-and-overview.md` and `00-getting-started.md` first; pause and show the user before continuing. Catches wrong tone or depth early. Files under `04-legal-and-policies/` get factual inventory only + `DRAFT — requires legal review` marker.
4. **Self-review** — Diátaxis boundaries hold per page; every internal "best practice" claim cites a real file reference; no user-guide page leaks jargon or internal names; every page is linked from its set's index.
5. **Wire in** — add `CONTRIBUTING-TO-DOCS.md` to both doc roots pointing back to this file's Documentation Map, so future missions maintain instead of re-bootstrapping.

---

## Handling Drift

Plans and docs are written on the best context available at the time — both are allowed to be wrong. When implementation contradicts `PLAN.md` or an existing doc:

1. Stop. Fix the source of truth before continuing — update `PLAN.md` and add a doc-correction task to this plan.
2. If drift is large enough to be its own mission (e.g. a whole architecture doc out of date), propose it as a separate follow-up rather than silently expanding scope.

**When Tier 2 fails** (same procedure):
1. Fix the code.
2. Re-run Tier 2 in full until all four checks are clean.
3. Land the fix as its own commit tagged to the originating task ID — e.g. `1.3-fix: correct null-handling exposed by integration gate`. Never amend or rebase the original; the fix-commit is the traceable evidence that Tier 2 did its job.
4. Reopen that task's TASKS.md line; re-check it only after the fix's Tier 1 pass is clean and any newly invalidated doc is corrected in the same commit.

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
| Harness rules, agent workflow, or verification tier change | `docs/internal-devsguide/10-agent-harness.md` |

The "Docs affected" field in every task cites a row from this table or `none: <reason>`. Never blank.

---

## Conventions (hold on every doc edit)

- **Internal docs:** every "best practice" claim carries a real file reference (path + line range).
- **User-guide:** max 4 sentences per paragraph. Numbered steps over prose for sequences. One concept per page. `> Note:` / `> Warning:` for risky or irreversible actions. Screenshots: `[SCREENSHOT: <route> — <what it shows>]`.
- **Diátaxis:** reference pages don't grow tutorial prose. How-to pages don't explain internals.
- **Legal pages** (`04-legal-and-policies/`) require a `DRAFT — requires legal review` marker on every agent-authored edit.

---

## History Log

<!-- One line per shipped session. Newest on top. Cap: 10 rows — drop oldest when adding the 11th. -->

| Date | Mission | Outcome |
|---|---|---|
| 2026-08-08 | Full UI re-theme — electric blue/cyan gradient, navy dark mode, danger red, title-case navs, new logos as PWA icons | Shipped `bb55d3b` |
| 2026-08-06 | Harness upgrade — merged Anthropic-style protocol into binary gates; added Verification Tiers, Bootstrap, Drift, Sync-to-remote; History Log capped at 10 rows | Shipped |
| 2026-08-06 | UI Design System Canonicalization — cyan-blue hero all EduTrack portals, orange alerts, max-3 lists | Shipped `22c1213` |
| 2026-08-06 | Agent Harness Rewrite — Binary gates, MISSION.md scratchpad, slimmed CONTEXT.md | Shipped |
| 2026-08-04 | EduTrack Core Modules Rewrite (Timetable, Exams, Fees, Analytics) | Shipped `246b8c2` |
| 2026-08-04 | EduTrack Portals UI Refinement — blue hero all subportals, Quick Actions, 3-item truncation | Shipped |
| 2026-08-04 | Removed rigid 'no tools' restriction from fast-path workflow, allowing minimal tool usage. | Shipped `3a5796c` |
| 2026-08-06 | Updated harness logic to reflect the new agent workflow (gates, tier 1/2, and history log limit). | Shipped `64b35f7` |
| 2026-08-06 | Fix invite links and sweep legacy blue themes codebase-wide, applying bold Quick Access navigation styling. | Shipped `62b2736` |
| 2026-08-02 | Payment UX v5, Engine Flows, Nav Fixes, Subscription Gating | Shipped |
