'use server'

/**
 * EstateTrack — Payer Submission Action
 *
 * Used by TENANTS (rent_period) and LANDLORDS (estatetrack_subscription).
 * The payer submits their own transaction message/code, tagged to an obligation.
 *
 * BLINDNESS RULE: this action posts nothing visible to the payee.
 * The payee is only sent a generic nudge (no amount/name/unit revealed).
 */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { normalizeReferenceCode, isReferenceCodeValid, buildPayerDisplayRef } from '@edutrack/shared/payments/engine'
import type { PaymentRail } from '@edutrack/shared/payments/types'
import { dispatchNotification } from './notifications'
import { runMatchingEngine } from './match-engine'

interface PayerSubmissionInput {
  obligationId: string
  rawMessage: string | null
  referenceCode: string
  parsedAmount: number
  parsedCurrency: string
  parsedTransactionAt: string | null
  /** Counterparty as it appears in the user's message (name or phone) */
  parsedCounterparty?: string | null
  /** Narration / reference text from the message */
  parsedNarration?: string | null
  parsedFee?: number | null
  paymentRail: PaymentRail
}

export async function submitPayerPayment(input: PayerSubmissionInput) {
  const supabase = (await createClient()) as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient() as any

  // ── Validate the obligation belongs to this payer ──────────────────────────
  // EduTrack uses the 'users' table (not 'profiles').
  // Payer roles in EduTrack are: 'parent' (fee_term) and 'school' (edutrack_subscription).
  const { data: userProfile } = await supabase
    .from('users')
    .select('school_id, role')
    .eq('id', user.id)
    .single()

  const { data: obligation, error: oblErr } = await admin
    .from('obligations')
    .select('id, type, payer_account_id, payer_role, payee_account_id, payee_role, balance, status, currency')
    .eq('id', input.obligationId)
    .single()

  if (oblErr || !obligation) return { error: 'Obligation not found.' }
  if (obligation.status === 'settled') return { error: 'This obligation is already fully settled.' }
  if (obligation.status === 'cancelled') return { error: 'This obligation has been cancelled.' }

  // EduTrack payer validation:
  //   - Parent pays fee_term obligations → payer_account_id = user.id (auth UID)
  //   - School (bursar) pays edutrack_subscription → payer_account_id = school_id from users table
  const isParentPayer =
    obligation.payer_role === 'parent' && obligation.payer_account_id === user.id
  const isSchoolPayer =
    obligation.payer_role === 'school' && obligation.payer_account_id === userProfile?.school_id

  if (!isParentPayer && !isSchoolPayer) {
    return { error: 'You are not the payer for this obligation.' }
  }

  // ── Validate reference code ────────────────────────────────────────────────
  if (input.paymentRail !== 'cash' && input.paymentRail !== 'cheque') {
    const normalized = normalizeReferenceCode(input.referenceCode)
    if (!isReferenceCodeValid(normalized, input.paymentRail)) {
      return { error: `Invalid reference code format for ${input.paymentRail}. Please check and re-enter.` }
    }
    // Replay check: code already used in a MatchRecord?
    const { data: existingMatch } = await admin
      .from('submissions')
      .select('id')
      .eq('reference_code', normalized)
      .eq('status', 'matched')
      .limit(1)
      .single()

    if (existingMatch) {
      return { error: 'This reference code has already been recorded. If you believe this is an error, please contact support.' }
    }
  }

  // ── Build payer_display_ref based on obligation payer role (§3 spec) ─────────
  let payerDisplayRef: string | null = null
  if (obligation.payer_role === 'parent') {
    // Parent: use student admission reference if available, else user.id
    const { data: parentUser } = await admin
      .from('users')
      .select('full_name')
      .eq('id', obligation.payer_account_id)
      .single()
    payerDisplayRef = buildPayerDisplayRef({ role: 'parent', businessName: parentUser?.full_name })
  } else if (obligation.payer_role === 'school') {
    const { data: school } = await admin
      .from('schools')
      .select('name')
      .eq('id', obligation.payer_account_id)
      .single()
    payerDisplayRef = buildPayerDisplayRef({ role: 'school', businessName: school?.name })
  }

  // ── Create the Submission ──────────────────────────────────────────────────
  const { data: submission, error: subErr } = await admin
    .from('submissions')
    .insert({
      obligation_id: input.obligationId,        // payer side carries the obligation
      submitter_role: 'payer',
      submitter_id: user.id,
      payer_display_ref: payerDisplayRef,
      raw_message: input.rawMessage,
      reference_code: normalizeReferenceCode(input.referenceCode),
      parsed_amount: input.parsedAmount,
      parsed_currency: input.parsedCurrency || obligation.currency,
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

  if (subErr || !submission) {
    return { error: 'Failed to record your submission. Please try again.' }
  }

  // ── Notify payer: "Submitted — awaiting verification" ─────────────────────
  await dispatchNotification({
    event: 'payer_submission_received',
    recipientIds: [user.id],
    blind: true,   // No payee info in this notification
    obligationId: input.obligationId,
    submissionId: submission.id,
    data: { status: 'Submitted — awaiting verification' },
  })

  // ── Attempt auto-match immediately ────────────────────────────────────────
  await runMatchingEngine({ newSubmissionId: submission.id, obligationId: input.obligationId })

  revalidatePath('/parent/payments')
  revalidatePath('/bursar/billing')

  return { success: true, submissionId: submission.id }
}

// ── Cash/Cheque: manual confirmation path ─────────────────────────────────────
// Cash/cheque bypass the auto-match engine entirely.
// Creates a Submission that waits for explicit payee confirmation.

interface CashPaymentInput {
  obligationId: string
  amount: number
  currency: string
  method: 'cash' | 'cheque'
  notes?: string
}

export async function submitCashPayment(input: CashPaymentInput) {
  const supabase = (await createClient()) as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient() as any

  const { data: submission, error: subErr } = await admin
    .from('submissions')
    .insert({
      obligation_id: input.obligationId,
      submitter_role: 'payer',
      submitter_id: user.id,
      raw_message: input.notes ? `Cash/cheque payment note: ${input.notes}` : null,
      reference_code: `CASH_${input.obligationId.slice(0, 8).toUpperCase()}_${Date.now()}`,
      parsed_amount: input.amount,
      parsed_currency: input.currency,
      parsed_transaction_at: new Date().toISOString(),
      payment_rail: input.method,
      source: 'manual',
      status: 'unmatched',   // Waits for payee to confirm — never auto-matches
    })
    .select('id')
    .single()

  if (subErr || !submission) return { error: 'Failed to record payment.' }

  // Notify payer
  await dispatchNotification({
    event: 'payer_submission_received',
    recipientIds: [user.id],
    blind: true,
    obligationId: input.obligationId,
    submissionId: submission.id,
    data: { status: 'Cash/cheque submitted — awaiting bursar/landlord confirmation' },
  })

  revalidatePath('/tenant/payments')
  return { success: true, submissionId: submission.id }
}
