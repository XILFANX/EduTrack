# Agent Harness — How AI-Assisted Development Works

This document describes the binary agent harness that governs all AI-assisted development on EduTrack. Every AI agent working in this repo — regardless of model — operates under this protocol. Understanding it lets you audit what the agent did, resume interrupted sessions, and extend the harness correctly.

---

## Architecture Overview

The harness is a three-layer system:

```
Layer 0  .agents/AGENTS.md     — always in agent memory; pure binary gates
Layer 1  MISSION.md            — per-session scratchpad; created at turn 0, gitignored
Layer 2  CONTEXT.md            — library; read on demand, not loaded wholesale
```

**Layer 0** is the only file the agent always has in memory. It contains no explanations — only numbered gates with explicit commands. This is intentional: prose decays under context pressure. Binary commands do not.

**Layer 1 (`MISSION.md`)** is created automatically at the start of every session. It is local-only (`.gitignore`d) and acts as the session journal. It replaces the old pattern of pasting requests into `CONTEXT.md`.

**Layer 2 (`CONTEXT.md`)** is the reference library. The agent reads it as a tool call — only the sections it needs (Documentation Map, History Log, Verification Tiers). It is not dumped into system memory on every turn.

---

## The 7 Gates

Every agent turn flows through these gates in order. A gate that fails does not advance.

### GATE 0 — Input Normalization
The raw user prompt — regardless of length — is parsed into a 4-field structured block before any reasoning starts:

```
INTENT:     <one sentence — the real goal>
TYPE:       bug-fix | new-feature | refactor | investigation | doc-only | harness
FAST_PATH:  yes | no
AMBIGUITY:  <question> [STOP]           ← only when impl-blocking
```

This is the input formatter. A 500-word prompt and a one-liner produce the same structured output. The agent never acts on raw unstructured input.

### GATE 1 — Mission File
Before any source file is opened, the agent checks for `MISSION.md` at the repo root.

- **Not found** → creates it from the template in `CONTEXT.md § Mission Template`, writes the verbatim user request under `REQUEST:`, sets `STAGE: UNDERSTAND`.
- **Found** → reads it and resumes from the current `STAGE`. Work already done is not repeated.

This gate makes sessions resumable across context resets and conversation truncations.

### GATE 2 — Fast Path
If `FAST_PATH: yes` (confined to ≤ 2 files, zero design decisions, verifiable in a single build cycle, no doc line made wrong):
1. State the change in one sentence.
2. Make it.
3. Run `npm run build` (or `tsc --noEmit` if build is not applicable).
4. Fix any doc line the change invalidates in the same pass.
5. Confirm remote URL, commit, and push. Report in chat. Done.

Any ambiguity, multi-file scope, or design decision disqualifies fast-path. When unsure, the agent does not take it.

### GATE 3 — Context
The agent reads only the sections of `CONTEXT.md` it needs:
- **Documentation Map** — to identify which doc files this mission touches
- **History Log** — to catch anything already settled, preventing duplicate or contradictory work

It then reads the specific source files responsible for the change. It does not scan the whole repo. It also runs a documentation bootstrap if the docs directories are missing.

### GATE 4 — Plan + Tasks
The agent writes or updates two files:
- **`PLAN.md`** — one task block per change, with: what exists today (file + function), what changes, docs affected (exact path from Documentation Map or `none: <reason>`), and the Tier 1 gate command.
- **`TASKS.md`** — one checkbox per task. Format: `- [ ] <id> <name> — tier1: pending — commit: — docs:` and a section for Tier 2 Mission Gate checks.

`MISSION.md` is updated to `STAGE: EXECUTE`.

### GATE 5 — Per-Task Execution Loop
For each unchecked task, in order:
1. Implement the change.
2. Run Tier 1: `npm run build` + lint + relevant tests. **If it fails → fix and re-run. Do not advance.** Tasks touching auth or tenant boundaries get extra security checks here.
3. Write or update the docs listed in "Docs affected" — only after Tier 1 is clean.
4. Commit code + docs together in one atomic commit.
5. Update the task checkbox: `- [x] <id> <name> — tier1: pass — commit: <hash> — docs: <path>`
6. Update `MISSION.md TASKS` section.

Tasks are never batch-checked. Docs are never written before the code compiles.

### GATE 6 — Mission Gate (Tier 2)
After every task is checked off:
- Full build (not just touched packages)
- Full lint
- Full existing test suite
- Documentation re-sync (every "Docs affected" path still matches real behavior)

A failure here is treated as drift, not a fresh bug:
1. Fix the code.
2. Re-run Tier 2 in full.
3. Land the fix as its own commit tagged to the originating task ID (e.g. `1.3-fix: ...`). Never amend or rebase.
4. Reopen the task line and re-check it after the fix's Tier 1 pass is clean.

### GATE 7 — Sync + Close
This happens **immediately** after Tier 2 passes:
1. `git remote -v` — confirm the remote URL matches this repo before pushing.
2. Push. Confirm it succeeded by showing the ref line.
3. Append one line to `CONTEXT.md § History Log`. **History Log stays at ≤ 10 rows.**
4. Clear `MISSION.md` (`STAGE: DONE`, blank `REQUEST:`).
5. Deliver a walkthrough in chat covering: what changed, Tier 1/2 results, docs updated, push status.

---

## File Reference

| File | Purpose | Committed? |
|---|---|---|
| `.agents/AGENTS.md` | Binary gate harness — agent system prompt | ✅ Yes |
| `CONTEXT.md` | Library: Documentation Map, History Log, Verification Tiers, Conventions | ✅ Yes |
| `MISSION.md` | Session scratchpad: REQUEST, STAGE, TASKS | ❌ No (gitignored) |
| `PLAN.md` | Mission plan with task breakdown | ✅ Yes |
| `TASKS.md` | Live task checklist | ✅ Yes |

---

## MISSION.md Template

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

---

## Extending the Harness

- **To add a new gate:** add it to `.agents/AGENTS.md` as a numbered `GATE N` block. Keep it binary — a condition, a YES branch, and a NO branch. No prose rationale in that file.
- **To update the Documentation Map:** edit `CONTEXT.md § Documentation Map`. Every new module, schema change, or API surface needs a row.
- **To add a rule:** append it to the `NON-NEGOTIABLE RULES` block in `.agents/AGENTS.md`. State it as a DO or DO NOT, not as a recommendation.
- **Do not add rationale to `AGENTS.md`.** Rationale belongs in this document or in an ADR under `docs/internal-devsguide/06-decisions/`. Rationale in the binary layer gets paraphrased into suggestions by the model under pressure.

---

## Why This Design

The previous harness (`AGENTS.md` v1) was 68 lines of prose. Under long-context pressure, the model treated it as "guidance" and paraphrased it — leading to missed gates and incomplete documentation. The binary redesign borrows from two established techniques:

1. **Constitutional AI (Anthropic):** the system layer contains binary rules, not explanations. Explanations live in a separate, on-demand library.
2. **Structured prompting:** raw input is normalized before reasoning. The model never acts on ambiguous natural language directly — it always works from the 4-field normalized block.

Context budget impact: the old `CONTEXT.md` cost ~680 tokens on every read. The new `CONTEXT.md` costs ~160 tokens. `AGENTS.md` itself dropped from ~520 tokens to ~380 — but more importantly, those 380 tokens are now commands, not suggestions.
