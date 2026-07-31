'use server'

/**
 * EduTrack — Payer Submission Action
 *
 * Used by PARENTS (fee_term) and SCHOOLS/BURSARS (edutrack_subscription).
 * Same two-witness model as EstateTrack — obligation_id carried on payer side only.
 */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { normalizeReferenceCode, isReferenceCodeValid } from '@edutrack/shared/payments/engine'
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
  paymentRail: PaymentRail
}

export async function submitPayerPayment(input: PayerSubmissionInput) {
  const supabase = (await createClient()) as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient() as any

  // Verify obligation belongs to this payer
  const { data: obligation, error: oblErr } = await admin
    .from('obligations')
    .select('id, type, payer_account_id, payer_role, payee_account_id, balance, status, currency')
    .eq('id', input.obligationId)
    .single()

  if (oblErr || !obligation) return { error: 'Obligation not found.' }
  if (obligation.status === 'settled') return { error: 'This obligation is already fully settled.' }
  if (obligation.status === 'cancelled') return { error: 'This obligation has been cancelled.' }

  // For fee_term: payer_account_id = parent user id (= auth.uid())
  // For edutrack_subscription: payer_account_id = school id (check via users.school_id)
  const isParentPayer = obligation.payer_role === 'parent' && obligation.payer_account_id === user.id
  const isSchoolPayer = obligation.payer_role === 'school' && (
    await admin.from('users').select('school_id').eq('id', user.id).single()
  ).data?.school_id === obligation.payer_account_id

  if (!isParentPayer && !isSchoolPayer) {
    return { error: 'You are not the payer for this obligation.' }
  }

  // Validate reference code
  if (input.paymentRail !== 'cash' && input.paymentRail !== 'cheque') {
    const normalized = normalizeReferenceCode(input.referenceCode)
    if (!isReferenceCodeValid(normalized, input.paymentRail)) {
      return { error: `Invalid reference code format for ${input.paymentRail}. Please check and re-enter.` }
    }
    const { data: existingMatch } = await admin
      .from('submissions')
      .select('id')
      .eq('reference_code', normalized)
      .eq('status', 'matched')
      .limit(1)
      .single()

    if (existingMatch) {
      return { error: 'This reference code has already been recorded. If you believe this is an error, please contact the school bursar.' }
    }
  }

  // Create Submission
  const { data: submission, error: subErr } = await admin
    .from('submissions')
    .insert({
      obligation_id: input.obligationId,
      submitter_role: 'payer',
      submitter_id: user.id,
      raw_message: input.rawMessage,
      reference_code: normalizeReferenceCode(input.referenceCode),
      parsed_amount: input.parsedAmount,
      parsed_currency: input.parsedCurrency || obligation.currency,
      parsed_transaction_at: input.parsedTransactionAt,
      payment_rail: input.paymentRail,
      source: 'manual',
      status: 'unmatched',
    })
    .select('id')
    .single()

  if (subErr || !submission) return { error: 'Failed to record your submission. Please try again.' }

  // Notify payer only — blind
  await dispatchNotification({
    event: 'payer_submission_received',
    recipientIds: [user.id],
    blind: true,
    obligationId: input.obligationId,
    submissionId: submission.id,
    data: { status: 'Submitted — awaiting bursar verification' },
  })

  // Trigger auto-match
  await runMatchingEngine({ newSubmissionId: submission.id, obligationId: input.obligationId })

  revalidatePath('/parent/payments')
  revalidatePath('/billing')

  return { success: true, submissionId: submission.id }
}

// ── Cash/Cheque: manual confirmation path ─────────────────────────────────────

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
      raw_message: input.notes ? `${input.method} note: ${input.notes}` : null,
      reference_code: `CASH_${input.obligationId.slice(0, 8).toUpperCase()}_${Date.now()}`,
      parsed_amount: input.amount,
      parsed_currency: input.currency,
      parsed_transaction_at: new Date().toISOString(),
      payment_rail: input.method,
      source: 'manual',
      status: 'unmatched',
    })
    .select('id')
    .single()

  if (subErr || !submission) return { error: 'Failed to record payment.' }

  await dispatchNotification({
    event: 'payer_submission_received',
    recipientIds: [user.id],
    blind: true,
    obligationId: input.obligationId,
    submissionId: submission.id,
    data: { status: 'Cash/cheque submitted — awaiting bursar confirmation' },
  })

  revalidatePath('/parent/payments')
  return { success: true, submissionId: submission.id }
}
