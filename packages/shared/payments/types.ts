/**
 * packages/shared/payments/types.ts
 *
 * Shared TypeScript types for the Payment Settlement Reconciliation Engine.
 * These are the four configurations of ONE engine:
 *   - rent_period:               Tenant (payer) → Landlord (payee)           [EstateTrack]
 *   - fee_term:                  Parent (payer)  → School/Bursar (payee)     [EduTrack]
 *   - estatetrack_subscription:  Landlord (payer) → EstateTrack (payee)      [EstateTrack]
 *   - edutrack_subscription:     School/Bursar (payer) → EduTrack (payee)   [EduTrack]
 */

// ─── Obligation ───────────────────────────────────────────────────────────────

export type ObligationType =
  | 'rent_period'
  | 'fee_term'
  | 'estatetrack_subscription'
  | 'edutrack_subscription'

export type ObligationStatus =
  | 'open'       // Amount outstanding > 0
  | 'partial'    // Some payments posted but balance remains
  | 'settled'    // Balance = 0, fully covered
  | 'overpaid'   // Credit balance > 0 (carries to next obligation)
  | 'cancelled'  // Voided (e.g. tenant moved out before period)

export interface Obligation {
  id: string
  type: ObligationType
  /** FK to tenant / parent / landlord / school — the account that owes */
  payer_account_id: string
  payer_role: PayerRole
  /** FK to landlord / school / platform — the account that receives */
  payee_account_id: string
  payee_role: PayeeRole
  /** Product-scoped account identifier (unit number, admission number, property name, etc.) */
  payer_display_ref: string
  amount_due: number
  currency: string
  due_date: string          // ISO date
  period_label: string      // e.g. "July 2026", "Term 1 2026", "August Subscription"
  status: ObligationStatus
  /** Running balance: amount_due minus sum of all posted LedgerEntries */
  balance: number
  /** Carry-forward credit from an overpaid prior obligation */
  credit_balance: number
  created_at: string
  updated_at: string
}

// ─── Roles ────────────────────────────────────────────────────────────────────

export type PayerRole = 'tenant' | 'parent' | 'landlord' | 'school'
export type PayeeRole = 'landlord' | 'school' | 'platform'
export type SubmitterRole = 'payer' | 'payee'

// ─── PayeeRailProfile ─────────────────────────────────────────────────────────

export type PaymentRail =
  | 'mpesa_paybill'
  | 'mpesa_till'
  | 'bank_transfer'
  | 'cash'
  | 'cheque'
  | 'other'

export interface PayeeRailProfile {
  id: string
  /** FK to landlords / schools / platform entity */
  payee_account_id: string
  payee_role: PayeeRole
  rail: PaymentRail
  /** Human-readable display: paybill number, account number, bank name + account, etc. */
  display_details: string
  /** Structured fields for copyable reference (e.g. { paybill: "123456", account: "RENT" }) */
  structured_details: Record<string, string>
  is_active: boolean
  /** Version counter — increments on every update, old versions preserved */
  version: number
  created_at: string
  /** Null on the current version; set when superseded */
  superseded_at: string | null
}

// ─── Submission ───────────────────────────────────────────────────────────────

export type SubmissionStatus =
  | 'unmatched'   // Created, awaiting a counterpart
  | 'matched'     // Paired with a counterpart and a MatchRecord created
  | 'expired'     // Past retention window without a match (payee-side)
  | 'disputed'    // Escalated to a DisputeCase

export type SubmissionSource =
  | 'manual'          // User entered the transaction message/code
  | 'gateway'         // Auto-created from a webhook (e.g. M-Pesa C2B)
  | 'legacy_import'   // Migrated from old payment record

export interface Submission {
  id: string
  obligation_id: string | null  // Required on payer-side; null on payee-side (blindness rule)
  submitter_role: SubmitterRole
  submitter_id: string          // profile_id / user_id
  /**
   * Composed payer identifier per role (§3 spec):
   *   tenant  → unit_property_number  (e.g. "A3·PalmCourt")
   *   parent  → student_admission_number
   *   landlord (as subscription payer) → property_name / business_name
   *   school  → school_name
   * Stored on the submission so matching never requires a join to infer identity.
   */
  payer_display_ref: string | null
  /** The raw text the user pasted (SMS, app notification, etc.) */
  raw_message: string | null
  /** Parsed from raw_message or entered directly */
  reference_code: string
  parsed_amount: number
  parsed_currency: string
  /** ISO timestamp of the transaction as stated in the message */
  parsed_transaction_at: string | null
  /** Counterparty name or number as it appears in the message (used for identity signal) */
  parsed_counterparty: string | null
  /** Narration/reference text if present in the message */
  parsed_narration: string | null
  /** In-transit fee amount if present in the message */
  parsed_fee: number | null
  /** Balance-after if present in the message */
  parsed_balance_after: number | null
  payment_rail: PaymentRail
  source: SubmissionSource
  status: SubmissionStatus
  created_at: string
  /** Set when this submission is retired by a MatchRecord */
  matched_at: string | null
  match_record_id: string | null
}

