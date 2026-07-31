/**
 * packages/shared/payments/engine.ts
 *
 * The core reconciliation matching engine.
 *
 * DESIGN RULES (non-negotiable per spec):
 *   1. Pure function — no database calls. Takes two Submission objects, returns MatchResult.
 *   2. Exact reference code match required.
 *   3. Exact amount match required — no fuzzy matching.
 *   4. Time-window plausibility check — implausible gaps go to manual review, not silent rejection.
 *   5. Reference codes are permanently retired after a match — replay always rejected.
 *   6. Cash/cheque submissions bypass the auto-match engine entirely.
 *   7. Overpayment posts the full amount to the ledger; credit carried to next obligation.
 *   8. Partial payment leaves the obligation open with explicit arrears.
 */

import type {
  Submission,
  Obligation,
  MatchResult,
  MatchCandidate,
  LedgerEntryType,
  PaymentRail,
} from './types'

// ─── Configuration ────────────────────────────────────────────────────────────

/**
 * Maximum plausible gap (in hours) between payer and payee transaction timestamps.
 * Submissions with a gap beyond this go to manual review rather than auto-match.
 *
 * Real-world reasoning: M-Pesa sends both SMS messages within seconds of each other.
 * A 48-hour window accommodates weekends, network delays, and cross-bank settlement
 * times while still catching obviously stale/recycled codes.
 *
 * This value should be configurable per rail via the billing_config table in production.
 * The engine accepts an optional override so callers can pass the DB-driven value.
 */
export const DEFAULT_PLAUSIBILITY_WINDOW_HOURS = 48

/**
 * Payment rails that require manual confirmation — they never go through auto-matching.
 * Cash and cheque have no natural transaction reference code.
 */
export const MANUAL_RAILS: PaymentRail[] = ['cash', 'cheque']

/**
 * Minimum reference code length (characters) — below this, treat as unparseable.
 */
export const MIN_REFERENCE_CODE_LENGTH = 6

// ─── Reference Code Validation ───────────────────────────────────────────────

/**
 * Validates that a reference code is structurally plausible for the given rail.
 * This is a format gate — it does NOT verify the code actually exists at the provider.
 *
 * Rail-specific rules:
 *   - mpesa_paybill / mpesa_till: Safaricom codes are alphanumeric, 10 chars, e.g. "QJK23XF89H"
 *   - bank_transfer: Free-form but must be >= MIN_REFERENCE_CODE_LENGTH
 *   - other: Must be >= MIN_REFERENCE_CODE_LENGTH
 *   - cash / cheque: Always invalid — these must use the manual path
 */
export function isReferenceCodeValid(code: string, rail: PaymentRail): boolean {
  if (!code || typeof code !== 'string') return false
  const normalized = code.trim().toUpperCase()

  if (MANUAL_RAILS.includes(rail)) return false // Cash/cheque never have codes

  if (normalized.length < MIN_REFERENCE_CODE_LENGTH) return false

  if (rail === 'mpesa_paybill' || rail === 'mpesa_till') {
    // Safaricom M-Pesa codes: exactly 10 alphanumeric uppercase characters
    return /^[A-Z0-9]{10}$/.test(normalized)
  }

  // Bank transfer, other: any non-empty string of sufficient length
  return normalized.length >= MIN_REFERENCE_CODE_LENGTH
}

// ─── Plausibility Check ───────────────────────────────────────────────────────

/**
 * Checks if the time gap between two transaction timestamps is within the
 * plausibility window. Returns true if plausible (timestamps are close enough).
 *
 * If either timestamp is null, we cannot check — returns true (give benefit of doubt,
 * let the match proceed with a "timestamp unavailable" flag rather than blocking).
 */
export function isTimestampPlausible(
  payerTimestamp: string | null,
  payeeTimestamp: string | null,
  windowHours = DEFAULT_PLAUSIBILITY_WINDOW_HOURS,
): boolean {
  if (!payerTimestamp || !payeeTimestamp) return true // Cannot check; don't block

  const payerMs = new Date(payerTimestamp).getTime()
  const payeeMs = new Date(payeeTimestamp).getTime()

  if (isNaN(payerMs) || isNaN(payeeMs)) return true // Unparseable timestamps; don't block

  const gapHours = Math.abs(payerMs - payeeMs) / (1000 * 60 * 60)
  return gapHours <= windowHours
}

