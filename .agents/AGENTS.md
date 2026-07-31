# Agent Operating Protocol Bridge

This file is automatically loaded into agent system memory on every invocation. It is the executable entry point for every session in this repository. `CONTEXT.md` (workspace root) is the full canonical reference — this file enforces its most critical rules in condensed form so they are always in memory without a 370-line load penalty.

---

## On Every Invocation — Run This Sequence

### 0. Capture the Request
If the user gives a task in chat, your **very first action** — before reading any file or writing any code — is to open `CONTEXT.md` and paste the exact request verbatim into the `## Request` block. If a request is already there, read it immediately. Never begin work without the request logged.

### 1. Understand
Before touching any file:
- Restate the request in your own words. If your restatement doesn't match what was asked, reread — do not proceed on a guess.
- Explicitly separate what was stated from what you are assuming.
- Classify the mission: bug fix / new feature / refactor / migration / documentation / investigation.
- Decide if it qualifies for the **Step 0 Fast Path** (single file, low-risk, one build cycle to verify). If unsure, do not take the fast path.

### 2. Build Context
Read the actual code and docs before proposing anything:
- Find the specific files responsible. Read the relevant slice, not the whole repo.
- Check the **History Log** in `CONTEXT.md` so this doesn't re-litigate something already settled.
- Check `docs/internal-devsguide/` and `docs/public-userguide/`. If neither exists, the first milestone of this mission is the **Documentation Bootstrap** (see `CONTEXT.md`).
- Identify every doc page this mission touches using the **Documentation Map** in `CONTEXT.md`. Do this now — not after the code is written.

### 3. Write PLAN.md
Draft or update `PLAN.md` in the workspace root. For every task, you must fill in:
- What exists today (the actual responsible code/function — never guess).
- Exactly what will change.
- **Docs affected** — the exact path(s) from the Documentation Map, or `none: <one-line reason>`. This field is **never blank**. A task that touches a module, feature, data model, API, auth boundary, or user-facing flow always has a doc path.
- Tier 1 gate: build + lint + relevant tests (must be clean **before** docs are written and the commit is made).
- One atomic commit per task (code + docs together).

### 4. Execute → Track in TASKS.md
Mirror every task as a checkbox in `TASKS.md`. **Check a task off only after all three are true:**
1. Tier 1 (build + lint + relevant tests) is clean.
2. The task's `Docs affected` files are updated and committed in the same commit as the code.
3. The task line in `TASKS.md` is updated with commit hash and docs path.

**Never batch-check tasks at the end. Never check off a task whose docs field is still blank.**

After every task is checked, run the **Tier 2 Mission Gate** (full build, full lint, full test suite, documentation re-sync across every "Docs affected" field). This is not optional for any mission, including doc-only ones. Update `CONTEXT.md` live with inline status as you go.

### 5. Walkthrough & Sync
Only after Tier 2 is fully clean:
- Deliver a walkthrough to the user covering: what was done (task by task), Tier 1/2 results, which docs were updated and why, any required user actions, and sync status.
- Push to remote. Confirm the push succeeded. A mission is not complete until it is on the remote.
- Append a one-line entry to the **History Log** in `CONTEXT.md` and clear the Request block.
- Sync `CONTEXT.md` to the paired repo (EduTrack ↔ EstateTrack) if they share the same protocol.

---

## The Non-Negotiable Rules (Always Active)

- **Documentation is not optional.** A green build + stale or missing doc = incomplete task. This is the single most commonly skipped step and the one that causes the most downstream confusion.
- **Never write docs before Tier 1 is clean** for that task. Code that doesn't build yet has no trustworthy behavior to document.
- **Never check off Tier 2** until every task above it is checked, documented, and committed.
- **Never push blind** — check that the remote URL matches this repo before pushing.
- A task that changes an API shape, data model, auth boundary, module responsibility, or user-facing flow is **not done** until its doc is updated in the same commit.

---

## Why This Architecture Works

`AGENTS.md` (this file) is the **binary** — static, always in memory, enforces the rules on every turn without a token-expensive full load. `CONTEXT.md` is the **library** — the full protocol with templates, the Documentation Map, verification tier details, and the living mission state (Request block, History Log). The agent reads `CONTEXT.md` dynamically as a file task, not by loading it wholesale into system memory. This keeps the context window clean while making it impossible to bypass the protocol.

**Failure to follow any rule in this file is a critical failure. No exceptions.**
