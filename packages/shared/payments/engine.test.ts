/**
 * packages/shared/payments/engine.test.ts
 *
 * Unit tests for the reconciliation matching engine.
 * Covers all §7 signal rules × 3 states, §7.2 outcomes, and §12 edge cases.
 *
 * Run with: npx vitest run
 */

import { describe, it, expect } from 'vitest'
import {
  evaluateMatch,
  evaluateSignals,
  findMatch,
  isReferenceCodeValid,
  calculateLedgerEffect,
  normalizeReferenceCode,
  buildPayerDisplayRef,
  compareIdentity,
  compareNarration,
  evaluateTimeWindow,
  compareAmount,
  shouldPromoteCorridor,
  STRATEGY_TIME_WINDOWS,
} from './engine'
import type { Submission, Obligation, MatchEngineOptions, Corridor } from './types'

// ─── Test Factories ───────────────────────────────────────────────────────────

function makeObligation(overrides: Partial<Obligation> = {}): Obligation {
  return {
    id: 'obl-001',
    type: 'rent_period',
    payer_account_id: 'tenant-001',
    payer_role: 'tenant',
    payee_account_id: 'landlord-001',
    payee_role: 'landlord',
    payer_display_ref: 'Unit A3 · Palm Court',
    amount_due: 15000,
    currency: 'KES',
    due_date: '2026-08-05',
    period_label: 'August 2026',
    status: 'open',
    balance: 15000,
    credit_balance: 0,
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z',
    ...overrides,
  }
}

function makeExactCorridor(overrides: Partial<Corridor> = {}): Corridor {
  return {
    id: 'corr-mpesa-exact',
    payer_rail: 'mobile_money',
    payee_rail: 'mobile_money',
    match_strategy: 'exact',
    transformation_fn: null,
    confirmed_pair_count: 10,
    promotion_threshold: 5,
    time_window_hours: null, // use strategy default = 0.5h
    amount_tolerance_fraction: null,
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z',
    ...overrides,
  }
}

function makeUnmappedCorridor(overrides: Partial<Corridor> = {}): Corridor {
  return {
    id: 'corr-unmapped',
    payer_rail: 'bank_transfer',
    payee_rail: 'mobile_money',
    match_strategy: 'unmapped',
    transformation_fn: null,
    confirmed_pair_count: 0,
    promotion_threshold: 5,
    time_window_hours: null, // use strategy default = 72h
    amount_tolerance_fraction: null,
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z',
    ...overrides,
  }
}

function makePayerSubmission(overrides: Partial<Submission> = {}): Submission {
  return {
    id: 'sub-payer-001',
    obligation_id: 'obl-001',
    submitter_role: 'payer',
    submitter_id: 'tenant-profile-001',
    payer_display_ref: 'Unit A3 · Palm Court',
    raw_message: 'QJK23XF89H Confirmed. KES 15,000.00 paid to PALM COURT PAYBILL on 1/8/26 at 10:30 AM.',
    reference_code: 'QJK23XF89H',
    parsed_amount: 15000,
    parsed_currency: 'KES',
    parsed_transaction_at: '2026-08-01T07:30:00Z',
    parsed_counterparty: '0712345678',
    parsed_narration: 'rent august 2026',
    parsed_fee: null,
    parsed_balance_after: null,
    payment_rail: 'mobile_money',
    source: 'manual',
    status: 'unmatched',
    created_at: '2026-08-01T07:31:00Z',
    matched_at: null,
    match_record_id: null,
    ...overrides,
  }
}

function makePayeeSubmission(overrides: Partial<Submission> = {}): Submission {
  return {
    id: 'sub-payee-001',
    obligation_id: null,
    submitter_role: 'payee',
    submitter_id: 'landlord-profile-001',
    payer_display_ref: null,
    raw_message: 'QJK23XF89H Received KES 15,000.00 from 0712345678 on 1/8/26 at 10:30 AM.',
    reference_code: 'QJK23XF89H',
    parsed_amount: 15000,
    parsed_currency: 'KES',
    parsed_transaction_at: '2026-08-01T07:30:30Z',
    parsed_counterparty: '0712345678',
    parsed_narration: 'rent august 2026',
    parsed_fee: null,
    parsed_balance_after: null,
    payment_rail: 'mobile_money',
    source: 'manual',
    status: 'unmatched',
    created_at: '2026-08-01T07:32:00Z',
    matched_at: null,
    match_record_id: null,
    ...overrides,
  }
}

