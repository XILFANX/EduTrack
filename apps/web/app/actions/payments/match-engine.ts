'use server'

/**
 * EstateTrack — Matching Engine Trigger (Server Action)
 *
 * Called automatically after every new Submission (payer or payee side).
 * Wraps the pure engine from packages/shared/payments/engine.ts in a DB context.
 *
 * Flow:
 *  1. Load the new submission
 *  2. Guard: already matched / cash+cheque
 *  3. Resolve Corridor for the submission's rail pair
 *  4. Find the obligation (payer → direct; payee → via code lookup)
 *  5. Load candidate opposite-side submissions
 *  6. Load retired reference codes (replay protection)
 *  7. Run findMatch() from the shared engine
 *  8. Persist:
 *     - 'matched': MatchRecord + LedgerEntry + obligation refresh + notifications
 *     - 'flagged_for_review': DisputeCase immediately (§7.2 outcomes 2+3)
 *     - everything else: no side effect
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { findMatch, normalizeReferenceCode } from '@edutrack/shared/payments/engine'
import type { Submission, Obligation, MatchEngineOptions, Corridor } from '@edutrack/shared/payments/types'
import { dispatchNotification } from './notifications'
import { resolveCorridor } from './corridors'

interface MatchEngineInput {
  newSubmissionId: string
  obligationId: string | null   // null when called from payee side
}

export interface MatchEngineResult {
  status: 'matched' | 'flagged_for_review' | 'amount_mismatch' | 'replay_rejected' | 'no_counterpart' | 'unparseable' | 'error'
  matchRecordId?: string
  ledgerEntryId?: string
  disputeCaseId?: string
  reason: string
}

export async function runMatchingEngine(input: MatchEngineInput): Promise<MatchEngineResult> {
  const admin = createAdminClient() as any

  // ── 1. Load the triggering submission ─────────────────────────────────────
  const { data: newSubRaw, error: subErr } = await admin
    .from('submissions')
    .select('*')
    .eq('id', input.newSubmissionId)
    .single()

  if (subErr || !newSubRaw) {
    return { status: 'error', reason: 'Could not load submission.' }
  }

  const newSub = newSubRaw as Submission

  // Already matched — skip
  if (newSub.status === 'matched') {
    return { status: 'no_counterpart', reason: 'Submission is already matched.' }
  }

  // Cash/cheque never auto-match
  if (newSub.payment_rail === 'cash' || newSub.payment_rail === 'cheque') {
    return { status: 'no_counterpart', reason: 'Cash/cheque requires manual confirmation.' }
  }

  // ── 2. Find the obligation ─────────────────────────────────────────────────
  let obligation: Obligation | null = null

  if (newSub.submitter_role === 'payer' && newSub.obligation_id) {
    const { data: obl } = await admin
      .from('obligations')
      .select('*')
      .eq('id', newSub.obligation_id)
      .single()
    obligation = obl as Obligation | null
  } else if (newSub.submitter_role === 'payee') {
    // Payee is blind — find obligation via payer submission with same reference code
    const { data: payerSubs } = await admin
      .from('submissions')
      .select('obligation_id')
      .eq('reference_code', normalizeReferenceCode(newSub.reference_code))
      .eq('submitter_role', 'payer')
      .eq('status', 'unmatched')
      .not('obligation_id', 'is', null)
      .limit(1)

    if (payerSubs?.[0]?.obligation_id) {
      const { data: obl } = await admin
        .from('obligations')
        .select('*')
        .eq('id', payerSubs[0].obligation_id)
        .single()
      obligation = obl as Obligation | null
    }
  }

  if (!obligation) {
    return { status: 'no_counterpart', reason: 'No matching obligation found for this reference code.' }
  }

  // ── 3. Resolve Corridor ────────────────────────────────────────────────────
  // For the opposite-side, we need to know their rail. For payer submissions
  // we use the payee's default rail from PayeeRailProfile if known; otherwise
  // we resolve after loading candidates. For now, resolve using payer's own rail
  // as proxy — the engine re-evaluates per candidate with the actual payee rail.
  // The corridor row is needed for time-window config; we resolve the final
  // corridor inside findMatch per candidate pair.
  //
  // Optimization: load all candidates first, then resolve corridor once per unique
  // (payer_rail, payee_rail) pair. Since most pools are small, iterate below.

  // ── 4. Load candidate opposite-side submissions ───────────────────────────
  const oppositeRole = newSub.submitter_role === 'payer' ? 'payee' : 'payer'

  const { data: candidatesRaw } = await admin
    .from('submissions')
    .select('*')
    .eq('reference_code', normalizeReferenceCode(newSub.reference_code))
    .eq('submitter_role', oppositeRole)
    .eq('status', 'unmatched')

  const candidates = (candidatesRaw ?? []) as Submission[]

  // ── 5. Load retired reference codes (replay protection) ───────────────────
  const { data: retiredRaw } = await admin.rpc('get_retired_reference_codes')
  const retiredCodes = new Set<string>(
    (retiredRaw ?? []).map((r: { reference_code: string }) =>
      normalizeReferenceCode(r.reference_code),
    ),
  )

  // ── 6. Resolve corridor for the first candidate's rail pair ───────────────
  // For payee-triggered: newSub is payee, candidates are payers.
  // For payer-triggered: newSub is payer, candidates are payees.
  // Use newSub.payment_rail as the "home" rail; if no candidates, use self-pair as proxy.
  const sampleCandidate = candidates[0]
  const payerRail = newSub.submitter_role === 'payer'
    ? newSub.payment_rail
    : sampleCandidate?.payment_rail ?? newSub.payment_rail
  const payeeRail = newSub.submitter_role === 'payee'
    ? newSub.payment_rail
    : sampleCandidate?.payment_rail ?? newSub.payment_rail

  const corridor: Corridor = await resolveCorridor(payerRail, payeeRail)

  const options: MatchEngineOptions = {
    retiredReferenceCodes: retiredCodes,
    corridor,
  }

  // ── 7. Run the pure matching engine ──────────────────────────────────────
  const result = findMatch(newSub, candidates, obligation, options)

  // ── 8. Persist results ────────────────────────────────────────────────────

  // ── 8a. flagged_for_review: open DisputeCase immediately (§7.2 outcomes 2+3)
  if (result.status === 'flagged_for_review' && result.candidate) {
    const { payer, payee } = result.candidate
    const signalEval = result.signalEvaluation

    // Snapshot the current PayeeRailProfile for the obligation at time of dispute
    const { data: railProfileSnapshot } = await admin
      .from('payee_rail_profiles')
      .select('*')
      .eq('payee_account_id', obligation.payee_account_id)
      .eq('is_active', true)
      .limit(1)
      .single()

    const { data: disputeCase } = await admin
      .from('dispute_cases')
      .insert({
        obligation_id: obligation.id,
        payer_submission_id: payer.id,
        payee_submission_id: payee.id,
        origin: 'flagged_pair',
        rail_profile_snapshot: railProfileSnapshot ?? null,
        status: 'open',
        payer_evidence_revealed: false,
        payee_evidence_revealed: false,
      })
      .select('id')
      .single()

    // Log which signals disagreed for operator context
    await admin.from('notification_log').insert({
      event: 'escalated_to_dispute',
      recipient_ids: [payer.submitter_id, payee.submitter_id],
      obligation_id: obligation.id,
      submission_id: newSub.id,
      was_blind: true,
      payload: {
        reason: result.reason,
        engine_status: result.status,
        corridor_strategy: corridor.match_strategy,
        signals_disagreed: signalEval?.signals
          .filter(s => s.state === 'disagrees')
          .map(s => s.signal) ?? [],
        signals_absent: signalEval?.signals
          .filter(s => s.state === 'absent')
          .map(s => s.signal) ?? [],
      },
    })

    await dispatchNotification({
      event: 'escalated_to_dispute',
      recipientIds: [payer.submitter_id, payee.submitter_id],
      blind: true,
      obligationId: obligation.id,
      submissionId: newSub.id,
      data: {
        reason: result.reason,
        disputeCaseId: disputeCase?.id,
        periodLabel: obligation.period_label,
      },
    })

    return {
      status: 'flagged_for_review',
      disputeCaseId: disputeCase?.id,
      reason: result.reason,
    }
  }

  // ── 8b. Non-match outcomes — no side effect, just log notable ones
  if (result.status !== 'matched' || !result.candidate || !result.ledgerEffect) {
    return { status: result.status as MatchEngineResult['status'], reason: result.reason }
  }

  // ── 8c. Matched: create MatchRecord + LedgerEntry ────────────────────────
  const { payer, payee } = result.candidate
  const { type: entryType, amount, creditAmount, balanceAfter } = result.ledgerEffect
  const signalEval = result.signalEvaluation

  // Determine match_method from corridor strategy
  const matchMethod = corridor.match_strategy === 'exact' ? 'exact_code'
    : corridor.match_strategy === 'transform_pattern' ? 'transform_pattern'
    : 'unmapped_fallback'

  const { data: matchRecord, error: mrErr } = await admin
    .from('match_records')
    .insert({
      obligation_id: obligation.id,
      payer_submission_id: payer.id,
      payee_submission_id: payee.id,
      matched_amount: amount,
      currency: payer.parsed_currency,
      match_method: matchMethod,
      corridor_id: corridor.id !== 'transient' ? corridor.id : null,
      // Per-signal audit for §13 auditability
      signals_passed: signalEval?.signals.filter(s => s.state === 'agrees').map(s => s.signal) ?? [],
      signals_absent: signalEval?.signals.filter(s => s.state === 'absent').map(s => s.signal) ?? [],
      signals_disagreed: [],  // matched path has no disagreements by definition
    })
    .select('id')
    .single()

  if (mrErr || !matchRecord) {
    return { status: 'error', reason: 'Failed to create MatchRecord.' }
  }

  // Mark both submissions as matched
  await admin.from('submissions')
    .update({
      status: 'matched',
      matched_at: new Date().toISOString(),
      match_record_id: matchRecord.id,
    })
    .in('id', [payer.id, payee.id])

  // Post LedgerEntry (immutable)
  const { data: ledgerEntry, error: leErr } = await admin
    .from('ledger_entries')
    .insert({
      obligation_id: obligation.id,
      match_record_id: matchRecord.id,
      entry_type: entryType,
      amount,
      currency: payer.parsed_currency,
      balance_after: balanceAfter,
    })
    .select('id')
    .single()

  if (leErr || !ledgerEntry) {
    return { status: 'error', reason: 'Failed to post LedgerEntry.' }
  }

  // Handle overpayment: update obligation credit_balance
  if (entryType === 'overpayment' && creditAmount > 0) {
    await admin.from('obligations')
      .update({ credit_balance: creditAmount })
      .eq('id', obligation.id)
  }

  // Refresh obligation balance and status via DB function
  await admin.rpc('refresh_obligation_status', { p_obligation_id: obligation.id })

  // ── 9. Notifications ──────────────────────────────────────────────────────
  const event = entryType === 'partial' ? 'partial_payment_posted'
    : entryType === 'overpayment' ? 'overpayment_posted'
    : 'submission_auto_matched'

  await dispatchNotification({
    event,
    recipientIds: [payer.submitter_id, payee.submitter_id],
    blind: false,   // Blindness lifted after successful match
    obligationId: obligation.id,
    submissionId: payer.id,
    data: {
      amount,
      currency: payer.parsed_currency,
      entryType,
      balanceAfter,
      creditAmount: creditAmount > 0 ? creditAmount : undefined,
      periodLabel: obligation.period_label,
      matchMethod,
      corridorStrategy: corridor.match_strategy,
    },
  })

  return {
    status: 'matched',
    matchRecordId: matchRecord.id,
    ledgerEntryId: ledgerEntry.id,
    reason: result.reason,
  }
}