// ─── Ledger Effect Calculator ─────────────────────────────────────────────────

/**
 * Given an obligation's current balance and the amount being posted,
 * determines the ledger entry type and resulting credit balance.
 *
 * Rule:
 *   - Exact: settled
 *   - Less than balance: partial
 *   - More than balance: overpayment — credit = (amount - balance)
 */
export function calculateLedgerEffect(
  obligationBalance: number,
  postedAmount: number,
): {
  type: LedgerEntryType
  balanceAfter: number
  creditAmount: number
} {
  if (postedAmount === obligationBalance) {
    return { type: 'payment', balanceAfter: 0, creditAmount: 0 }
  }

  if (postedAmount < obligationBalance) {
    return {
      type: 'partial',
      balanceAfter: obligationBalance - postedAmount,
      creditAmount: 0,
    }
  }

  // Overpayment
  return {
    type: 'overpayment',
    balanceAfter: 0,
    creditAmount: postedAmount - obligationBalance,
  }
}

// ─── Core Matching Engine ─────────────────────────────────────────────────────

export interface MatchEngineOptions {
  /** Pass the DB-driven plausibility window (from billing_config). Falls back to DEFAULT. */
  plausibilityWindowHours?: number
  /** Set of reference codes already permanently retired (from existing MatchRecords). */
  retiredReferenceCodes: Set<string>
}

/**
 * The primary matching function.
 *
 * Takes one payer-side Submission and one candidate payee-side Submission,
 * plus the obligation being paid and the set of already-retired codes.
 *
 * Returns a MatchResult describing the outcome — the caller is responsible
 * for persisting the result to the database.
 *
 * This function has NO side effects.
 */
export function evaluateMatch(
  payer: Submission,
  payee: Submission,
  obligation: Obligation,
  options: MatchEngineOptions,
): MatchResult {
  const { plausibilityWindowHours = DEFAULT_PLAUSIBILITY_WINDOW_HOURS, retiredReferenceCodes } =
    options

  const candidate: MatchCandidate = { payer, payee }

  // Guard: cash/cheque never auto-match
  if (MANUAL_RAILS.includes(payer.payment_rail) || MANUAL_RAILS.includes(payee.payment_rail)) {
    return {
      status: 'no_counterpart',
      candidate,
      reason: 'Cash and cheque payments require manual confirmation — they are excluded from auto-matching.',
    }
  }

  // Guard: validate payer reference code format
  if (!isReferenceCodeValid(payer.reference_code, payer.payment_rail)) {
    return {
      status: 'unparseable',
      candidate,
      reason: `Payer reference code "${payer.reference_code}" failed format validation for rail "${payer.payment_rail}".`,
    }
  }

  // Guard: validate payee reference code format
  if (!isReferenceCodeValid(payee.reference_code, payee.payment_rail)) {
    return {
      status: 'unparseable',
      candidate,
      reason: `Payee reference code "${payee.reference_code}" failed format validation for rail "${payee.payment_rail}".`,
    }
  }

  // Normalize reference codes for comparison (uppercase, trimmed)
  const payerCode = payer.reference_code.trim().toUpperCase()
  const payeeCode = payee.reference_code.trim().toUpperCase()

  // Rule 1: Reference codes must match exactly
  if (payerCode !== payeeCode) {
    return {
      status: 'no_counterpart',
      candidate,
      reason: `Reference codes do not match: "${payerCode}" vs "${payeeCode}".`,
    }
  }

  // Rule 2: Replay protection — code must not already be retired
  if (retiredReferenceCodes.has(payerCode)) {
    return {
      status: 'replay_rejected',
      candidate,
      reason: `Reference code "${payerCode}" has already been used in an existing MatchRecord. Replay rejected.`,
    }
  }

  // Rule 3: Exact amount agreement required
  const payerAmount = Number(payer.parsed_amount)
  const payeeAmount = Number(payee.parsed_amount)

  if (Math.abs(payerAmount - payeeAmount) > 0.009) {
    // 0.009 tolerance handles floating-point rounding (e.g. 5000.00 vs 5000.001)
    return {
      status: 'amount_mismatch',
      candidate,
      reason: `Amount mismatch: payer claims ${payerAmount} ${payer.parsed_currency}, payee received ${payeeAmount} ${payee.parsed_currency}. Manual review required.`,
    }
  }

  // Rule 4: Currency agreement
  if (
    payer.parsed_currency.toUpperCase() !== payee.parsed_currency.toUpperCase()
  ) {
    return {
      status: 'amount_mismatch',
      candidate,
      reason: `Currency mismatch: payer ${payer.parsed_currency} vs payee ${payee.parsed_currency}. Manual review required.`,
    }
  }

  // Rule 5: Timestamp plausibility
  if (
    !isTimestampPlausible(
      payer.parsed_transaction_at,
      payee.parsed_transaction_at,
      plausibilityWindowHours,
    )
  ) {
    return {
      status: 'needs_review',
      candidate,
      reason: `Timestamp gap exceeds the ${plausibilityWindowHours}-hour plausibility window. Routing to manual review.`,
    }
  }

  // ✅ All rules passed — calculate ledger effect
  const ledgerEffect = calculateLedgerEffect(obligation.balance, payerAmount)

  return {
    status: 'matched',
    candidate,
    ledgerEffect: {
      type: ledgerEffect.type,
      amount: payerAmount,
      creditAmount: ledgerEffect.creditAmount,
      balanceAfter: ledgerEffect.balanceAfter,
    },
    reason: `Reference code "${payerCode}" matched. Amount: ${payerAmount} ${payer.parsed_currency}. Ledger effect: ${ledgerEffect.type}.`,
  }
}