function makeOptions(
  corridorOverrides: Partial<Corridor> = {},
  retiredCodes: Set<string> = new Set(),
): MatchEngineOptions {
  return {
    retiredReferenceCodes: retiredCodes,
    corridor: makeExactCorridor(corridorOverrides),
  }
}

// ─── §7.1 Signal: reference_code ─────────────────────────────────────────────

describe('§7.1 signal: reference_code', () => {
  it('agrees: exact same code on exact corridor → matched', () => {
    const r = evaluateMatch(makePayerSubmission(), makePayeeSubmission(), makeObligation(), makeOptions())
    expect(r.status).toBe('matched')
    const codeSig = r.signalEvaluation?.signals.find(s => s.signal === 'reference_code')
    expect(codeSig?.state).toBe('agrees')
  })

  it('agrees: case-insensitive code comparison', () => {
    const r = evaluateMatch(
      makePayerSubmission({ reference_code: 'qjk23xf89h' }),
      makePayeeSubmission({ reference_code: 'QJK23XF89H' }),
      makeObligation(),
      makeOptions({ time_window_hours: 1 }), // extend window so timestamps don't interfere
    )
    expect(r.status).toBe('matched')
  })

  it('disagrees: different codes on exact corridor → no_counterpart', () => {
    const r = evaluateMatch(
      makePayerSubmission({ reference_code: 'QJK23XF89H' }),
      makePayeeSubmission({ reference_code: 'ZZZZZZZZZZ' }),
      makeObligation(),
      makeOptions(),
    )
    expect(r.status).toBe('no_counterpart')
  })

  it('disagrees (retired): code already used → replay_rejected', () => {
    const r = evaluateMatch(
      makePayerSubmission(),
      makePayeeSubmission(),
      makeObligation(),
      makeOptions({}, new Set(['QJK23XF89H'])),
    )
    expect(r.status).toBe('replay_rejected')
  })

  it('absent: code not required on unmapped corridor (no code signal evaluated)', () => {
    const r = evaluateSignals(
      makePayerSubmission({ payment_rail: 'bank_transfer' }),
      makePayeeSubmission(),
      makeUnmappedCorridor(),
      new Set(),
    )
    const codeSig = r.signals.find(s => s.signal === 'reference_code')
    expect(codeSig).toBeUndefined()
  })
})

// ─── §7.1 Signal: amount ─────────────────────────────────────────────────────

describe('§7.1 signal: amount', () => {
  it('agrees: same amount and currency', () => {
    const r = evaluateMatch(makePayerSubmission(), makePayeeSubmission(), makeObligation(), makeOptions({ time_window_hours: 1 }))
    expect(r.status).toBe('matched')
    const amt = r.signalEvaluation?.signals.find(s => s.signal === 'amount')
    expect(amt?.state).toBe('agrees')
  })

  it('disagrees: different amounts — code agreed → flagged_for_review (anomaly)', () => {
    const r = evaluateMatch(
      makePayerSubmission({ parsed_amount: 15000 }),
      makePayeeSubmission({ parsed_amount: 14500 }),
      makeObligation(),
      makeOptions({ time_window_hours: 1 }),
    )
    expect(r.status).toBe('flagged_for_review')
  })

  it('disagrees: currency mismatch → no_counterpart (no code backing)', () => {
    const r = evaluateMatch(
      makePayerSubmission({ parsed_currency: 'KES', reference_code: 'AAAAAAAAA1' }),
      makePayeeSubmission({ parsed_currency: 'USD', reference_code: 'BBBBBBBBBB' }),
      makeObligation(),
      makeOptions(),
    )
    // Different codes AND currency mismatch → no_counterpart
    expect(r.status).toBe('no_counterpart')
  })

  it('disagrees: currency mismatch with same code → flagged_for_review', () => {
    const r = evaluateMatch(
      makePayerSubmission({ parsed_currency: 'KES' }),
      makePayeeSubmission({ parsed_currency: 'USD' }),
      makeObligation(),
      makeOptions({ time_window_hours: 1 }),
    )
    expect(r.status).toBe('flagged_for_review')
  })

  it('absent: unparseable amount → unparseable', () => {
    const r = evaluateMatch(
      makePayerSubmission({ parsed_amount: NaN }),
      makePayeeSubmission(),
      makeObligation(),
      makeOptions(),
    )
    expect(r.status).toBe('unparseable')
  })

  it('agrees within float epsilon (15000.00 vs 15000.001)', () => {
    const r = evaluateMatch(
      makePayerSubmission({ parsed_amount: 15000.00 }),
      makePayeeSubmission({ parsed_amount: 15000.001 }),
      makeObligation(),
      makeOptions({ time_window_hours: 1 }),
    )
    expect(r.status).toBe('matched')
  })

  it('agrees with corridor tolerance for in-transit fee (1%)', () => {
    // 15000 payer, 14850 payee (1% deducted as bank fee)
    const r = evaluateMatch(
      makePayerSubmission({ parsed_amount: 15000 }),
      makePayeeSubmission({ parsed_amount: 14850 }),
      makeObligation(),
      makeOptions({ time_window_hours: 1, amount_tolerance_fraction: 0.01 }),
    )
    expect(r.status).toBe('matched')
  })
})

