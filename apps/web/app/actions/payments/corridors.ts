'use server'

/**
 * EstateTrack — Corridor Server Actions
 *
 * Two responsibilities:
 *   1. resolveCorridor(payerRail, payeeRail) — DB-backed Corridor lookup.
 *      Called before every match attempt. Returns the matching Corridor row,
 *      or creates a new unmapped row if none exists (so the engine can always run).
 *
 *   2. recordManualResolutionPair(disputeId) — After a DisputeCase is resolved
 *      by confirming two submissions describe the same transaction, increments
 *      the confirmed_pair_count on the relevant Corridor. Used for §7.4 promotion.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { shouldPromoteCorridor, CORRIDOR_PROMOTION_THRESHOLD } from '@edutrack/shared/payments/engine'
import type { Corridor, PaymentRail } from '@edutrack/shared/payments/types'

/**
 * Resolves (or lazily creates) the Corridor for a given (payer_rail, payee_rail) pair.
 * Always returns a Corridor — if no seeded row exists, inserts an unmapped row so
 * the engine can run the unmapped path rather than erroring.
 */
export async function resolveCorridor(
  payerRail: PaymentRail,
  payeeRail: PaymentRail,
): Promise<Corridor> {
  const admin = createAdminClient() as any

  const { data: existing } = await admin
    .from('corridors')
    .select('*')
    .eq('payer_rail', payerRail)
    .eq('payee_rail', payeeRail)
    .single()

  if (existing) return existing as Corridor

  // Lazy creation: if this rail pair has never been seen, seed an unmapped row.
  // This is safe — unmapped never auto-matches on code alone; it still needs
  // amount + time + identity agreement.
  const { data: created, error } = await admin
    .from('corridors')
    .insert({
      payer_rail: payerRail,
      payee_rail: payeeRail,
      match_strategy: 'unmapped',
      confirmed_pair_count: 0,
      promotion_threshold: CORRIDOR_PROMOTION_THRESHOLD,
    })
    .select('*')
    .single()

  if (error || !created) {
    // Fallback: return an in-memory unmapped corridor so the engine can still run
    return {
      id: 'transient',
      payer_rail: payerRail,
      payee_rail: payeeRail,
      match_strategy: 'unmapped',
      transformation_fn: null,
      confirmed_pair_count: 0,
      promotion_threshold: CORRIDOR_PROMOTION_THRESHOLD,
      time_window_hours: null,
      amount_tolerance_fraction: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Corridor
  }

  return created as Corridor
}

/**
 * After a DisputeCase is manually resolved confirming the pair is legitimate,
 * increments confirmed_pair_count on the corridor.
 * If the threshold is reached, promotes the corridor from unmapped → transform_pattern
 * (triggering a notification to the operator to define the transformation_fn).
 */
export async function recordManualResolutionPair(disputeId: string): Promise<{
  promoted: boolean
  corridorId: string | null
  newCount: number
}> {
  const admin = createAdminClient() as any

  // Load the dispute to find the submissions' rails
  const { data: dispute } = await admin
    .from('dispute_cases')
    .select(`
      id,
      payer_submission:submissions!dispute_cases_payer_submission_id_fkey(payment_rail),
      payee_submission:submissions!dispute_cases_payee_submission_id_fkey(payment_rail)
    `)
    .eq('id', disputeId)
    .single()

  if (!dispute) return { promoted: false, corridorId: null, newCount: 0 }

  const payerRail = dispute.payer_submission?.payment_rail as PaymentRail | null
  const payeeRail = dispute.payee_submission?.payment_rail as PaymentRail | null

  if (!payerRail || !payeeRail) return { promoted: false, corridorId: null, newCount: 0 }

  // Find the corridor row
  const { data: corridor } = await admin
    .from('corridors')
    .select('id, confirmed_pair_count, promotion_threshold, match_strategy')
    .eq('payer_rail', payerRail)
    .eq('payee_rail', payeeRail)
    .single()

  if (!corridor) return { promoted: false, corridorId: null, newCount: 0 }

  const newCount = (corridor.confirmed_pair_count ?? 0) + 1
  const shouldPromote = shouldPromoteCorridor(newCount, corridor.promotion_threshold)
    && corridor.match_strategy === 'unmapped'

  await admin
    .from('corridors')
    .update({
      confirmed_pair_count: newCount,
      ...(shouldPromote ? { match_strategy: 'transform_pattern' } : {}),
    })
    .eq('id', corridor.id)

  return { promoted: shouldPromote, corridorId: corridor.id, newCount }
}
