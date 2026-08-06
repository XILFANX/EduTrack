# AGENT HARNESS — EduTrack
# Loaded into context on every invocation.
# Full protocol details live in CONTEXT.md — read it at GATE 3, not before.

---

## GATE 0 — CLASSIFY (output this block first, before any tool call)

```
INTENT:     <one sentence — the real goal>
TYPE:       bug-fix | new-feature | refactor | investigation | doc-only | harness
FAST_PATH:  yes | no  ← see criteria below
AMBIGUITY:  <question> [STOP — do not proceed until resolved]  ← only if impl-blocking
```

**Fast path = yes** only when ALL of these hold:
- Change is confined to ≤ 2 files
- Zero design decisions involved
- Verifiable in a single build cycle (typo, config value, obvious one-liner)
- Nothing documented is made wrong — or one doc line can be fixed in the same pass

When unsure → `FAST_PATH: no`. A skipped step costs less to add back than a contradictory fix costs to unwind.

Ambiguity that changes implementation → surface it, stop. Do not guess. Do not proceed.

---

## GATE 1 — MISSION FILE (before reading any source file)

CHECK: Does `MISSION.md` exist at repo root?
- **NO** → CREATE it using the template in `CONTEXT.md § Mission Template`. Write REQUEST verbatim. Set STAGE: UNDERSTAND.
- **YES** → READ it. Resume from STAGE. Do not re-do completed stages.

**GATE: No tool call on source code until MISSION.md exists and REQUEST is logged.**

---

## GATE 2 — FAST PATH (if FAST_PATH = yes)

1. State in one sentence what you are about to do.
2. Make the change.
3. Run: `npm run build` (or `tsc --noEmit` if build is not applicable).
4. If any doc line is made wrong by the change → fix it in the same pass, after step 3 is clean.
5. Confirm the remote URL matches this repo (`git remote -v`). Push. Report in chat.

**DONE — skip remaining gates.**

---

## GATE 3 — CONTEXT (before planning)

READ `CONTEXT.md` — Documentation Map + History Log only. Do not read the entire repo.
READ the actual source files the mission touches — never guess at what exists.

CHECK the History Log: is this already settled? If yes, surface it and stop.

CHECK documentation state:
- `docs/internal-devsguide/` and `docs/public-userguide/` exist → proceed normally.
- Only one exists, or neither → flag it; run the Documentation Bootstrap (CONTEXT.md § Documentation Bootstrap) as Milestone 1 before any feature work.
- Project documents itself elsewhere → that location wins; note the deviation once in PLAN.md.

---

## GATE 4 — PLAN + TASKS (before writing any code)

WRITE `PLAN.md`. Every task entry must include:
- **What exists today** — file + function/component (never blank; read the file first)
- **What changes**
- **Docs affected** — exact path from Documentation Map, or `none: <one-line reason>`. Never blank.
- **Tier 1 gate** — the specific build/lint/test command for this task

WRITE `TASKS.md`. One checkbox per task:
```
- [ ] <id> <name> — tier1: pending — commit: — docs:
```
Include a Tier 2 block at the bottom — unchecked, only touched after every task above is done:
```
## Mission Gate (Tier 2)
- [ ] Full build clean
- [ ] Full lint clean
- [ ] Full test suite passes
- [ ] Doc re-sync confirmed
```

Update MISSION.md: STAGE → EXECUTE.

**GATE: No implementation until PLAN.md and TASKS.md both exist.**

---

## GATE 5 — PER-TASK EXECUTION LOOP

For each unchecked task in TASKS.md, in order:

1. **Implement** the task.
2. **Tier 1** — run `npm run build` + lint + tests touching changed files.
   - **FAIL** → fix and re-run. Do not advance. Do not write docs. Do not commit.
   - Tasks touching auth, external input, or tenant boundaries → additionally verify: input validated; secrets not hardcoded/logged; Tenant A cannot access Tenant B's data.
