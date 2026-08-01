/**
 * packages/shared/payments/engine.ts
 *
 * The core reconciliation matching engine.
 *
 * DESIGN RULES (non-negotiable per spec §2, §7):
 *   1. Pure function — no database calls. Takes Submission objects, returns MatchResult.
 *   2. Every signal has an explicit role, comparison rule, and consequence for all three
 *      states (agrees / disagrees / absent). Nothing is left to inference.
 *   3. Correctness over coverage — nothing incorrect is ever auto-posted (§13).
 *   4. Cash/cheque bypass the auto-match engine entirely (§12).
 *   5. Reference codes permanently retired after a match — replay always rejected (§12).
 *   6. Amount is always required — absence blocks entry to the engine (§3, §7.1).
 *   7. Corridor determines which signals are required vs. corroborating (§7.1).
 */

import type {
  Submission,
  Obligation,
  MatchResult,
  MatchCandidate,
  LedgerEntryType,
  PaymentRail,
  Corridor,
  CorridorMatchStrategy,
  SignalResult,
  SignalName,
  SignalRole,
  SignalState,
  SignalEvaluation,
  MatchEngineOptions,
  MatchResultStatus,
} from './types'

// ─── Strategy Default Time Windows (§7.1, configurable per Corridor) ──────────

/** Default time windows (hours) per corridor strategy. Overridden by corridor.time_window_hours. */
export const STRATEGY_TIME_WINDOWS: Record<CorridorMatchStrategy, number> = {
  exact: 0.5,         // ±30 minutes — M-Pesa sends both SMSes within seconds
  transform_pattern: 24, // ±24 hours — cross-network codes may take time
  unmapped: 72,       // ±72 hours — institutional reconciliation may be infrequent
}

/** Minimum confirmed pairs before promoting an unmapped corridor (§7.4). */
export const CORRIDOR_PROMOTION_THRESHOLD = 5

/**
 * Payment rails that require manual confirmation — no auto-matching.
 * Cash and cheque have no natural transaction reference code.
 */
export const MANUAL_RAILS: PaymentRail[] = ['cash', 'cheque']

/** Minimum reference code length (characters) — below this, treat as unparseable. */
export const MIN_REFERENCE_CODE_LENGTH = 6

// ─── Reference Code Validation ───────────────────────────────────────────────

/**
 * Validates that a reference code is structurally plausible for the given rail.
 * Rail-specific rules:
 *   - mpesa_paybill / mpesa_till: Safaricom codes — exactly 10 alphanumeric uppercase chars
 *   - bank_transfer / other: any non-empty string of sufficient length
 *   - cash / cheque: always false — these must use the manual path
 */
export function isReferenceCodeValid(code: string, rail: PaymentRail): boolean {
  if (!code || typeof code !== 'string') return false
  const normalized = code.trim().toUpperCase()
  if (MANUAL_RAILS.includes(rail)) return false
  if (normalized.length < MIN_REFERENCE_CODE_LENGTH) return false
  if (rail === 'mpesa_paybill' || rail === 'mpesa_till') {
    return /^[A-Z0-9]{10}$/.test(normalized)
  }
  return normalized.length >= MIN_REFERENCE_CODE_LENGTH
}

/** Normalizes a reference code to the canonical stored form. */
export function normalizeReferenceCode(code: string): string {
  return code.trim().toUpperCase()
}

// ─── Identity Normalization (§7.1 counterparty_identity) ─────────────────────

/**
 * Normalizes a counterparty string (name or phone number) for deterministic comparison.
 * Never uses fuzzy/similarity scoring — only exact token membership.
 *
 * Phone numbers: compare last 9 digits after stripping country code and leading zeros.
 * Names: split into whitespace-separated tokens; match passes only if every token
 *   in the shorter name appears as an exact token in the longer name, order-independent.
 */
