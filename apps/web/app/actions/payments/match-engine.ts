'use server'

/**
 * EduTrack — Matching Engine Trigger
 * Identical logic to EstateTrack — revalidates EduTrack-specific paths.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { findMatch } from '@edutrack/shared/payments/engine'
import type { Submission, Obligation, MatchEngineOptions } from '@edutrack/shared/payments/types'
import { dispatchNotification } from './notifications'

interface MatchEngineInput {
  newSubmissionId: string
  obligationId: string | null
}

export interface MatchEngineResult {
  status: 'matched' | 'amount_mismatch' | 'replay_rejected' | 'needs_review' | 'no_counterpart' | 'unparseable' | 'error'
  matchRecordId?: string
  ledgerEntryId?: string
  reason: string
}

export async function runMatchingEngine(input: MatchEngineInput): Promise<MatchEngineResult> {
  const admin = createAdminClient() as any

  const { data: newSubRaw, error: subErr } = await admin
    .from('submissions').select('*').eq('id', input.newSubmissionId).single()

  if (subErr || !newSubRaw) return { status: 'error', reason: 'Could not load submission.' }

  const newSub = newSubRaw as Submission
  if (newSub.status === 'matched') return { status: 'no_counterpart', reason: 'Already matched.' }
  if (newSub.payment_rail === 'cash' || newSub.payment_rail === 'cheque') {
    return { status: 'no_counterpart', reason: 'Cash/cheque requires manual confirmation.' }
  }

  let obligation: Obligation | null = null

  if (newSub.submitter_role === 'payer' && newSub.obligation_id) {
    const { data: obl } = await admin.from('obligations').select('*').eq('id', newSub.obligation_id).single()
    obligation = obl as Obligation | null
  } else if (newSub.submitter_role === 'payee') {
    const { data: payerSubs } = await admin
      .from('submissions').select('obligation_id')
      .eq('reference_code', newSub.reference_code).eq('submitter_role', 'payer')
      .eq('status', 'unmatched').not('obligation_id', 'is', null).limit(1)
    if (payerSubs?.[0]) {
      const { data: obl } = await admin.from('obligations').select('*').eq('id', payerSubs[0].obligation_id).single()
      obligation = obl as Obligation | null
    }
  }

  if (!obligation) return { status: 'no_counterpart', reason: 'No matching obligation found.' }

  const oppositeRole = newSub.submitter_role === 'payer' ? 'payee' : 'payer'
  const { data: candidatesRaw } = await admin.from('submissions').select('*')
    .eq('reference_code', newSub.reference_code).eq('submitter_role', oppositeRole).eq('status', 'unmatched')

  const candidates = (candidatesRaw ?? []) as Submission[]
  const { data: retiredRaw } = await admin.rpc('get_retired_reference_codes')
  const retiredCodes = new Set<string>((retiredRaw ?? []).map((r: { reference_code: string }) => r.reference_code))

  const { data: configRow } = await admin.from('billing_config').select('value')
    .eq('key', 'match_plausibility_window_hours').single()
  const windowHours = configRow?.value ? Number(configRow.value) : undefined

  const options: MatchEngineOptions = {
    retiredReferenceCodes: retiredCodes,
    ...(windowHours ? { plausibilityWindowHours: windowHours } : {}),
  }

  const result = findMatch(newSub, candidates, obligation, options)

  if (result.status !== 'matched' || !result.candidate || !result.ledgerEffect) {
    if (result.status === 'amount_mismatch' || result.status === 'needs_review') {
      await admin.from('notification_log').insert({
        event: 'unmatched_past_grace', recipient_ids: [],
        obligation_id: obligation.id, submission_id: newSub.id,
        was_blind: true, payload: { reason: result.reason, engine_status: result.status },
      })
    }
    return { status: result.status as MatchEngineResult['status'], reason: result.reason }
  }

  const { payer, payee } = result.candidate
  const { type: entryType, amount, creditAmount, balanceAfter } = result.ledgerEffect

  const { data: matchRecord, error: mrErr } = await admin.from('match_records').insert({
    obligation_id: obligation.id,
    payer_submission_id: payer.id,
    payee_submission_id: payee.id,
    matched_amount: amount,
    currency: payer.parsed_currency,
    match_method: 'auto_code_match',
  }).select('id').single()

  if (mrErr || !matchRecord) return { status: 'error', reason: 'Failed to create MatchRecord.' }

  await admin.from('submissions').update({
    status: 'matched', matched_at: new Date().toISOString(), match_record_id: matchRecord.id,
  }).in('id', [payer.id, payee.id])

  const { data: ledgerEntry, error: leErr } = await admin.from('ledger_entries').insert({
    obligation_id: obligation.id, match_record_id: matchRecord.id,
    entry_type: entryType, amount, currency: payer.parsed_currency, balance_after: balanceAfter,
  }).select('id').single()

  if (leErr || !ledgerEntry) return { status: 'error', reason: 'Failed to post LedgerEntry.' }

  if (entryType === 'overpayment' && creditAmount > 0) {
    await admin.from('obligations').update({ credit_balance: creditAmount }).eq('id', obligation.id)
  }

  await admin.rpc('refresh_obligation_status', { p_obligation_id: obligation.id })

  const event = entryType === 'partial' ? 'partial_payment_posted'
    : entryType === 'overpayment' ? 'overpayment_posted'
    : 'submission_auto_matched'

  await dispatchNotification({
    event, recipientIds: [payer.submitter_id, payee.submitter_id],
    blind: false, obligationId: obligation.id, submissionId: payer.id,
    data: { amount, currency: payer.parsed_currency, entryType, balanceAfter, creditAmount: creditAmount > 0 ? creditAmount : undefined, periodLabel: obligation.period_label },
  })

  return { status: 'matched', matchRecordId: matchRecord.id, ledgerEntryId: ledgerEntry.id, reason: result.reason }
}
