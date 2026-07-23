# CONTEXT.md — Agent Operating Protocol

> This is a context protocol for AI coding agents. It defines one consistent path from request → verified, documented, shipped code: understand the request, gather real context, plan, execute, verify, document, and sync with the remote repository.

## Table of Contents

- [Request](#request)
- [Step 0 — Fast Path](#step-0--fast-path)
- [Step 1 — Request Understanding](#step-1--request-understanding)
- [Step 2 — Context Building](#step-2--context-building)
- [Step 3 — Implementation Plan → PLAN.md](#step-3--implementation-plan--planmd)
- [Step 4 — Task Checklist → TASKS.md](#step-4--task-checklist--tasksmd)
- [Step 5 — Walkthrough](#step-5--walkthrough)
- [Operating Rules](#operating-rules)
- [Documentation Bootstrap](#documentation-bootstrap)
- [Documentation Map](#documentation-map)
- [Conventions](#conventions)
- [History Log](#history-log)

---

## Request

> This is the user request. It is the only input this file expects — everything below is protocol, not conversation.

```
REQUEST

<paste the request here>
```

---

## Step 0 — Fast Path

Not every request earns the full protocol. If a change is confined to a single file, low-risk, and verifiable in one build/test cycle — a typo, a log line, a config value, an obvious one-line bug fix — skip `PLAN.md` and `TASKS.md` entirely:

1. State in one sentence what you're about to do.
2. Make the change.
3. Run the [Verification gate](#step-3--implementation-plan--planmd) from Step 3.
4. Report back in chat.

> **Note:** Even on the fast path, fix any doc line the change makes wrong (a documented default, endpoint behavior, or setup step) in the same pass — a fix that leaves a doc wrong behind it isn't actually low-risk. If nothing documented is affected, just proceed.

Anything touching more than one file, carrying a design decision, or that you're not confident is low-risk goes through Steps 1–5 in full. Initializing or bootstrapping documentation from scratch (Step 2) never qualifies for the fast path either. **When unsure, don't take the fast path** — a skipped step is cheaper to add back than a duplicated or contradictory fix is to unwind.

---

## Step 1 — Request Understanding

Before reading a file or writing a line, do this and show your work:

- **Restate** the request in your own words. If the restatement doesn't match what was asked, you misread it — reread it, don't proceed on a guess.
- **Separate** what was explicitly stated from what you're assuming. Assumptions are fine; silent ones aren't.
- **Classify** the mission: bug fix, new feature, refactor, migration, investigation, documentation bootstrap, or review-only — and whether it qualifies for the [Step 0 fast path](#step-0--fast-path). This decision shapes everything after it.
- **Decide** whether this is fresh work or touches existing work. If it touches existing work, Step 2 isn't optional — you need to see what's actually there before proposing changes.
- **Surface ambiguity now.** If the request is ambiguous in a way that would change the implementation (not just a style preference), ask now — not three steps later where no one reads it until review.

Don't move to Step 2 on a request you can't accurately restate.

---

## Step 2 — Context Building

Get first-hand context. Don't reason from memory about things you can go check. Scope this to what the mission actually needs:

- **Codebase** — locate the specific modules/files involved. Read the relevant slice, not the whole repo. For a fix or change, find the actual responsible code before proposing anything.
- **External** — docs, API references, library versions, changelogs, standards — anything you'd otherwise be guessing at.
- **Attachments** — files, specs, screenshots, error logs already provided. Read them directly; don't ask the user to re-paste what's already there.
- **Prior art** — check the [History Log](#history-log) below and any existing `PLAN.md`/`TASKS.md` so this doesn't contradict or re-litigate something already settled.
- **Documentation state** — check whether `docs/internal-devsguide/` and `docs/public-userguide/` (this protocol's default doc roots) exist:
  - **Both exist** → proceed normally: read whatever page this mission touches (see the [Documentation Map](#documentation-map)) and treat any mismatch with the code as drift, not a nitpick.
  - **The project already documents itself somewhere else** → that location wins, same nearest-file logic as `CONTEXT.md`/`AGENTS.md`; note the deviation once in `PLAN.md` rather than migrating it.
  - **Neither exists yet** — whether the codebase is large and established or this is a fresh project with barely any code — run the [Documentation Bootstrap](#documentation-bootstrap) as Milestone 1 of this mission's plan.

If what's documented no longer matches what the code actually does, that's **documentation drift, not a formatting nitpick** — note it now, explicitly, so it can be corrected as part of this request rather than silently left wrong for the next person to trust.

Record findings in enough detail that Step 3 doesn't re-derive them from scratch. If something is missing and genuinely unreachable, say so explicitly in Step 3 as an **Open Question** or **Required User Action** — don't paper over the gap with a guess.

---

## Step 3 — Implementation Plan → PLAN.md

Once context is solid, draft or update `PLAN.md`.

**Choosing a shape:** if the mission decomposes into phases with real sequencing or dependencies (a schema change must land before the endpoint that uses it; a documentation bootstrap before normal feature work resumes), use milestones with subtasks. If it's one contained piece of work, use a flat task list. Don't dress up a one-file fix as milestones, and don't flatten a multi-phase migration into one task.

### `PLAN.md` template

```markdown
# PLAN: <MISSION NAME, e.g. "PAYMENT VERIFICATION SYSTEM">

## Context summary
<2–5 sentences: what exists today, what's changing, why — drawn from Step 2>

## Milestone 1: <name>          <!-- omit this layer entirely for flat plans -->

### Task 1.1: <name>
**Type:** Fix existing / New from scratch
**What exists today:** <if fixing — the current file/function/behavior responsible, so nothing gets duplicated or rewritten blind>
**Work:** <what to actually do>
**Commit:** one atomic commit on completion, message prefixed with the task ID
  (e.g. `1.1: add retry logic to webhook handler`) so history stays traceable
  and any single task can be reverted on its own.
**Docs affected:** <exact path(s) from the Documentation Map — e.g.
  `docs/internal-devsguide/03-api-reference.md`,
  `docs/public-userguide/01-invite-teammates.md` — or "none: <one-line reason>"
  if genuinely nothing documented is touched. A path that doesn't exist yet
  isn't "none" — create it. Never leave this field blank.>

**IMPORTANT:** <the real root cause or actual constraint driving this task — not a restatement of the title>

**OPEN QUESTIONS:** <only if a human decision is genuinely needed>
- <question>? Recommendation: <your recommendation and why>

**REQUIRED USER ACTION:** <only if something only the user can do>
- e.g. "Provide the Stripe webhook signing secret as `STRIPE_WEBHOOK_SECRET`"
- e.g. "Run the attached migration against the staging database"

### Task 1.2: <name>
...
```

### Verification

Verification exists to find failures, not confirm happy paths. Apply what's relevant to this mission:

**Failure & edge paths** — where most real bugs live, and most test suites skip it:
- Timeouts, partial failures, malformed input, empty lists/collections, concurrent writes to the same resource.

**Security basics** — anything touching external input, auth, or secrets:
- New input from outside the trust boundary gets validated, not just parsed. Secrets are never hardcoded, logged, or echoed back. No new dependency is added without a quick check for known CVEs.

**Tenant isolation** (multi-tenant systems — its own category, never assumed from the architecture):
- Explicit test that Tenant A cannot read or write Tenant B's data, exercised at the API/query layer.

**Migrations:**
- Confirm the migration is reversible. Run it against realistic data shape, not an empty dev database.

**Contract tests between services:**
- If Service A's response shape changes, something must catch it before Service B breaks in production.

**Working with tests, specifically:**
- Read the actual assertions in a sample of generated tests, not just whether the suite passes. Watch for loose assertions or mocking away the thing under test.
- For nontrivial logic, write the test before the implementation — it forces the spec into the open and stops the test being reverse-engineered to match buggy code.
- Generate adversarial/edge inputs yourself (empty arrays, unicode, negative numbers, huge payloads) — people get lazy here; this is a genuine strength worth giving attention.

**How much to test — the heuristic:**

Ask: *if this breaks, how would we find out, and how bad would it be before we did?*
- "Silently, and pretty bad" (billing, auth, tenant isolation, migrations) → test heavily, review by hand.
- "Immediately obvious, low-stakes" (a UI label, a trivial mapper) → light or no testing is fine.

**Documentation sync:**
- Every "Docs affected" path is actually updated, matches current behavior, and follows the Documentation Map's conventions. If a task was marked "none," confirm that's still true after implementation.

**Final gate:** build the project, run the linter, run the full existing test suite. Fix whatever any of the three surfaces, then repeat until all three are clean. Nothing is verified until it builds, lints, passes tests, and its docs match reality.

### Handling drift

Plans and docs are both written on the best context available at the time — both are allowed to be wrong. If implementation turns up something that contradicts `PLAN.md` (an incomplete "what exists today," a dependency that doesn't behave as documented, an open question blocking more than expected) or contradicts an existing doc (a described endpoint that's changed shape, a feature renamed or removed), **stop and fix the source of truth before continuing**: update `PLAN.md`, and add the doc correction as its own task in this same plan — not filed away as "someone should fix that eventually." If the drift is large enough to be its own mission (e.g. a whole architecture doc out of date, not just one page), say so explicitly and propose it as a separate follow-up rather than silently expanding this one's scope.

---

## Step 4 — Task Checklist → TASKS.md

Mirror every task from `PLAN.md` as a checkbox, same order, same names, including its docs field. This is the single source of truth for "is this done" — check an item off immediately after its own verification passes, its commit is made, and its listed docs are updated, not before and not in a batch at the end. This is what stops an agent picking the work up cold from re-doing or duplicating something already finished: **read `TASKS.md` first, touch only unchecked items.**

### `TASKS.md` template

```markdown
# TASKS: <MISSION NAME>

## Milestone 1: <name>
- [ ] 1.1 <task name> — commit: <hash/message> — docs: <path(s) or "n/a">
- [ ] 1.2 <task name> — commit: <hash/message> — docs: <path(s) or "n/a">

## Verification
- [ ] Failure & edge paths
- [ ] Security basics (if applicable)
- [ ] Tenant isolation (if applicable)
- [ ] Migration reversibility (if applicable)
- [ ] Contract tests (if applicable)
- [ ] Documentation updated and matches implemented behavior (or confirmed still "n/a")
- [ ] Build, lint, and full test suite all pass clean
```

Keep `PLAN.md` and `TASKS.md` in sync — if a task's scope or its docs field changes in the plan, update its checklist entry in the same edit.

### Sync to remote

The moment every item in `TASKS.md` is checked off, sync before doing anything else — don't leave a fully-verified mission sitting unpushed while you go write up the walkthrough. Identify the current branch and the configured remote's URL, and confirm that URL actually matches this repo before doing anything else. Then fetch and compare against the remote branch:

- **Matches, and local is even with or ahead** → push and confirm it.
- **Matches, but local is behind or has diverged** → stop; surface this to the user instead of force-pushing. Merging or rebasing is their call, not something to resolve silently.
- **No remote configured, or the configured one doesn't match this repo** → don't invent or guess a destination. Give the exact commands needed (`git remote add origin <url>`, `git fetch origin`, `git push -u origin <branch>`) and state plainly that the push is still pending.

Only move on to Step 5 once this is resolved one way or the other — pushed, or explicitly still pending with a stated reason.

---

## Step 5 — Walkthrough

Only once the build is clean, the checklist is fully checked, and the sync above is resolved. Deliver this directly to the user — chat, PR description, or commit message — rather than a new persistent file, unless the project keeps a running `CHANGELOG.md`.

Cover, briefly:

- **What was done** — task by task, plain language, with the commit each one landed in.
- **Documentation updated** — which files changed and what for, or an explicit one-line note on why none applied.
- **Required user actions** — re-surface anything still outstanding from `PLAN.md`. Don't let these get lost between Step 3 and here.
- **What's next** — genuinely optional follow-ups or known gaps, not a pitch for more work.
- **Sync status** — state plainly whether it pushed, or is still pending and why (diverged, no remote configured, etc.), per the [Sync to remote](#step-4--task-checklist--tasksmd) step above.

---

## Operating Rules

- One `CONTEXT.md` per project root (or per package in a monorepo — nearest file wins, same convention as `AGENTS.md`).
- This protocol assumes a single agent working sequentially in one session. It doesn't require or assume subagent delegation or parallel sessions — if that's ever introduced, this file needs a rewrite, not an extension.
- Every non-trivial request goes through all five steps, in order. Don't skip Context Building because a request "looks simple" — that's exactly how duplicate or contradictory fixes happen. Trivial, single-file, low-risk requests may use the [Step 0 fast path](#step-0--fast-path) instead.
- Never check off a `TASKS.md` item without its verification passing, its commit made, and its docs field resolved.
- A task that changes an API's shape, a module's public interface, the data model, an auth/tenancy boundary, or any user-facing flow is not complete until its corresponding doc is updated **in the same commit**. A green build sitting next to a stale doc is not "done" — it's a doc that will actively mislead the next reader, human or agent.
- A mission isn't shipped until it's pushed, and never pushed blind: see [Step 4's Sync to remote](#step-4--task-checklist--tasksmd) for the branch/remote-match/divergence check that must pass first, run the moment the checklist is fully checked off.
- When a request ships, archive it below and clear the [Request](#request) block so the next session starts clean.

---

## Documentation Bootstrap

Runs once per doc set, whenever Step 2 finds that `docs/internal-devsguide/` and/or `docs/public-userguide/` don't exist yet — whether the codebase is large and undocumented, or this is a fresh project with barely any code. Treat it as Milestone 1 of a normal `PLAN.md`/`TASKS.md`; Steps 3–5 still apply, this just replaces a narrow code read with a wider first pass:

1. **Discovery** — read any PRD/spec plus the actual code (for a fresh project, whatever scaffolding or spec exists) to map modules, repo structure, the real dependency graph, exposed/consumed APIs, the data model, the auth & tenant-isolation mechanism as implemented, config/env, tests, and any cookies/trackers/analytics actually present (factual input for legal pages later, not the legal text itself). Flag contradictions, unowned code, or anywhere you had to infer intent rather than read it — don't paper over ambiguity with confident prose.
2. **Outline** — propose headings-only outlines for both doc sets, using the [Documentation Map](#documentation-map) as the file list, plus your open questions. Stop and get the user's go-ahead before writing content — this gate is separate from `PLAN.md` sign-off.
3. **Populate, staged** — write one internal page and one user-facing page first (default: `00-mission-and-overview.md` and `00-getting-started.md`, or whichever two the user cares most about), then pause and show the user those two before continuing. This catches a wrong tone or depth early instead of after all the files are written. Once confirmed, populate the rest per the Documentation Map and the [Conventions](#conventions) below. Files under `docs/public-userguide/04-legal-and-policies/` get a factual inventory only (never invented boilerplate) plus the `DRAFT` marker.
4. **Self-review** — Diátaxis boundaries hold per page, every internal "best practice"/"validation" claim cites a real file reference, no user-guide page leaks jargon or internal names, every page is linked from a top-level index in its set, every code link resolves.
5. **Wire in** — add a one-line `docs/internal-devsguide/CONTRIBUTING-TO-DOCS.md` and `docs/public-userguide/CONTRIBUTING-TO-DOCS.md`, each pointing back to this file's Documentation Map, so later missions maintain instead of re-bootstrapping.

---

## Documentation Map

`docs/internal-devsguide/` and `docs/public-userguide/` are this protocol's default documentation roots for every project. Two doc sets exist, kept structurally and audience-wise separate — never blend them, never let internal implementation detail leak into the user-guide, never let user-guide task framing leak into internal reference:

- **`docs/internal-devsguide/`** — for developers/maintainers. Assumes technical competence.
- **`docs/public-userguide/`** — for end users. No jargon, no architecture, no internal names.

This table is the single source of truth for which file a change touches — Step 3's "Docs affected" field must cite a row from here (or `"none: <reason>"`) for every task, never left blank, never guessed. It applies the same whether this is an established project, a brand-new one, or one with code but no docs yet — a missing directory isn't "nothing to do here," it's the starting state: run the [Documentation Bootstrap](#documentation-bootstrap) above once, using this table as the file skeleton.

In case a path change or addition makes any row in this table outdated, update the table itself as part of the same task, and call that out in the [walkthrough](#step-5--walkthrough) so the drift doesn't go unnoticed.

| Change type | Update this |
|---|---|
| Project's core purpose, audience, or one of the handful of decisions that shape everything else is set or changes | `docs/internal-devsguide/00-mission-and-overview.md` — one page, skimmable in ~2 minutes |
| New/changed API endpoint, request/response shape, error code | `docs/internal-devsguide/03-api-reference.md` |
| New module, or a module's responsibility/boundary changes | `docs/internal-devsguide/02-modules/<module-name>.md` |
| New service, changed data flow, changed dependency between modules, or a repo-structure change | `docs/internal-devsguide/01-architecture.md` — regenerate the specific diagram affected, don't hand-edit stale Mermaid |
| Schema change, new table, changed relationship, new migration | `docs/internal-devsguide/04-data-model.md` |
| Anything touching tenant scoping, auth, permissions, or session handling | `docs/internal-devsguide/05-multi-tenancy-and-security.md` — mandatory, never skip, never fold into architecture instead |
| A real design decision made, reversed, or superseded | New file in `docs/internal-devsguide/06-decisions/`, ADR format (context, decision, consequences). Mark confidence [high/medium/low] if reconstructed rather than written at decision time |
| A bug, limitation, or shortcut knowingly left in place | `docs/internal-devsguide/07-known-issues-and-tech-debt.md` — don't sanitize it |
| New setup step, env var, or local-dev requirement | `docs/internal-devsguide/08-onboarding.md` |
| New domain term, acronym, or internal name | `docs/internal-devsguide/09-glossary.md` |
| New or changed user-facing feature or workflow | `docs/public-userguide/01-<feature-name>.md` — new page, or update the existing one |
| Change to first-run, signup, or first-success experience | `docs/public-userguide/00-getting-started.md` |
| A new common failure mode a user could realistically hit | `docs/public-userguide/02-faq-and-troubleshooting.md` |
| Billing or account-behavior change | `docs/public-userguide/03-account-and-billing.md` |
| A change to what data is collected, what cookies/trackers are set, or what third parties receive data | `docs/public-userguide/04-legal-and-policies/` (the specific policy file) — flag for human/legal review, do not let an agent-authored edit to legal text ship on its own |

---

## Conventions

Hold on every documentation edit, not just first-draft generation:

- **Internal docs:** every "best practice" or "validation" claim carries a real file reference (`path/to/file.py#L23-45`, or the repo's equivalent permalink format) — no unverifiable assertions.
- **User-guide:** no paragraph over 4 sentences, numbered steps over prose wherever there's a sequence, one concept per page, `> Note:` / `> Warning:` callouts for anything risky or irreversible. Screenshot placeholders always use the format `[SCREENSHOT: <route or URL> — <what it should show>]` — keep it identical across pages so screenshots can be batch-inserted later.
- **Diátaxis boundaries** hold on every edit: don't let a reference page grow tutorial prose, don't let a how-to page turn into an explanation of internals.
- Every internal doc-level claim about "why" for a nontrivial decision either points to an existing ADR or gets a new one — don't restate rationale inline in three different files.
- `docs/public-userguide/04-legal-and-policies/` is exempt from the Diátaxis/readability rules above — it's binding legal text, not task documentation. Any edit there carries a `DRAFT — requires legal review before publishing` marker until a human explicitly clears it.

---

## History Log

<!-- One line per completed request. Format: DATE — one-line mission — outcome (shipped/pushed, or pending + why). Newest on top. -->
<!-- Example: 2026-07-21 — Added webhook retry logic to payments module — shipped, pushed to origin/main -->