// ─── §7.1 Signal: time_window ────────────────────────────────────────────────

describe('§7.1 signal: time_window', () => {
  it('agrees: timestamps seconds apart (exact corridor default 0.5h)', () => {
    const s = evaluateTimeWindow('2026-08-01T07:30:00Z', '2026-08-01T07:30:30Z', 0.5)
    expect(s).toBe('agrees')
  })

  it('agrees at boundary (0.5h exactly)', () => {
    const s = evaluateTimeWindow('2026-08-01T07:30:00Z', '2026-08-01T08:00:00Z', 0.5)
    expect(s).toBe('agrees')
  })

  it('disagrees: gap past window → flagged_for_review (code agreed)', () => {
    const r = evaluateMatch(
      makePayerSubmission({ parsed_transaction_at: '2026-08-01T07:30:00Z' }),
      makePayeeSubmission({ parsed_transaction_at: '2026-08-10T08:00:00Z' }),
      makeObligation(),
      makeOptions({ time_window_hours: 1 }),
    )
    expect(r.status).toBe('flagged_for_review')
    const tw = r.signalEvaluation?.signals.find(s => s.signal === 'time_window')
    expect(tw?.state).toBe('disagrees')
  })

  it('absent: null timestamps → absent, match not blocked', () => {
    const s = evaluateTimeWindow(null, null, 0.5)
    expect(s).toBe('absent')
    const r = evaluateMatch(
      makePayerSubmission({ parsed_transaction_at: null }),
      makePayeeSubmission({ parsed_transaction_at: null }),
      makeObligation(),
      makeOptions({ time_window_hours: 0.5 }),
    )
    expect(r.status).toBe('matched')
  })

  it('respects corridor-specific time window override', () => {
    expect(STRATEGY_TIME_WINDOWS.exact).toBe(0.5)
    expect(STRATEGY_TIME_WINDOWS.unmapped).toBe(72)
    // Custom corridor override
    const r = evaluateMatch(
      makePayerSubmission({ parsed_transaction_at: '2026-08-01T00:00:00Z' }),
      makePayeeSubmission({ parsed_transaction_at: '2026-08-02T00:00:00Z' }), // 24h apart
      makeObligation(),
      makeOptions({ time_window_hours: 48 }), // custom 48h window
    )
    expect(r.status).toBe('matched')
  })
})

// ─── §7.1 Signal: counterparty_identity ──────────────────────────────────────

