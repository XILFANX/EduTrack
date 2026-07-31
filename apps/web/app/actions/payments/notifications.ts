'use server'

/**
 * EduTrack — Notification Dispatch + Dispute Escalation
 * Same 16 events as EstateTrack — EduTrack-specific body copy.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { sendNotification } from '@/lib/notifications'
import type { NotificationEvent } from '@edutrack/shared/payments/types'

export interface NotificationInput {
  event: NotificationEvent
  recipientIds: string[]
  blind: boolean
  obligationId?: string
  submissionId?: string
  disputeId?: string
  data: Record<string, unknown>
}

function buildNotificationContent(event: NotificationEvent, blind: boolean, data: Record<string, unknown>) {
  const amount = data.amount ? `${data.currency ?? 'KES'} ${Number(data.amount).toLocaleString('en-KE')}` : ''
  const period = (data.periodLabel as string | undefined) ?? ''

  switch (event) {
    case 'payee_rail_updated':
      return { title: 'Payment Details Updated', body: 'The school has updated their payment details. Please check the payments page.' }
    case 'payer_submission_received':
      return { title: 'Payment Submitted', body: 'Your payment has been submitted and is awaiting bursar verification.' }
    case 'submission_auto_matched':
      return { title: 'Payment Verified ✓', body: blind ? 'A payment has been verified.' : `${amount} fee payment for ${period} has been verified and posted.` }
    case 'unmatched_past_grace':
      return { title: 'Payment Not Yet Verified', body: 'Your submitted payment has not been verified. Please contact the school bursar.' }
    case 'unmatched_caretaker_nudge':
      return { title: 'Action Required', body: 'There is a pending payment verification. Please follow up with the school.' }
    case 'escalated_to_dispute':
      return { title: 'Payment Dispute Opened', body: 'A fee payment could not be automatically verified and has been escalated for review.' }
    case 'dispute_resolved':
      return { title: 'Payment Dispute Resolved', body: `Your fee dispute has been resolved. ${data.resolution_notes ?? ''}`.trim() }
    case 'partial_payment_posted':
      return { title: 'Partial Payment Posted', body: blind ? 'A partial payment has been posted.' : `${amount} partial fee payment posted. Balance: ${data.currency ?? 'KES'} ${Number(data.balanceAfter ?? 0).toLocaleString('en-KE')}.` }
    case 'overpayment_posted':
      return { title: 'Overpayment Recorded', body: blind ? 'An overpayment has been recorded.' : `Credit of ${data.currency ?? 'KES'} ${Number(data.creditAmount ?? 0).toLocaleString('en-KE')} will apply to next term.` }
    case 'new_obligation_generated':
      return { title: `Fee Due${period ? ` — ${period}` : ''}`, body: `A new fee obligation has been created${amount ? ` for ${amount}` : ''}.` }
    case 'obligation_due_soon':
      return { title: 'Fee Due Soon', body: `Your ${period} school fee${amount ? ` of ${amount}` : ''} is due on ${data.dueDate ?? 'soon'}.` }
    case 'obligation_overdue':
      return { title: 'Fee Overdue', body: `Your ${period} school fee is overdue. Please settle as soon as possible.` }
    case 'reference_code_reuse_attempt':
      return { title: 'Reference Code Already Used', body: 'The reference code you submitted has already been recorded. Please contact the bursar.' }
    case 'subscription_grace_started':
      return { title: 'Subscription Payment Due', body: 'Your EduTrack subscription payment is due. Access remains active during the grace period.' }
    case 'subscription_suspended':
      return { title: 'Subscription Suspended', body: 'Your EduTrack subscription has been suspended. Your data is safe — please settle to restore access.' }
    case 'subscription_reinstated':
      return { title: 'Subscription Reinstated ✓', body: 'Your EduTrack subscription payment has been verified. Full access restored.' }
    default:
      return { title: 'EduTrack Notification', body: 'You have a new update.' }
  }
}

function getNotificationUrl(event: NotificationEvent): string {
  const urlMap: Partial<Record<NotificationEvent, string>> = {
    payee_rail_updated: '/parent/payments',
    payer_submission_received: '/parent/payments',
    submission_auto_matched: '/parent/payments',
    unmatched_past_grace: '/parent/payments',
    escalated_to_dispute: '/parent/payments',
    dispute_resolved: '/parent/payments',
    partial_payment_posted: '/parent/payments',
    overpayment_posted: '/parent/payments',
    new_obligation_generated: '/parent/payments',
    obligation_due_soon: '/parent/payments',
    obligation_overdue: '/parent/payments',
    reference_code_reuse_attempt: '/parent/payments',
    subscription_grace_started: '/bursar/billing',
    subscription_suspended: '/bursar/billing',
    subscription_reinstated: '/bursar/billing',
  }
  return urlMap[event] ?? '/parent/dashboard'
}

export async function dispatchNotification(input: NotificationInput): Promise<void> {
  if (!input.recipientIds?.length) return
  const admin = createAdminClient() as any
  const { title, body } = buildNotificationContent(input.event, input.blind, input.data)

  await admin.from('notification_log').insert({
    event: input.event, recipient_ids: input.recipientIds,
    obligation_id: input.obligationId ?? null, submission_id: input.submissionId ?? null,
    dispute_id: input.disputeId ?? null, was_blind: input.blind,
    payload: { title, body, ...input.data },
  })

  await Promise.allSettled(
    input.recipientIds.map((id) =>
      sendNotification(id, { title, body, data: { url: getNotificationUrl(input.event), type: 'payment', event: input.event, obligationId: input.obligationId } }),
    ),
  )
}

export async function escalateUnmatchedSubmissions(): Promise<{ escalated: number }> {
  const admin = createAdminClient() as any
  const { data: configRow } = await admin.from('billing_config').select('value').eq('key', 'unmatched_grace_period_hours').single()
  const gracePeriodHours = configRow?.value ? Number(configRow.value) : 72
  const cutoff = new Date(Date.now() - gracePeriodHours * 60 * 60 * 1000).toISOString()

  const { data: staleSubs } = await admin.from('submissions').select('id, obligation_id, submitter_id')
    .eq('status', 'unmatched').eq('submitter_role', 'payer').lt('created_at', cutoff)
    .not('payment_rail', 'in', '("cash","cheque")')

  if (!staleSubs?.length) return { escalated: 0 }

  let escalated = 0
  for (const sub of staleSubs) {
    const { data: exists } = await admin.from('dispute_cases').select('id').eq('payer_submission_id', sub.id).single()
    if (exists) continue

    await admin.from('dispute_cases').insert({
      obligation_id: sub.obligation_id, payer_submission_id: sub.id,
      payee_submission_id: null, status: 'open',
      payer_evidence_revealed: false, payee_evidence_revealed: false,
    })
    await admin.from('submissions').update({ status: 'disputed' }).eq('id', sub.id)
    await dispatchNotification({ event: 'escalated_to_dispute', recipientIds: [sub.submitter_id], blind: true, obligationId: sub.obligation_id, submissionId: sub.id, data: {} })
    escalated++
  }
  return { escalated }
}
