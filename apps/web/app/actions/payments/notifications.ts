'use server'

/**
 * EstateTrack — Notification Dispatch
 *
 * Covers all 15 events from the notification matrix:
 *
 *  1.  payee_rail_updated              → Tenants of this landlord
 *  2.  payer_submission_received       → Payer only (blind — no payee info)
 *  3.  submission_auto_matched         → Both parties (blindness lifted)
 *  4.  unmatched_past_grace            → Payer only (generic — no payee claim revealed)
 *  5.  unmatched_caretaker_nudge       → Caretaker only (generic — no names/amounts)
 *  6.  escalated_to_dispute            → Both parties + platform
 *  7.  dispute_resolved                → Both parties
 *  8.  partial_payment_posted          → Both parties
 *  9.  overpayment_posted              → Both parties
 * 10.  new_obligation_generated        → Payer
 * 11.  obligation_due_soon             → Payer
 * 12.  obligation_overdue              → Payer + payee
 * 13.  reference_code_reuse_attempt    → Payer (security alert)
 * 14.  subscription_grace_started      → Landlord payer
 * 15.  subscription_suspended          → Landlord payer
 * 16.  subscription_reinstated         → Landlord payer
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { sendNotification } from '@/lib/notifications'
import type { NotificationEvent } from '@edutrack/shared/payments/types'

export interface NotificationInput {
  event: NotificationEvent
  recipientIds: string[]
  blind: boolean   // When true, payload must not reveal payer claim details
  obligationId?: string
  submissionId?: string
  disputeId?: string
  data: Record<string, unknown>
}

// ── Notification content map (all 16 events) ──────────────────────────────────
// Title and body are intentionally generic on blind notifications.

function buildNotificationContent(
  event: NotificationEvent,
  blind: boolean,
  data: Record<string, unknown>,
): { title: string; body: string } {
  const amount = data.amount ? `${data.currency ?? 'KES'} ${Number(data.amount).toLocaleString('en-KE')}` : ''
  const period = (data.periodLabel as string | undefined) ?? ''

  switch (event) {
    case 'payee_rail_updated':
      return {
        title: 'Payment Details Updated',
        body: 'Your landlord has updated their payment details. Please check the payments page before making your next payment.',
      }

    case 'payer_submission_received':
      return {
        title: 'Payment Submitted',
        body: 'Your payment has been submitted and is awaiting verification.',
      }

    case 'submission_auto_matched':
      return {
        title: 'Payment Verified ✓',
        body: blind
          ? 'A payment has been verified.'
          : `${amount} payment for ${period} has been verified and posted.`,
      }

    case 'unmatched_past_grace':
      return {
        title: 'Payment Not Yet Verified',
        body: 'Your submitted payment has not been verified yet. Please contact your landlord if this persists.',
      }

    case 'unmatched_caretaker_nudge':
      // Generic — never reveals payer name, amount, or unit
      return {
        title: 'Action Required',
        body: 'There is a pending payment verification for one of your assigned units. Please check with the landlord.',
      }

    case 'escalated_to_dispute':
      return {
        title: 'Payment Dispute Opened',
        body: 'A payment submission could not be automatically verified and has been escalated for review.',
      }

    case 'dispute_resolved':
      return {
        title: 'Payment Dispute Resolved',
        body: `Your payment dispute has been resolved. ${data.resolution_notes ? `Notes: ${data.resolution_notes}` : ''}`.trim(),
      }

    case 'partial_payment_posted':
      return {
        title: 'Partial Payment Posted',
        body: blind
          ? 'A partial payment has been posted.'
          : `${amount} partial payment for ${period} posted. Remaining balance: ${data.currency ?? 'KES'} ${Number(data.balanceAfter ?? 0).toLocaleString('en-KE')}.`,
      }

    case 'overpayment_posted':
      return {
        title: 'Overpayment Recorded',
        body: blind
          ? 'An overpayment has been recorded.'
          : `${amount} posted for ${period}. Credit of ${data.currency ?? 'KES'} ${Number(data.creditAmount ?? 0).toLocaleString('en-KE')} will be applied to your next obligation.`,
      }

    case 'new_obligation_generated':
      return {
        title: `New Payment Due${period ? ` — ${period}` : ''}`,
        body: `A new payment obligation has been created${amount ? ` for ${amount}` : ''}. Due: ${data.dueDate ?? 'see portal'}.`,
      }

    case 'obligation_due_soon':
      return {
        title: 'Payment Due Soon',
        body: `Your ${period} payment${amount ? ` of ${amount}` : ''} is due on ${data.dueDate ?? 'soon'}. Please submit your payment before the due date.`,
      }

    case 'obligation_overdue':
      return {
        title: 'Payment Overdue',
        body: `Your ${period} payment is overdue. Please settle as soon as possible.`,
      }

    case 'reference_code_reuse_attempt':
      return {
        title: 'Reference Code Already Used',
        body: 'The reference code you submitted has already been recorded against a previous payment. If you believe this is an error, please contact support.',
      }

    case 'subscription_grace_started':
      return {
        title: 'Subscription Payment Due',
        body: `Your EstateTrack subscription payment is due. You have a grace period to settle — your access remains active during this time.`,
      }

    case 'subscription_suspended':
      return {
        title: 'Subscription Suspended',
        body: 'Your EstateTrack subscription has been suspended due to a missed payment. Your data is safe — please settle to restore access.',
      }

    case 'subscription_reinstated':
      return {
        title: 'Subscription Reinstated ✓',
        body: 'Your EstateTrack subscription payment has been verified. Full access has been restored.',
      }

    default:
      return { title: 'EstateTrack Notification', body: 'You have a new update.' }
  }
}

// ── Main dispatch function ─────────────────────────────────────────────────────

export async function dispatchNotification(input: NotificationInput): Promise<void> {
  if (!input.recipientIds || input.recipientIds.length === 0) return

  const admin = createAdminClient() as any
  const { title, body } = buildNotificationContent(input.event, input.blind, input.data)

  // Log to notification_log (audit trail)
  await admin.from('notification_log').insert({
    event: input.event,
    recipient_ids: input.recipientIds,
    obligation_id: input.obligationId ?? null,
    submission_id: input.submissionId ?? null,
    dispute_id: input.disputeId ?? null,
    was_blind: input.blind,
    payload: { title, body, ...input.data },
  })

  // Push to all recipients
  await Promise.allSettled(
    input.recipientIds.map((recipientId) =>
      sendNotification(recipientId, {
        title,
        body,
        data: {
          url: getNotificationUrl(input.event),
          type: 'payment',
          event: input.event,
          obligationId: input.obligationId,
        },
      }),
    ),
  )
}

// ── Notification deep-link URLs ───────────────────────────────────────────────

function getNotificationUrl(event: NotificationEvent): string {
  const urlMap: Record<NotificationEvent, string> = {
    payee_rail_updated: '/tenant/payments',
    payer_submission_received: '/tenant/payments',
    submission_auto_matched: '/tenant/payments',
    unmatched_past_grace: '/tenant/payments',
    unmatched_caretaker_nudge: '/caretaker/dashboard',
    escalated_to_dispute: '/dashboard',
    dispute_resolved: '/dashboard',
    partial_payment_posted: '/tenant/payments',
    overpayment_posted: '/tenant/payments',
    new_obligation_generated: '/tenant/payments',
    obligation_due_soon: '/tenant/payments',
    obligation_overdue: '/tenant/payments',
    reference_code_reuse_attempt: '/tenant/payments',
    subscription_grace_started: '/billing',
    subscription_suspended: '/billing',
    subscription_reinstated: '/billing',
  }
  return urlMap[event] ?? '/dashboard'
}

// ── Dispute escalation cron helper ────────────────────────────────────────────
// Called by the API cron route: escalates unmatched submissions past grace period.

export async function escalateUnmatchedSubmissions(): Promise<{ escalated: number }> {
  const admin = createAdminClient() as any

  // Get grace period from billing_config (default: 72 hours)
  const { data: configRow } = await admin
    .from('billing_config')
    .select('value')
    .eq('key', 'unmatched_grace_period_hours')
    .single()

  const gracePeriodHours = configRow?.value ? Number(configRow.value) : 72
  const cutoff = new Date(Date.now() - gracePeriodHours * 60 * 60 * 1000).toISOString()

  // Find unmatched payer-side submissions past the grace period
  const { data: staleSubs } = await admin
    .from('submissions')
    .select('id, obligation_id, submitter_id, submitter_role')
    .eq('status', 'unmatched')
    .eq('submitter_role', 'payer')
    .lt('created_at', cutoff)
    .not('payment_rail', 'in', '("cash","cheque")')   // Cash/cheque handled separately

  if (!staleSubs || staleSubs.length === 0) return { escalated: 0 }

  let escalated = 0

  for (const sub of staleSubs) {
    // Check if a dispute already exists for this submission
    const { data: existingDispute } = await admin
      .from('dispute_cases')
      .select('id')
      .eq('payer_submission_id', sub.id)
      .single()

    if (existingDispute) continue

    // Create DisputeCase
    await admin.from('dispute_cases').insert({
      obligation_id: sub.obligation_id,
      payer_submission_id: sub.id,
      payee_submission_id: null,
      origin: 'timeout',           // §8: unmatched past grace window
      status: 'open',
      payer_evidence_revealed: false,
      payee_evidence_revealed: false,
    })

    // Update submission status
    await admin.from('submissions')
      .update({ status: 'disputed' })
      .eq('id', sub.id)

    // Notify payer (generic — no payee info)
    await dispatchNotification({
      event: 'escalated_to_dispute',
      recipientIds: [sub.submitter_id],
      blind: true,
      obligationId: sub.obligation_id,
      submissionId: sub.id,
      data: {},
    })

    // Check caretaker assignments and nudge if configured
    await notifyCaretakers(sub.obligation_id)

    escalated++
  }

  return { escalated }
}

// ── Caretaker nudge ───────────────────────────────────────────────────────────
// Generic — never reveals payer name, unit, or amount.

async function notifyCaretakers(obligationId: string | null): Promise<void> {
  if (!obligationId) return
  const admin = createAdminClient() as any

  // Get the unit tied to this obligation (via source_invoice_id → invoices → unit_id)
  const { data: obl } = await admin
    .from('obligations')
    .select('source_invoice_id')
    .eq('id', obligationId)
    .single()

  if (!obl?.source_invoice_id) return

  const { data: invoice } = await admin
    .from('invoices')
    .select('unit_id')
    .eq('id', obl.source_invoice_id)
    .single()

  if (!invoice?.unit_id) return

  // Find active caretakers for this unit who want nudge notifications
  const { data: assignments } = await admin
    .from('caretaker_assignments')
    .select('caretaker_profile_id, nudge_delay_hours')
    .eq('unit_id', invoice.unit_id)
    .eq('receives_nudge_notifications', true)
    .is('revoked_at', null)

  if (!assignments || assignments.length === 0) return

  for (const ca of assignments) {
    await dispatchNotification({
      event: 'unmatched_caretaker_nudge',
      recipientIds: [ca.caretaker_profile_id],
      blind: true,  // Never reveal anything specific to caretakers
      obligationId,
      data: {},
    })
  }
}