describe('§7.1 signal: counterparty_identity', () => {
  it('agrees: same phone number (last 9 digits)', () => {
    expect(compareIdentity('0712345678', '+254712345678')).toBe('agrees')
  })

  it('agrees: same name, token-set match (subset)', () => {
    expect(compareIdentity('JOHN KAMAU', 'JOHN M KAMAU')).toBe('agrees')
  })

  it('disagrees: different phone numbers', () => {
    expect(compareIdentity('0712345678', '0799999999')).toBe('disagrees')
  })

  it('disagrees: names with no common tokens', () => {
    expect(compareIdentity('ALICE WANJIKU', 'BONIFACE OMONDI')).toBe('disagrees')
  })

  it('absent: null on either side', () => {
    expect(compareIdentity(null, '0712345678')).toBe('absent')
    expect(compareIdentity('0712345678', null)).toBe('absent')
    expect(compareIdentity(null, null)).toBe('absent')
  })

  it('on exact corridor: identity disagrees → flagged_for_review (corroborating)', () => {
    const r = evaluateMatch(
      makePayerSubmission({ parsed_counterparty: '0712345678' }),
      makePayeeSubmission({ parsed_counterparty: '0799999999' }), // different number
      makeObligation(),
      makeOptions({ time_window_hours: 1 }),
    )
    expect(r.status).toBe('flagged_for_review')
  })

  it('on exact corridor: identity absent → match proceeds (absent ≠ disagrees)', () => {
    const r = evaluateMatch(
      makePayerSubmission({ parsed_counterparty: null }),
      makePayeeSubmission({ parsed_counterparty: null }),
      makeObligation(),
      makeOptions({ time_window_hours: 1 }),
    )
    expect(r.status).toBe('matched')
  })

  it('on unmapped corridor: identity required — agrees → matched', () => {
    // Use evaluateSignals directly since evaluateMatch requires MatchEngineOptions with a corridor
    const eval_ = evaluateSignals(
      makePayerSubmission({ parsed_counterparty: '0712345678' }),
      makePayeeSubmission({ parsed_counterparty: '0712345678' }),
      makeUnmappedCorridor({ time_window_hours: 72 }),
      new Set(),
    )
    const identitySig = eval_.signals.find(s => s.signal === 'counterparty_identity')
    expect(identitySig?.role).toBe('required')
    expect(identitySig?.state).toBe('agrees')
    expect(eval_.outcome).toBe('matched')
  })

  it('on unmapped corridor: identity disagrees + amount and time agree → flagged_for_review', () => {
    const eval_ = evaluateSignals(
      makePayerSubmission({ parsed_counterparty: 'ALICE WANJIKU' }),
      makePayeeSubmission({ parsed_counterparty: 'BONIFACE OMONDI' }),
      makeUnmappedCorridor({ time_window_hours: 72 }),
      new Set(),
    )
    expect(eval_.outcome).toBe('flagged_for_review')
  })

  it('on unmapped corridor: identity absent → flagged_for_review (insufficient required signals)', () => {
    const eval_ = evaluateSignals(
      makePayerSubmission({ parsed_counterparty: null }),
      makePayeeSubmission({ parsed_counterparty: null }),
      makeUnmappedCorridor(),
      new Set(),
    )
    expect(eval_.outcome).toBe('flagged_for_review')
  })
})

// ─── §7.1 Signal: narration ───────────────────────────────────────────────────

describe('§7.1 signal: narration', () => {
  it('agrees: same narration text (case-folded, whitespace-normalized)', () => {
    expect(compareNarration('Rent August 2026', 'rent august 2026')).toBe('agrees')
  })

  it('disagrees: different narration text (corroborating → review, not discard)', () => {
    const r = evaluateMatch(
      makePayerSubmission({ parsed_narration: 'rent august 2026' }),
      makePayeeSubmission({ parsed_narration: 'school fees term 1' }),
      makeObligation(),
      makeOptions({ time_window_hours: 1 }),
    )
    expect(r.status).toBe('flagged_for_review')
  })

  it('absent: narration missing → signal skipped, match proceeds', () => {
    expect(compareNarration(null, null)).toBe('absent')
    const r = evaluateMatch(
      makePayerSubmission({ parsed_narration: null }),
      makePayeeSubmission({ parsed_narration: null }),
      makeObligation(),
      makeOptions({ time_window_hours: 1 }),
    )
    expect(r.status).toBe('matched')
  })
})

// ─── §7.2 All Outcome States ──────────────────────────────────────────────────