export function normalizeIdentity(raw: string): { type: 'phone' | 'name'; normalized: string } {
  const stripped = raw.trim()

  // Detect phone number: mostly digits with optional +, spaces, hyphens
  const digitsOnly = stripped.replace(/[\s\-\(\)\+]/g, '')
  if (/^\d{7,15}$/.test(digitsOnly)) {
    // Keep last 9 digits (removes country codes like +254, 07XX → last 9)
    return { type: 'phone', normalized: digitsOnly.slice(-9) }
  }

  // Name: strip punctuation, normalize whitespace, uppercase, split to tokens
  const tokens = stripped
    .replace(/[^\w\s]/g, '')
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean)
  return { type: 'name', normalized: tokens.join(' ') }
}

/**
 * Compares two counterparty identity strings per §7.1 rules.
 * Returns 'agrees' | 'disagrees' | 'absent'.
 */
export function compareIdentity(
  a: string | null | undefined,
  b: string | null | undefined,
): SignalState {
  if (!a || !b) return 'absent'

  const normA = normalizeIdentity(a)
  const normB = normalizeIdentity(b)

  if (normA.type === 'phone' && normB.type === 'phone') {
    return normA.normalized === normB.normalized ? 'agrees' : 'disagrees'
  }

  if (normA.type === 'name' && normB.type === 'name') {
    const tokensA = normA.normalized.split(' ')
    const tokensB = normB.normalized.split(' ')
    const shorter = tokensA.length <= tokensB.length ? tokensA : tokensB
    const longer = tokensA.length <= tokensB.length ? tokensB : tokensA
    const allMatch = shorter.every((t) => longer.includes(t))
    return allMatch ? 'agrees' : 'disagrees'
  }

  // Mixed phone/name — treat as absent (cannot deterministically compare)
  return 'absent'
}

// ─── Narration Normalization (§7.1 narration/reference text) ─────────────────

/**
 * Normalizes a narration string for comparison.
 * Exact string match after trim and case-fold.
 */
