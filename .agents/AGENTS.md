# HARNESS BINARY — EduTrack
# Loaded into system memory on every invocation. Zero rationale. Pure gates.

## GATE 0 — INPUT NORMALIZATION (always first, before any tool call)

Parse the user prompt into this block. Output it in your first response. Do not skip.

```
INTENT:      <one sentence — the real goal>
TYPE:        bug-fix | new-feature | refactor | investigation | harness | doc-only
FAST_PATH:   yes | no
SCREENSHOT:  <portal — element — issue>  ← only if screenshot provided
AMBIGUITY:   <question> [STOP — do not proceed until resolved]  ← only if impl-blocking
```

Rules:
- Prompt > 200 words → summarize INTENT to one sentence.
- Prompt contains screenshot → identify portal, element, and what is wrong.
- Ambiguity that changes implementation → surface it. Do not guess. Do not proceed.
- One-liner → classify and continue.

## GATE 1 — MISSION FILE (before any code or file read)

CHECK: Does `MISSION.md` exist at repo root?
- NO → CREATE it now using the template in `CONTEXT.md § Mission Template`. Write verbatim REQUEST. Set STAGE: UNDERSTAND.
- YES → READ it. Resume from current STAGE. Do not re-do completed stages.

GATE: No tool call on source code until MISSION.md exists and REQUEST is logged.

## GATE 2 — FAST PATH CHECK

IF FAST_PATH = yes:
  1. State the change in one sentence.
  2. Make it.
  3. Run: `tsc --noEmit` (or `npm run build` for build errors).
  4. If any doc line is made wrong by the change → fix it in the same pass.
  5. Commit. Report in chat. DONE.
ELSE → continue to GATE 3.

## GATE 3 — CONTEXT (before planning)

READ: `CONTEXT.md` — Documentation Map + History Log only.
READ: Relevant source files (the actual responsible code — never guess).
DO NOT read the entire repo. Scope to what the mission touches.
CHECK: History Log — is this already settled? If yes, surface it and stop.

## GATE 4 — PLAN + TASKS

WRITE `PLAN.md`. Required fields per task:
- What exists today (file + function — never blank)
- What changes
- Docs affected (exact path from Documentation Map, or `none: <reason>`)
- Tier 1 gate command

WRITE `TASKS.md`. One checkbox per task. Format:
`- [ ] <id> <name> — tier1: pending — commit: — docs: `

Update MISSION.md STAGE → EXECUTE.

## GATE 5 — PER-TASK EXECUTION LOOP

For each unchecked task in TASKS.md:
1. Implement.
2. Run Tier 1: `tsc --noEmit` + build + relevant tests. FAIL → fix and re-run. Do NOT continue.
3. Write/update the "Docs affected" file(s) — only after Tier 1 is clean.
4. Commit code + docs together. One atomic commit.
5. Check off TASKS.md: `- [x] <id> <name> — tier1: pass — commit: <hash> — docs: <path>`
6. Update MISSION.md TASKS section.

GATE: Never check off a task before Tier 1 is clean, the commit is made, and docs are updated.
GATE: Never write docs before Tier 1 is clean for that task.

## GATE 6 — MISSION GATE (Tier 2 — after all tasks checked)

RUN: Full build. Full lint. Full test suite. Documentation re-sync.
FAIL → Fix as a tagged fix-commit (e.g. `1.3-fix: ...`). Reopen the task line. Re-run Tier 2.
PASS → continue.

## GATE 7 — SYNC + CLOSE

1. `git remote -v` — confirm remote URL matches this repo.
2. Push. Confirm push succeeded.
3. Append one line to History Log in `CONTEXT.md`.
4. Clear MISSION.md (set STAGE: DONE, blank REQUEST).
5. Deliver walkthrough in chat: what changed, Tier 1/2 results, docs updated, push status.

---

## NON-NEGOTIABLE RULES (always active, no exceptions)

- MISSION.md must exist before any source file is touched.
- Docs are never written before Tier 1 is clean.
- Never check off a task batch. One at a time.
- Never push without verifying the remote URL.
- Never guess at "what exists today" — read the file.
- A task touching API shape, data model, auth, or user-facing flow is NOT done without a doc update.
- Build failure in production = stale deployment. Always verify with `npm run build` before pushing.

## POINTERS

- Full protocol + verification tier details → `CONTEXT.md`
- Documentation routing table → `CONTEXT.md § Documentation Map`
- Mission scratchpad template → `CONTEXT.md § Mission Template`
- History → `CONTEXT.md § History Log`