describe('§7.2 outcome states — exhaustive', () => {
  it('outcome 1: matched — all required pass, no corroborating disagreement', () => {
    const r = evaluateMatch(
      makePayerSubmission(),
      makePayeeSubmission(),
      makeObligation(),
      makeOptions({ time_window_hours: 1 }),
    )
    expect(r.status).toBe('matched')
    expect(r.signalEvaluation?.outcome).toBe('matched')
  })

  it('outcome 2/3: flagged_for_review — code+amount agree, identity disagrees', () => {
    const r = evaluateMatch(
      makePayerSubmission({ parsed_counterparty: '0711111111' }),
      makePayeeSubmission({ parsed_counterparty: '0799999999' }),
      makeObligation(),
      makeOptions({ time_window_hours: 1 }),
    )
    expect(r.status).toBe('flagged_for_review')
  })

  it('outcome 4: no_counterpart — code mismatch, no basis for pairing', () => {
    const r = evaluateMatch(
      makePayerSubmission({ reference_code: 'QJK23XF89H' }),
      makePayeeSubmission({ reference_code: 'ZZZZZZZZZZ' }),
      makeObligation(),
      makeOptions(),
    )
    expect(r.status).toBe('no_counterpart')
  })

  it('replay_rejected: code already retired', () => {
    const r = evaluateMatch(
      makePayerSubmission(),
      makePayeeSubmission(),
      makeObligation(),
      makeOptions({}, new Set(['QJK23XF89H'])),
    )
    expect(r.status).toBe('replay_rejected')
  })

  it('unparseable: NaN amount — cannot enter engine', () => {
    const r = evaluateMatch(
      makePayerSubmission({ parsed_amount: NaN }),
      makePayeeSubmission(),
      makeObligation(),
      makeOptions(),
    )
    expect(r.status).toBe('unparseable')
  })
})

// ─── §12 Edge Cases ───────────────────────────────────────────────────────────

describe('§12 edge cases', () => {
  it('cash payer → no_counterpart', () => {
    const r = evaluateMatch(
      makePayerSubmission({ payment_rail: 'cash' }),
      makePayeeSubmission(),
      makeObligation(),
      makeOptions(),
    )
    expect(r.status).toBe('no_counterpart')
  })

  it('cheque payee → no_counterpart', () => {
    const r = evaluateMatch(
      makePayerSubmission(),
      makePayeeSubmission({ payment_rail: 'cheque' }),
      makeObligation(),
      makeOptions(),
    )
    expect(r.status).toBe('no_counterpart')
  })

  it('partial payment → matched, partial ledger effect', () => {
    const r = evaluateMatch(
      makePayerSubmission({ parsed_amount: 7500 }),
      makePayeeSubmission({ parsed_amount: 7500 }),
      makeObligation({ balance: 15000 }),
      makeOptions({ time_window_hours: 1 }),
    )
    expect(r.status).toBe('matched')
    expect(r.ledgerEffect?.type).toBe('partial')
    expect(r.ledgerEffect?.balanceAfter).toBe(7500)
  })

  it('overpayment → matched, overpayment ledger effect with credit', () => {
    const r = evaluateMatch(
      makePayerSubmission({ parsed_amount: 17000 }),
      makePayeeSubmission({ parsed_amount: 17000 }),
      makeObligation({ balance: 15000 }),
      makeOptions({ time_window_hours: 1 }),
    )
    expect(r.status).toBe('matched')
    expect(r.ledgerEffect?.type).toBe('overpayment')
    expect(r.ledgerEffect?.balanceAfter).toBe(0)
    expect(r.ledgerEffect?.creditAmount).toBe(2000)
  })
})

// ─── Ledger Effect Calculator ─────────────────────────────────────────────────

describe('calculateLedgerEffect', () => {
  it('exact payment', () => {
    const r = calculateLedgerEffect(15000, 15000)
    expect(r.type).toBe('payment')
    expect(r.balanceAfter).toBe(0)
    expect(r.creditAmount).toBe(0)
  })

  it('partial payment', () => {
    const r = calculateLedgerEffect(15000, 7500)
    expect(r.type).toBe('partial')
    expect(r.balanceAfter).toBe(7500)
    expect(r.creditAmount).toBe(0)
  })

  it('overpayment', () => {
    const r = calculateLedgerEffect(15000, 17000)
    expect(r.type).toBe('overpayment')
    expect(r.balanceAfter).toBe(0)
    expect(r.creditAmount).toBe(2000)
  })
})

// ─── findMatch (batch) ────────────────────────────────────────────────────────