3. **Write / update docs** — only after Tier 1 is clean. Cite the path in TASKS.md.
4. **Commit** — code + docs together, one atomic commit. Message: `<id>: <description>`.
5. **Check off** TASKS.md:
   ```
   - [x] <id> <name> — tier1: pass — commit: <hash> — docs: <path or none: reason>
   ```
6. Update MISSION.md TASKS section.

**GATE: Never check off a task before Tier 1 is clean, commit is made, and docs are resolved.**
**GATE: Never write docs before Tier 1 is clean for that task.**
**GATE: Never batch-check tasks. One at a time.**

---

## GATE 6 — MISSION GATE (Tier 2 — after all tasks checked off)

RUN in order:
1. Full build — not just touched packages.
2. Full lint — not just changed files.
3. Full existing test suite.
4. Doc re-sync — every "Docs affected" path across the whole plan still matches current behavior.

**FAIL** → drift, not a fresh bug:
1. Fix the code.
2. Re-run Tier 2 in full.
3. Land fix as its own commit: `<id>-fix: <what Tier 2 exposed>`. Never amend or rebase.
4. Reopen that task's TASKS.md line. Re-check only after the fix's own Tier 1 pass is clean.

**PASS** → continue to GATE 7.

---

## GATE 7 — SYNC + CLOSE

**Execute immediately once Tier 2 passes — before anything else.**

1. `git remote -v` — confirm remote URL matches this repo.
   - Does not match → stop; surface to user; do not guess or invent a destination.
   - Local is behind or diverged → stop; surface to user; do not force-push.
2. Push. Confirm by showing the ref line from git output.
3. **Append one line** to History Log in `CONTEXT.md`:
   ```
   | YYYY-MM-DD | <one-line mission summary> | Shipped `<hash>` |
   ```
   **History Log is capped at 10 rows.** If this entry would make it 11, drop the oldest row in the same edit.
4. Clear `MISSION.md` — set STAGE: DONE, blank the REQUEST block.
5. **Deliver walkthrough in chat** (not as a file, unless a CHANGELOG.md exists in this repo):
   - What was done — task by task, plain language, commit each one landed in
   - Verification — Tier 1 passed per task; Tier 2 passed at mission scope; any fix-commits Tier 2 required
   - Docs updated — which files, what for; or an explicit one-liner on why none applied
   - Required user actions — anything from PLAN.md still outstanding
   - Sync status — pushed (show ref), or pending with stated reason

**GATE: Nothing is shipped until it is pushed. Push is verified, not assumed.**

---

## NON-NEGOTIABLE RULES (enforced on every invocation)

- `MISSION.md` must exist before any source file is read or written.
- Docs are never written before the task's own Tier 1 gate is clean.
- Never batch-check TASKS.md items. One at a time.
- Never push without verifying the remote URL matches this repo first.
- Never guess at "what exists today" — read the file.
- A task that changes API shape, data model, auth, tenant boundary, or any user-facing flow is **not complete** without a doc update in the same commit.
- Push happens immediately after Tier 2 passes — not after the walkthrough, not "at some point."
- History Log stays at ≤ 10 rows. One line per shipped session, not per commit.

---

## Pipeline at a Glance

```
GATE 0: Classify →
GATE 1: Mission file →
  fast path? YES → change → build → doc fix → remote check → push → report. DONE.
            NO  →
GATE 3: Context (CONTEXT.md + relevant source) →
GATE 4: PLAN.md + TASKS.md →
GATE 5: [ implement → Tier 1 → docs → commit → check off ] × N tasks →
GATE 6: Tier 2 (full build + lint + suite + doc re-sync) →
GATE 7: verify remote → push → History Log +1 (cap 10) → clear MISSION.md → walkthrough in chat
```

---

## POINTERS

- Documentation routing table → `CONTEXT.md § Documentation Map`
- Verification tier details → `CONTEXT.md § Verification Tiers`
- Documentation bootstrap → `CONTEXT.md § Documentation Bootstrap`
- Drift handling → `CONTEXT.md § Handling Drift`
- Mission scratchpad template → `CONTEXT.md § Mission Template`
- History Log → `CONTEXT.md § History Log`