// ─── Batch Matching ───────────────────────────────────────────────────────────

/**
 * Given a new Submission (either payer or payee side) and a pool of candidate
 * opposite-side submissions, finds the best match.
 *
 * Returns the first MatchResult with status = 'matched', or the last
 * non-matched result if no match found (for logging purposes).
 *
 * Callers pass in ALL existing payee/payer submissions for the relevant
 * reference code — the engine tries them all.
 */
export function findMatch(
  newSubmission: Submission,
  candidates: Submission[],
  obligation: Obligation,
  options: MatchEngineOptions,
): MatchResult {
  if (candidates.length === 0) {
    return {
      status: 'no_counterpart',
      candidate: null,
      reason: 'No opposite-side submissions found with the same reference code.',
    }
  }

  let lastResult: MatchResult = {
    status: 'no_counterpart',
    candidate: null,
    reason: 'No candidates evaluated.',
  }

  for (const candidate of candidates) {
    const payer = newSubmission.submitter_role === 'payer' ? newSubmission : candidate
    const payee = newSubmission.submitter_role === 'payee' ? newSubmission : candidate

    const result = evaluateMatch(payer, payee, obligation, options)
    lastResult = result

    if (result.status === 'matched') {
      return result
    }
  }

  return lastResult
}

// ─── Reference Code Normalization ────────────────────────────────────────────

/**
 * Normalizes a reference code to the canonical form used for all comparisons.
 * Callers should store the normalized form in the database.
 */
export function normalizeReferenceCode(code: string): string {
  return code.trim().toUpperCase()
}

// ─── Payer Display Reference Builder ─────────────────────────────────────────

/**
 * Builds the human-readable payer display reference used in submissions.
 * This identifies the payer without requiring them to enter extra context.
 *
 * EstateTrack tenant:     "Unit A3 · Palm Court"  (unit_number · property_name)
 * EduTrack parent:        "ADM-2024-001"           (admission_number)
 * EstateTrack landlord:   "Palm Court"             (property/business name)
 * EduTrack school:        "Nairobi Academy"        (school name)
 */
export function buildPayerDisplayRef(params: {
  role: 'tenant' | 'parent' | 'landlord' | 'school'
  unitNumber?: string
  propertyName?: string
  admissionNumber?: string
  businessName?: string
  schoolName?: string
}): string {
  switch (params.role) {
    case 'tenant':
      return [
        params.unitNumber ? `Unit ${params.unitNumber}` : null,
        params.propertyName,
      ]
        .filter(Boolean)
        .join(' · ') || 'Unknown Unit'

    case 'parent':
      return params.admissionNumber
        ? `Adm. ${params.admissionNumber}`
        : 'Unknown Student'

    case 'landlord':
      return params.businessName || params.propertyName || 'Unknown Landlord'

    case 'school':
      return params.schoolName || 'Unknown School'
  }
}
