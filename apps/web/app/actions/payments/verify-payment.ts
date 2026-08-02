'use server'

/**
 * EduTrack — Payee (Blind) Submission + Cash Confirmation
 * Used by BURSARS verifying fee payments and EduTrack subscription payments.
 * Exact same blindness guarantees as EstateTrack.
 */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { normalizeReferenceCode, isReferenceCodeValid } from '@edutrack/shared/payments/engine'
import type { PaymentRail } from '@edutrack/shared/payments/types'
import { dispatchNotification } from './notifications'
import { runMatchingEngine } from './match-engine'

interface PayeeSubmissionInput {
  rawMessage: string | null
  referenceCode: string
  parsedAmount: number
  parsedCurrency: string
  parsedTransactionAt: string | null
  parsedCounterparty?: string | null
  parsedNarration?: string | null
  parsedFee?: number | null
  paymentRail: PaymentRail
}

export async function submitPayeeVerification(input: PayeeSubmissionInput) {
  const supabase = (await createClient()) as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient() as any

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['bursar', 'school_admin', 'platform_owner', 'admin', 'superadmin'].includes(profile.role)) {
    return { error: 'Only bursars and platform admins can submit payment verifications.' }
  }

  if (input.paymentRail !== 'cash' && input.paymentRail !== 'cheque') {
    const normalized = normalizeReferenceCode(input.referenceCode)
    if (!isReferenceCodeValid(normalized, input.paymentRail)) {
      return { error: `Invalid reference code format for ${input.paymentRail}.` }
    }
  }

  // CRITICAL: obligation_id is always null on payee side
  const { data: submission, error: subErr } = await admin
    .from('submissions')
    .insert({
      obligation_id: null,
      submitter_role: 'payee',
      submitter_id: user.id,
      raw_message: input.rawMessage,
      reference_code: normalizeReferenceCode(input.referenceCode),
      parsed_amount: input.parsedAmount,
      parsed_currency: input.parsedCurrency,
      parsed_transaction_at: input.parsedTransactionAt,
      parsed_counterparty: input.parsedCounterparty ?? null,
      parsed_narration: input.parsedNarration ?? null,
      parsed_fee: input.parsedFee ?? null,
      payment_rail: input.paymentRail,
      source: 'manual',
      status: 'unmatched',
    })
    .select('id')
    .single()

  if (subErr || !submission) return { error: 'Failed to record verification.' }

  const matchResult = await runMatchingEngine({
    newSubmissionId: submission.id,
    obligationId: null,
  })

  revalidatePath('/bursar/invoices')
  revalidatePath('/bursar')

  return {
    success: true,
    submissionId: submission.id,
    matched: matchResult.status === 'matched',
  }
}

// Batch
export async function submitBatchPayeeVerification(inputs: PayeeSubmissionInput[]) {
  const results = await Promise.allSettled(inputs.map(submitPayeeVerification))
  let submitted = 0, matched = 0
  const errors: string[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') {
      if (r.value.success) { submitted++; if (r.value.matched) matched++ }
      else if (r.value.error) errors.push(r.value.error)
    } else errors.push('Unexpected error.')
  }
  return { submitted, matched, errors }
}

// Cash/cheque confirmation by bursar
interface CashConfirmationInput {
  payerSubmissionId: string
  confirmedAmount: number
  notes?: string
}

export async function confirmCashPayment(input: CashConfirmationInput) {
  const supabase = (await createClient()) as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient() as any

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!['bursar', 'school_admin'].includes(profile?.role ?? '')) {
    return { error: 'Only bursars can confirm cash payments.' }
  }

  const { data: payerSub } = await admin
    .from('submissions')
    .select('id, obligation_id, parsed_amount, parsed_currency, payment_rail, status')
    .eq('id', input.payerSubmissionId)
    .eq('submitter_role', 'payer')
    .single()

  if (!payerSub) return { error: 'Payer submission not found.' }
  if (payerSub.status === 'matched') return { error: 'Already matched.' }
  if (!['cash', 'cheque'].includes(payerSub.payment_rail)) return { error: 'Only cash/cheque.' }

  const { data: obligation } = await admin
    .from('obligations')
    .select('id, balance, currency')
    .eq('id', payerSub.obligation_id)
    .single()

  if (!obligation) return { error: 'Obligation not found.' }

  const balanceAfter = Math.max(0, obligation.balance - input.confirmedAmount)
  const entryType = input.confirmedAmount >= obligation.balance ? 'payment' : 'partial'

  const { data: payeeSub } = await admin.from('submissions').insert({
    obligation_id: null,
    submitter_role: 'payee',
    submitter_id: user.id,
    raw_message: input.notes ?? 'Cash confirmed by bursar',
    reference_code: `CASH_CONFIRMED_${payerSub.id.slice(0, 8).toUpperCase()}`,
    parsed_amount: input.confirmedAmount,
    parsed_currency: obligation.currency,
    parsed_transaction_at: new Date().toISOString(),
    payment_rail: payerSub.payment_rail,
    source: 'manual',
    status: 'matched',
    matched_at: new Date().toISOString(),
  }).select('id').single()

  if (!payeeSub) return { error: 'Failed to record confirmation.' }

  const { data: matchRecord } = await admin.from('match_records').insert({
    obligation_id: obligation.id,
    payer_submission_id: payerSub.id,
    payee_submission_id: payeeSub.id,
    matched_amount: input.confirmedAmount,
    currency: obligation.currency,
    match_method: 'manual_override',
    override_reason: `Cash confirmed by bursar. ${input.notes ?? ''}`.trim(),
    override_by: user.id,
  }).select('id').single()

  if (!matchRecord) return { error: 'Failed to create match record.' }

  await admin.from('submissions')
    .update({ status: 'matched', matched_at: new Date().toISOString(), match_record_id: matchRecord.id })
    .in('id', [payerSub.id, payeeSub.id])

  await admin.from('ledger_entries').insert({
    obligation_id: obligation.id,
    match_record_id: matchRecord.id,
    entry_type: entryType,
    amount: input.confirmedAmount,
    currency: obligation.currency,
    balance_after: balanceAfter,
  })

  await admin.rpc('refresh_obligation_status', { p_obligation_id: obligation.id })

  const { data: ps } = await admin.from('submissions').select('submitter_id').eq('id', payerSub.id).single()
  await dispatchNotification({
    event: 'submission_auto_matched',
    recipientIds: [ps?.submitter_id, user.id].filter(Boolean) as string[],
    blind: false,
    obligationId: obligation.id,
    submissionId: payerSub.id,
    data: { amount: input.confirmedAmount, currency: obligation.currency, entryType, balanceAfter },
  })

  revalidatePath('/bursar/invoices')
  return { success: true }
}