export function normalizeNarration(raw: string | null | undefined): string | null {
  if (!raw) return null
  return raw.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function compareNarration(
  a: string | null | undefined,
  b: string | null | undefined,
): SignalState {
  const normA = normalizeNarration(a)
  const normB = normalizeNarration(b)
  if (!normA || !normB) return 'absent'
  return normA === normB ? 'agrees' : 'disagrees'
}

// ─── Plausibility Check (§7.1 time_window) ───────────────────────────────────

/**
 * Resolves the effective time window for a corridor (hours).
 * Uses the corridor's explicit override if set; otherwise the strategy default.
 */
export function resolveTimeWindow(corridor: Corridor): number {
  return corridor.time_window_hours ?? STRATEGY_TIME_WINDOWS[corridor.match_strategy]
}

/**
 * Returns 'agrees' | 'disagrees' | 'absent' for the time-window eligibility gate.
 * Per §7.1: absent timestamps skip the check without blocking (benefit of doubt).
 */
export function evaluateTimeWindow(
  payerTs: string | null,
  payeeTs: string | null,
  windowHours: number,
): SignalState {
  if (!payerTs || !payeeTs) return 'absent'
  const payerMs = new Date(payerTs).getTime()
  const payeeMs = new Date(payeeTs).getTime()
  if (isNaN(payerMs) || isNaN(payeeMs)) return 'absent'
  const gapHours = Math.abs(payerMs - payeeMs) / (1000 * 60 * 60)
  return gapHours <= windowHours ? 'agrees' : 'disagrees'
}

// ─── Amount Comparison (§7.1 amount + currency) ──────────────────────────────

/** Tolerance for floating-point rounding noise only — never for real amount differences. */
const FLOAT_EPSILON = 0.009

/**
 * Returns 'agrees' | 'disagrees' for amount signal.
 * Currency mismatch is always a strong non-match (disagrees), not a rounding issue.
 * Corridor tolerance for in-transit fees is applied only if explicitly set.
 */
export function compareAmount(
  payer: Submission,
  payee: Submission,
  corridor: Corridor,
): SignalState {
  if (corridor.cross_currency) {
    return 'agrees'
  }

  const payerCurrency = payer.parsed_currency
  const payeeCurrency = payee.parsed_currency
  if (payerCurrency.toUpperCase() !== payeeCurrency.toUpperCase()) return 'disagrees'

  const payerAmount = Number(payer.parsed_amount)
  const payeeAmount = Number(payee.parsed_amount)
  const payeeFee = payee.parsed_fee ? Number(payee.parsed_fee) : 0

  let effectivePayeeAmount = payeeAmount
  if (corridor.fee_model === 'fee_deducted_from_received_amount' && payeeFee > 0) {
    effectivePayeeAmount = payeeAmount + payeeFee
  }

  const diff = Math.abs(payerAmount - effectivePayeeAmount)
  if (diff <= FLOAT_EPSILON) return 'agrees'

  // Check corridor's evidence-set tolerance for in-transit fee deductions
  if (corridor.amount_tolerance_fraction !== null && corridor.amount_tolerance_fraction > 0) {
    const toleranceAmt = payerAmount * corridor.amount_tolerance_fraction
    if (diff <= toleranceAmt) return 'agrees'
  }

  return 'disagrees'
}

// ─── Ledger Effect Calculator (§7.3) ─────────────────────────────────────────

export function calculateLedgerEffect(
  obligationBalance: number,
  postedAmount: number,
): { type: LedgerEntryType; balanceAfter: number; creditAmount: number } {
  if (Math.abs(postedAmount - obligationBalance) <= FLOAT_EPSILON) {
    return { type: 'payment', balanceAfter: 0, creditAmount: 0 }
  }
  if (postedAmount < obligationBalance) {
    return { type: 'partial', balanceAfter: obligationBalance - postedAmount, creditAmount: 0 }
  }
  return {
    type: 'overpayment',
    balanceAfter: 0,
    creditAmount: postedAmount - obligationBalance,
  }
}

// ─── Signal Helper ────────────────────────────────────────────────────────────

function sig(
  signal: SignalName,
  role: SignalRole,
  state: SignalState,
  detail: string,
): SignalResult {
  return { signal, role, state, detail }
}

// ─── Core Signal Evaluation (§7.1, per corridor strategy) ────────────────────

/**
 * Evaluates all signals for a payer/payee pair on a given corridor.
 * Returns an explicit per-signal table and an overall outcome.
 *
 * This is the authoritative implementation of §7.1 — every signal rule,
 * every state, every consequence is encoded here. No inference.
 */
export function evaluateSignals(
  payer: Submission,
  payee: Submission,
  corridor: Corridor,
  retiredCodes: Set<string>,
): SignalEvaluation {
  const signals: SignalResult[] = []
  const strategy = corridor.match_strategy
  const windowHours = resolveTimeWindow(corridor)

  // ── 1. Amount (required on every corridor unless cross_currency) ────────────
  const payerAmount = Number(payer.parsed_amount)
  const payeeAmount = Number(payee.parsed_amount)
  const amountState = compareAmount(payer, payee, corridor)
  
  const amountRole: SignalRole = corridor.cross_currency ? 'corroborating' : 'required'
  
  let amountDetail = ''
  if (corridor.cross_currency) {
    amountDetail = `Cross-currency: payer ${payerAmount} ${payer.parsed_currency}, payee ${payeeAmount} ${payee.parsed_currency}`
  } else {
    amountDetail = amountState === 'agrees'
      ? `Amount agrees: ${payerAmount} ${payer.parsed_currency}`
      : `Amount mismatch: payer ${payerAmount} ${payer.parsed_currency} vs payee ${payeeAmount} ${payee.parsed_currency}`
  }

  signals.push(sig('amount', amountRole, amountState, amountDetail))

  // ── 2. Reference code (required on exact + transform; not used on unmapped) ──
  if (strategy === 'exact' || strategy === 'transform_pattern') {
    const payerCode = normalizeReferenceCode(payer.reference_code)
    const payeeCode = normalizeReferenceCode(payee.reference_code)

    // Replay check first
    if (retiredCodes.has(payerCode)) {
      signals.push(sig('reference_code', 'required', 'disagrees',
        `Code "${payerCode}" is permanently retired (already used in a MatchRecord).`))
    } else {
      let codeState: SignalState
      let codeDetail: string

      if (strategy === 'exact') {
        codeState = payerCode === payeeCode ? 'agrees' : 'disagrees'
        codeDetail = codeState === 'agrees'
          ? `Codes match exactly: "${payerCode}"`
          : `Codes differ: "${payerCode}" vs "${payeeCode}"`
      } else {
        // transform_pattern: apply corridor's transformation
        // For now, transformation_fn is a named key — exact match used as fallback
        // when no known transform applies yet (safe: will not false-match)
        const transformed = payerCode  // TODO: apply corridor.transformation_fn when implemented
        codeState = transformed === payeeCode ? 'agrees' : 'disagrees'
        codeDetail = codeState === 'agrees'
          ? `Codes match after transform: "${payerCode}" → "${transformed}"`
          : `Codes differ after transform: "${transformed}" vs "${payeeCode}"`
      }

      signals.push(sig('reference_code', 'required', codeState, codeDetail))
    }
  }

  // ── 3. Time-window (eligibility gate on every corridor) ────────────────────
  const twState = evaluateTimeWindow(
    payer.parsed_transaction_at,
    payee.parsed_transaction_at,
    windowHours,
  )
  signals.push(sig('time_window', 'eligibility_gate', twState,
    twState === 'agrees'
      ? `Timestamps within ${windowHours}h window`
      : twState === 'absent'
        ? 'One or both timestamps missing/unparseable — check skipped'
        : `Timestamp gap exceeds ${windowHours}h window`,
  ))

  // ── 4. Counterparty identity ─────────────────────────────────────────────────
  const identityRole: SignalRole = strategy === 'unmapped' ? 'required' : 'corroborating'
  const identityState = compareIdentity(payer.parsed_counterparty, payee.parsed_counterparty)
  signals.push(sig('counterparty_identity', identityRole, identityState,
    identityState === 'agrees'
      ? `Identity agrees: "${payer.parsed_counterparty ?? '—'}"`
      : identityState === 'absent'
        ? 'Counterparty identity missing/unparseable on one or both sides'
        : `Identity disagrees: payer side "${payer.parsed_counterparty ?? '—'}" vs payee side "${payee.parsed_counterparty ?? '—'}"`,
  ))

  // ── 5. Narration (corroborating only, every corridor) ──────────────────────
  const narrationState = compareNarration(payer.parsed_narration, payee.parsed_narration)
  if (narrationState !== 'absent') {
    signals.push(sig('narration', 'corroborating', narrationState,
      narrationState === 'agrees'
        ? `Narration agrees: "${normalizeNarration(payer.parsed_narration)}"`
        : `Narration disagrees (low-severity note): payer "${payer.parsed_narration}" vs payee "${payee.parsed_narration}"`,
    ))
  }

  // ── Determine outcome from signal table (§7.2) ──────────────────────────────
  const { outcome, reason } = resolveOutcome(signals, strategy)
  return { signals, outcome, reason }
}

/**
 * Resolves §7.2 outcome from the signal table.
 * Encodes all four outcome states explicitly.
 */
function resolveOutcome(
  signals: SignalResult[],
  strategy: CorridorMatchStrategy,
): { outcome: MatchResultStatus; reason: string } {
  const get = (name: SignalName) => signals.find((s) => s.signal === name)

  const amount = get('amount')
  const code = get('reference_code')
  const timeWindow = get('time_window')
  const identity = get('counterparty_identity')
  const narration = get('narration')

  // Amount is always required — if it disagrees and code also agreed, it's an anomaly
  if (amount?.state === 'disagrees') {
    if (code?.state === 'agrees') {
      // §7.1: Code+amount mismatch anomaly → flagged_for_review immediately
      return {
        outcome: 'flagged_for_review',
        reason: 'Code matched but amounts differ — data-entry error likely. Flagged for immediate review.',
      }
    }
    // No code backing → ordinary non-match, discard pairing
    return { outcome: 'no_counterpart', reason: amount.detail }
  }

  // Replay rejection (code signal marked disagrees with retirement message)
  if (code?.state === 'disagrees' && code.detail.includes('retired')) {
    return { outcome: 'replay_rejected', reason: code.detail }
  }

  if (strategy === 'exact' || strategy === 'transform_pattern') {
    // Required: code + amount both pass

    if (code?.state !== 'agrees') {
      return { outcome: 'no_counterpart', reason: code?.detail ?? 'Code did not match.' }
    }

    // Code agreed + amount agreed → check corroborating signals for anomalies

    // Time-window: if code agreed but time disagrees, it's an anomaly → flag
    if (timeWindow?.state === 'disagrees') {
      return {
        outcome: 'flagged_for_review',
        reason: `Code and amount match but timestamp gap is implausible. ${timeWindow.detail}`,
      }
    }

    // Identity on exact/transform: corroborating — disagreement triggers review
    if (identity?.state === 'disagrees') {
      return {
        outcome: 'flagged_for_review',
        reason: `Code and amount match but counterparty identity disagrees. ${identity.detail}`,
      }
    }

    // Narration disagreement: low-severity flag
    if (narration?.state === 'disagrees') {
      return {
        outcome: 'flagged_for_review',
        reason: `Code and amount match but narration disagrees (low-severity). ${narration.detail}`,
      }
    }

    // §7.2 outcome 1: all required pass, no corroborating disagreement
    return {
      outcome: 'matched',
      reason: `Code "${code.detail}" and amount agree. All signals clear.`,
    }
  }

  // strategy === 'unmapped': amount + time_window + identity all required
  const identityOk = identity?.state === 'agrees'
  const timeOk = timeWindow?.state !== 'disagrees' // absent = ok per §7.1
  const amountOk = amount?.state === 'agrees'

  // All three required signals pass
  if (amountOk && timeOk && identityOk) {
    // Check narration corroboration
    if (narration?.state === 'disagrees') {
      return {
        outcome: 'flagged_for_review',
        reason: 'Unmapped corridor: amount+time+identity all pass but narration disagrees.',
      }
    }
    return {
      outcome: 'matched',
      reason: 'Unmapped corridor: amount, time-window, and identity all agree.',
    }
  }

  // §7.1 unmapped — identity disagrees → normally discard, but check anomaly
  if (identity?.state === 'disagrees') {
    // If amount+time also strongly agreed → two-of-three → flag instead of discard
    if (amountOk && timeOk) {
      return {
        outcome: 'flagged_for_review',
        reason: `Unmapped corridor: amount and time agree but identity disagrees. ${identity.detail}`,
      }
    }
    return { outcome: 'no_counterpart', reason: identity.detail }
  }

  // Identity absent on unmapped corridor → insufficient required signals → manual review
  if (identity?.state === 'absent') {
    return {
      outcome: 'flagged_for_review',
      reason: 'Unmapped corridor: identity absent/unparseable — cannot auto-match, routing to manual review.',
    }
  }

  return { outcome: 'no_counterpart', reason: 'Insufficient required signals for this corridor.' }
}

// ─── Primary Match Evaluation ─────────────────────────────────────────────────

/**
 * Evaluates one payer/payee pair on the given corridor.
 * Returns a full MatchResult — no side effects.
 */
export function evaluateMatch(
  payer: Submission,
  payee: Submission,
  obligation: Obligation,
  options: MatchEngineOptions,
): MatchResult {
  const { retiredReferenceCodes, corridor } = options

  const candidate: MatchCandidate = { payer, payee }

  // Guard: cash/cheque never auto-match
  if (MANUAL_RAILS.includes(payer.payment_rail) || MANUAL_RAILS.includes(payee.payment_rail)) {
    return {
      status: 'no_counterpart',
      candidate,
      reason: 'Cash and cheque payments require manual confirmation.',
    }
  }

  // Guard: amount unparseable on either side — cannot enter engine (§3)
  const payerAmount = Number(payer.parsed_amount)
  const payeeAmount = Number(payee.parsed_amount)
  if (isNaN(payerAmount) || isNaN(payeeAmount)) {
    return {
      status: 'unparseable',
      candidate,
      reason: 'Amount could not be parsed on one or both submissions — routing to manual entry.',
    }
  }

  // Run full signal evaluation
  const signalEvaluation = evaluateSignals(payer, payee, corridor, retiredReferenceCodes)

  const baseResult: Omit<MatchResult, 'ledgerEffect'> = {
    status: signalEvaluation.outcome,
    candidate,
    signalEvaluation,
    corridorId: corridor.id,
    reason: signalEvaluation.reason,
  }

  if (signalEvaluation.outcome !== 'matched') {
    return baseResult as MatchResult
  }

  // Calculate ledger effect for matched outcome
  const ledgerEffect = calculateLedgerEffect(obligation.balance, payerAmount)

  return {
    ...baseResult,
    status: 'matched',
    ledgerEffect: {
      type: ledgerEffect.type,
      amount: payerAmount,
      creditAmount: ledgerEffect.creditAmount,
      balanceAfter: ledgerEffect.balanceAfter,
    },
  }
}

// ─── Batch Matching (findMatch) ───────────────────────────────────────────────

/**
 * Given a new Submission and a pool of candidate opposite-side submissions,
 * finds the best match by evaluating each candidate.
 *
 * Returns the first 'matched' result, or the last non-matched result (for logging).
 * A 'flagged_for_review' result is returned immediately — do not keep looking.
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
      reason: 'No opposite-side submissions found.',
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

    // Return immediately on definitive outcomes
    if (result.status === 'matched' || result.status === 'flagged_for_review') {
      return result
    }
  }

  return lastResult
}

// ─── Corridor Promotion Evidence (§7.4) ──────────────────────────────────────

/**
 * Determines if a corridor should be promoted from unmapped to transform_pattern
 * after recording a new confirmed pair.
 *
 * Called at the call site (server action) after a DisputeCase is resolved
 * confirming two submissions describe the same real transaction.
 * The caller increments confirmed_pair_count in the DB and passes the new count.
 */
export function shouldPromoteCorridor(
  confirmedPairCount: number,
  threshold: number,
): boolean {
  return confirmedPairCount >= threshold
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Builds the human-readable payer display reference stored on submissions.
 * EstateTrack tenant:   "Unit A3 · Palm Court"
 * EduTrack parent:      "Adm. 2024-001"
 * EstateTrack landlord: "Palm Court" (as subscription payer)
 * EduTrack school:      "Nairobi Academy" (as subscription payer)
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
      ].filter(Boolean).join(' · ') || 'Unknown Unit'
    case 'parent':
      return params.admissionNumber ? `Adm. ${params.admissionNumber}` : 'Unknown Student'
    case 'landlord':
      return params.businessName || params.propertyName || 'Unknown Landlord'
    case 'school':
      return params.schoolName || 'Unknown School'
  }
}

export function isReferenceCodeRetired(code: string, retiredCodes: Set<string>): boolean {
  return retiredCodes.has(normalizeReferenceCode(code))
}