// ─── MatchRecord ──────────────────────────────────────────────────────────────

export type MatchMethod =
  | 'exact_code'           // reference_code exact match + amount
  | 'transform_pattern'    // Corridor-defined code transformation + amount
  | 'unmapped_fallback'    // Amount + time-window + identity (no code)
  | 'manual_override'      // Admin or payee forced a match
  | 'legacy_import'        // Synthetic match created during data migration

export interface MatchRecord {
  id: string
  obligation_id: string
  payer_submission_id: string
  payee_submission_id: string
  matched_amount: number
  currency: string
  match_method: MatchMethod
  /** Which corridor was resolved for this match */
  corridor_id: string | null
  /** Per-signal audit: signals that passed (agreed) */
  signals_passed: string[] | null
  /** Per-signal audit: signals absent or unparseable on one/both sides */
  signals_absent: string[] | null
  /** Per-signal audit: corroborating signals that actively disagreed (triggered flag) */
  signals_disagreed: string[] | null
  /** Required if match_method = 'manual_override' */
  override_reason: string | null
  /** profile_id of the person who triggered the override, if any */
  override_by: string | null
  created_at: string
}

// ─── LedgerEntry ─────────────────────────────────────────────────────────────

export type LedgerEntryType =
  | 'payment'      // Normal payment posted
  | 'partial'      // Partial payment
  | 'overpayment'  // Excess beyond obligation
  | 'credit_apply' // Credit from a prior overpayment applied
  | 'correction'   // Offsetting entry to fix an error (never edits original)

export interface LedgerEntry {
  id: string
  obligation_id: string
  match_record_id: string | null  // Null only for corrections / credits applied programmatically
  entry_type: LedgerEntryType
  amount: number
  currency: string
  /** Balance remaining on the obligation after this entry posts */
  balance_after: number
  created_at: string
  /** Immutable — never updated after creation. Corrections are new offsetting entries. */
  _immutable: true
}

// ─── DisputeCase ─────────────────────────────────────────────────────────────

export type DisputeStatus =
  | 'open'
  | 'resolved_matched'    // Resolved by admin forcing a match
  | 'resolved_no_match'   // Resolved by determining no match exists
  | 'resolved_credit'     // Resolved with a credit entry

export type DisputeOrigin =
  | 'timeout'        // No candidate found after 5d/7d timeout (§8)
  | 'flagged_pair'   // Candidate found but a required/corroborating signal disagreed (§7.2 outcomes 2+3)
  | 'legacy_import'  // Unresolvable during migration import

export interface DisputeCase {
  id: string
  obligation_id: string
  payer_submission_id: string | null
  payee_submission_id: string | null
  /** Distinguishes how this dispute was opened — different UX and notification copy per §8 */
  origin: DisputeOrigin
  /** Snapshot of the PayeeRailProfile at the time of dispute — immutable, not affected by later rail updates */
  rail_profile_snapshot: Record<string, unknown> | null
  status: DisputeStatus
  resolution_notes: string | null
  resolved_by: string | null         // profile_id
  resolved_at: string | null
  /** After escalation, both parties see each other's evidence — blindness lifted */
  payer_evidence_revealed: boolean
  payee_evidence_revealed: boolean
  created_at: string
}

// ─── CaretakerAssignment (EstateTrack only) ───────────────────────────────────

export interface CaretakerAssignment {
  id: string
  caretaker_profile_id: string
  unit_id: string
  landlord_id: string
  /** If true, caretaker gets generic unmatched-submission nudges for their assigned units */
  receives_nudge_notifications: boolean
  /** After this many hours past grace period expiry, nudge is sent */
  nudge_delay_hours: number
  granted_by: string            // profile_id of the landlord who created this
  granted_at: string
  revoked_at: string | null     // Null = currently active
}

// ─── Corridor ─────────────────────────────────────────────────────────────────