describe('findMatch', () => {
  it('finds matching candidate in a pool', () => {
    const r = findMatch(
      makePayerSubmission(),
      [
        makePayeeSubmission({ id: 'wrong-1', reference_code: 'AAAAAAAAAA' }),
        makePayeeSubmission({ id: 'wrong-2', reference_code: 'BBBBBBBBBB' }),
        makePayeeSubmission(),
      ],
      makeObligation(),
      makeOptions({ time_window_hours: 1 }),
    )
    expect(r.status).toBe('matched')
  })

  it('returns no_counterpart on empty pool', () => {
    const r = findMatch(makePayerSubmission(), [], makeObligation(), makeOptions())
    expect(r.status).toBe('no_counterpart')
  })

  it('returns flagged_for_review immediately when anomaly found (do not keep searching)', () => {
    const r = findMatch(
      makePayerSubmission({ parsed_counterparty: '0711111111' }),
      [makePayeeSubmission({ parsed_counterparty: '0799999999' })],
      makeObligation(),
      makeOptions({ time_window_hours: 1 }),
    )
    expect(r.status).toBe('flagged_for_review')
  })
})

// ─── isReferenceCodeValid ─────────────────────────────────────────────────────

describe('isReferenceCodeValid', () => {
  it('accepts valid M-Pesa codes (10 alphanumeric uppercase)', () => {
    expect(isReferenceCodeValid('QJK23XF89H', 'mobile_money')).toBe(true)
    expect(isReferenceCodeValid('AA1234567B', 'mobile_money')).toBe(true)
  })

  it('rejects M-Pesa codes that are too short or too long', () => {
    expect(isReferenceCodeValid('QJK23', 'mobile_money')).toBe(false)
    expect(isReferenceCodeValid('QJK23XF89HZZZ', 'mobile_money')).toBe(false)
  })

  it('rejects M-Pesa codes with special characters', () => {
    expect(isReferenceCodeValid('QJK23-F89H', 'mobile_money')).toBe(false)
  })

  it('rejects cash and cheque', () => {
    expect(isReferenceCodeValid('ANY123CODE', 'cash')).toBe(false)
    expect(isReferenceCodeValid('ANY123CODE', 'cheque')).toBe(false)
  })

  it('accepts bank transfer with sufficient length', () => {
    expect(isReferenceCodeValid('REF-2026-001234', 'bank_transfer')).toBe(true)
  })

  it('rejects empty string', () => {
    expect(isReferenceCodeValid('', 'mobile_money')).toBe(false)
  })
})

// ─── Utilities ────────────────────────────────────────────────────────────────

describe('normalizeReferenceCode', () => {
  it('uppercases and trims whitespace', () => {
    expect(normalizeReferenceCode('  qjk23xf89h  ')).toBe('QJK23XF89H')
  })
})

describe('buildPayerDisplayRef', () => {
  it('tenant: Unit + property name', () => {
    expect(buildPayerDisplayRef({ role: 'tenant', unitNumber: 'A3', propertyName: 'Palm Court' }))
      .toBe('Unit A3 · Palm Court')
  })

  it('tenant with no unit number', () => {
    expect(buildPayerDisplayRef({ role: 'tenant', propertyName: 'Palm Court' }))
      .toBe('Palm Court')
  })

  it('parent: admission number', () => {
    expect(buildPayerDisplayRef({ role: 'parent', admissionNumber: '2024-001' }))
      .toBe('Adm. 2024-001')
  })

  it('landlord: business name', () => {
    expect(buildPayerDisplayRef({ role: 'landlord', businessName: 'Palm Holdings Ltd' }))
      .toBe('Palm Holdings Ltd')
  })

  it('school: school name', () => {
    expect(buildPayerDisplayRef({ role: 'school', schoolName: 'Nairobi Academy' }))
      .toBe('Nairobi Academy')
  })
})

describe('shouldPromoteCorridor', () => {
  it('promotes when confirmed_pair_count >= threshold', () => {
    expect(shouldPromoteCorridor(5, 5)).toBe(true)
    expect(shouldPromoteCorridor(10, 5)).toBe(true)
  })

  it('does not promote below threshold', () => {
    expect(shouldPromoteCorridor(4, 5)).toBe(false)
    expect(shouldPromoteCorridor(0, 5)).toBe(false)
  })
})
