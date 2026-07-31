# PLAN.md — Payment Settlement Reconciliation Engine

**Mission classification:** New feature + migration (full module replacement)  
**Status:** AWAITING USER APPROVAL — 5 open questions (see below)

---

## What Exists Today

| Asset | Location | Problem |
|---|---|---|
| `fee_payments` table | `20260629000000_initial_schema.sql` | Bursar-enters-everything — no parent evidence path |
| `mpesa_stk_requests` | `20260710000002_mpesa_tracking.sql` | Gateway-tied lifecycle, not a general submission model |
| `invoices` + `invoice_items` | `20260629000000_initial_schema.sql` | Good structure — kept as obligation anchor |
| `schools.subscription_tier` | `20260629000000_initial_schema.sql` | Inline, text, no obligation/cycle |
| `bursar/invoices/record-payment-modal.tsx` | Bursar portal | Bursar records on parent's behalf, immediate confirmation |
| `parent/payments/page.tsx` | Parent portal | Read-only view — no submission path for parents at all |

---

## What Will Change

### Exactly what changes:
1. **New shared package** `packages/shared/payments/` — engine, types, tests (built and tested FIRST, shared with EstateTrack)
2. **New migration** `20260801000000_reconciliation_engine.sql` — introduces 8 new tables; legacy tables kept read-only
3. **Data migration scripts** — existing `fee_payments` rows → synthetic `LedgerEntry` records
4. **EduTrack UI** — replace `bursar/invoices/record-payment-modal.tsx`; update `parent/payments/page.tsx`; add bursar ledger + subscription payer flow
5. **API routes** — refactor M-Pesa webhook to create `Submission` (payee-side); add termly obligation generation cron

---

## Docs Affected

| Document | Why |
|---|---|
| `docs/internal-devsguide/04-data-model.md` | 8 new tables; `fee_payments` + `mpesa_stk_requests` deprecated |
| `docs/internal-devsguide/` (payment flow doc — new) | Two-witness model, submission lifecycle, matching engine |
| `docs/public-userguide/` bursar section | New "Verify Payment" replaces manual record-payment |
| `docs/public-userguide/` parent section | New "Post Payment" submission flow |

---

## Open Questions (MUST answer before Phase 3+4)

1. **Platform Rail Profile** — Is there a single paybill for EduTrack subscription payments, or env-var driven?
2. **Parent submission path** — Should parents be able to submit payment evidence in their portal, or is fee verification bursar-only?
3. **Cash/cheque path** — Special-cased UI bypass to manually confirmed ledger entry, or `Submission` record with `method = cash` requiring explicit confirmation?
4. **Tenant submission path (EstateTrack, cross-repo)** — Replace "Notify Landlord" with new blind "Post Payment" flow, or remove entirely?
5. **Caretaker assignment structure (EstateTrack, cross-repo)** — Migrate `properties.caretaker_id` to new `CaretakerAssignment` table, or keep both?

---

## Tier 1 Gate (per task)
- `packages/shared/payments` — all engine tests passing
- `tsc --noEmit` clean
- No new lint errors

## Tier 2 Gate (end of mission)
- Full build clean, all tests pass
- All "Docs affected" files updated and committed in the same commit as code
- Migrations validated in staging
- Remote push confirmed

---

## Execution Phases

- `[ ]` **Phase 1:** Shared engine (built on EstateTrack side, shared here)
- `[ ]` **Phase 2:** DB schema migration + data migration scripts
- `[ ]` **Phase 3:** Server actions (payer, payee, matching, disputes, notifications)
- `[ ]` **Phase 4:** UI — bursar portal, parent portal, billing/subscription payer
- `[ ]` **Phase 5:** Docs + data migration + archive + push