export type CorridorMatchStrategy =
  | 'exact'             // Code is shared verbatim by both parties — exact string match
  | 'transform_pattern' // A known transformation maps one side's code to the other
  | 'unmapped'          // No code relationship known — rely on amount + time + identity

export interface Corridor {
  id: string
  payer_rail: PaymentRail
  payee_rail: PaymentRail
  match_strategy: CorridorMatchStrategy
  /** Only set when match_strategy = 'transform_pattern' */
  transformation_fn: string | null  // Serialised as a named function key, applied in engine
  /** Number of manually confirmed pairs on this corridor (feeds promotion logic) */
  confirmed_pair_count: number
  /** How many confirmed pairs needed to promote unmapped → transform_pattern (Q4: 5) */
  promotion_threshold: number
  /**
   * Corridor-specific time window overrides (hours).
   * Null = use the strategy default from spec: exact=0.5, transform=24, unmapped=72
   */
  time_window_hours: number | null
  /**
   * Amount tolerance for in-transit fees (as a fraction, e.g. 0.01 = 1%).
   * Only set after explicit evidence (§7.4) — never defaulted.
   */
  amount_tolerance_fraction: number | null
  created_at: string
  updated_at: string
}

// ─── Signal Evaluation ────────────────────────────────────────────────────────

export type SignalName =
  | 'reference_code'
  | 'amount'
  | 'currency'
  | 'time_window'
  | 'counterparty_identity'
  | 'narration'

export type SignalState =
  | 'agrees'           // Signal is present on both sides and matches
  | 'disagrees'        // Signal is present on both sides and does not match
  | 'absent'           // Signal is missing or unparseable on one or both sides

export type SignalRole =
  | 'required'         // Failure blocks the match on this corridor
  | 'eligibility_gate' // Narrows candidates; does not match by itself
  | 'corroborating'    // Supplements required signals; disagreement triggers review

export interface SignalResult {
  signal: SignalName
  role: SignalRole
  state: SignalState
  detail: string  // Human-readable explanation for logging / dispute notes
}

export interface SignalEvaluation {
  signals: SignalResult[]
  outcome: MatchResultStatus
  reason: string
}

// ─── Matching Engine Types ────────────────────────────────────────────────────

export type MatchResultStatus =
  | 'matched'            // §7.2 outcome 1: all required signals pass, no corroborating disagreement
  | 'flagged_for_review' // §7.2 outcomes 2+3: plausible pair but a signal disagrees — open DisputeCase immediately
  | 'amount_mismatch'    // Code agreed but amounts differ (anomaly — §7.1 amount rule)
  | 'replay_rejected'    // Reference code already used in an existing MatchRecord
  | 'no_counterpart'     // §7.2 outcome 4/5: pairing discarded or no candidate found
  | 'unparseable'        // Amount missing — cannot enter auto-match engine at all (§3)

export interface MatchCandidate {
  payer: Submission
  payee: Submission
}

export interface MatchResult {
  status: MatchResultStatus
  candidate: MatchCandidate | null
  /** Signal-by-signal evaluation for auditability */
  signalEvaluation?: SignalEvaluation
  /** Which corridor was used */
  corridorId?: string
  /** Only present when status = 'matched' */
  ledgerEffect?: {
    type: LedgerEntryType
    amount: number
    /** Amount that goes to credit_balance if overpayment */
    creditAmount: number
    balanceAfter: number
  }
  /** Human-readable reason for non-match (for logging / dispute notes) */
  reason: string
}

export interface MatchEngineOptions {
  retiredReferenceCodes: Set<string>
  corridor: Corridor
}

// ─── Notification Events ──────────────────────────────────────────────────────

export type NotificationEvent =
  | 'payee_rail_updated'
  | 'payer_submission_received'
  | 'submission_auto_matched'
  | 'unmatched_past_grace'
  | 'unmatched_caretaker_nudge'
  | 'escalated_to_dispute'
  | 'dispute_resolved'
  | 'partial_payment_posted'
  | 'overpayment_posted'
  | 'new_obligation_generated'
  | 'obligation_due_soon'
  | 'obligation_overdue'
  | 'reference_code_reuse_attempt'
  | 'subscription_grace_started'
  | 'subscription_suspended'
  | 'subscription_reinstated'

export interface NotificationPayload {
  event: NotificationEvent
  /** profile_id(s) to notify */
  recipients: string[]
  /** Never reveal payer claim details to the payee before a match */
  blind: boolean
  data: Record<string, unknown>
}
