/**
 * packages/shared/payments/engine.test.ts
 *
 * Unit tests for the reconciliation matching engine.
 * Covers all §7 matching rules and §12 edge cases from the spec.
 *
 * Run with: npx vitest run  (or jest if configured)
 */

import { describe, it, expect } from 'vitest'
import {
  evaluateMatch,
  findMatch,
  isReferenceCodeValid,
  isTimestampPlausible,
  calculateLedgerEffect,
  normalizeReferenceCode,
  buildPayerDisplayRef,
  DEFAULT_PLAUSIBILITY_WINDOW_HOURS,
} from './engine'
import type { Submission, Obligation, MatchEngineOptions } from './types'

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

function makePayerSubmission(overrides: Partial<Submission> = {}): Submission {
  return {
    id: 'sub-payer-001',
    obligation_id: 'obl-001',
    submitter_role: 'payer',
    submitter_id: 'tenant-profile-001',
    raw_message: 'QJK23XF89H Confirmed. KES 15,000.00 paid to PALM COURT PAYBILL on 1/8/26 at 10:30 AM.',
    reference_code: 'QJK23XF89H',
    parsed_amount: 15000,
    parsed_currency: 'KES',
    parsed_transaction_at: '2026-08-01T07:30:00Z',
    payment_rail: 'mpesa_paybill',
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
    obligation_id: null, // Payee side is always blind — no obligation ID
    submitter_role: 'payee',
    submitter_id: 'landlord-profile-001',
    raw_message: 'QJK23XF89H Received KES 15,000.00 from 0712345678 on 1/8/26 at 10:30 AM.',
    reference_code: 'QJK23XF89H',
    parsed_amount: 15000,
    parsed_currency: 'KES',
    parsed_transaction_at: '2026-08-01T07:30:30Z',
    payment_rail: 'mpesa_paybill',
    source: 'manual',
    status: 'unmatched',
    created_at: '2026-08-01T07:32:00Z',
    matched_at: null,
    match_record_id: null,
    ...overrides,
  }
}

function makeOptions(overrides: Partial<MatchEngineOptions> = {}): MatchEngineOptions {
  return {
    retiredReferenceCodes: new Set(),
    plausibilityWindowHours: DEFAULT_PLAUSIBILITY_WINDOW_HOURS,
    ...overrides,
  }
}

// ─── Reference Code Validation ────────────────────────────────────────────────

describe('isReferenceCodeValid', () => {
  it('accepts a valid M-Pesa code (10 alphanumeric uppercase)', () => {
    expect(isReferenceCodeValid('QJK23XF89H', 'mpesa_paybill')).toBe(true)
    expect(isReferenceCodeValid('AA1234567B', 'mpesa_till')).toBe(true)
  })

  it('rejects M-Pesa codes that are too short', () => {
    expect(isReferenceCodeValid('QJK23', 'mpesa_paybill')).toBe(false)
  })

  it('rejects M-Pesa codes that are too long', () => {
    expect(isReferenceCodeValid('QJK23XF89HZZZ', 'mpesa_paybill')).toBe(false)
  })

  it('rejects M-Pesa codes with special characters', () => {
    expect(isReferenceCodeValid('QJK23-F89H', 'mpesa_paybill')).toBe(false)
  })

  it('rejects cash and cheque — they have no reference codes', () => {
    expect(isReferenceCodeValid('ANY123CODE', 'cash')).toBe(false)
    expect(isReferenceCodeValid('ANY123CODE', 'cheque')).toBe(false)
  })

  it('accepts bank transfer with sufficient length', () => {
    expect(isReferenceCodeValid('REF-2026-001234', 'bank_transfer')).toBe(true)
  })

  it('rejects bank transfer codes that are too short', () => {
    expect(isReferenceCodeValid('AB', 'bank_transfer')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isReferenceCodeValid('', 'mpesa_paybill')).toBe(false)
  })
})

// ─── Timestamp Plausibility ───────────────────────────────────────────────────

describe('isTimestampPlausible', () => {
  it('passes when timestamps are seconds apart', () => {
    expect(
      isTimestampPlausible('2026-08-01T07:30:00Z', '2026-08-01T07:30:30Z'),
    ).toBe(true)
  })

  it('passes at exactly the window boundary (48h)', () => {
    expect(
      isTimestampPlausible('2026-08-01T07:30:00Z', '2026-08-03T07:30:00Z', 48),
    ).toBe(true)
  })

  it('fails one second past the window (48h + 1s)', () => {
    expect(
      isTimestampPlausible('2026-08-01T07:30:00Z', '2026-08-03T07:30:01Z', 48),
    ).toBe(false)
  })

  it('passes when either timestamp is null (cannot check, give benefit of doubt)', () => {
    expect(isTimestampPlausible(null, '2026-08-01T07:30:00Z')).toBe(true)
    expect(isTimestampPlausible('2026-08-01T07:30:00Z', null)).toBe(true)
    expect(isTimestampPlausible(null, null)).toBe(true)
  })

  it('passes when timestamps are unparseable (give benefit of doubt)', () => {
    expect(isTimestampPlausible('not-a-date', '2026-08-01T07:30:00Z')).toBe(true)
  })
})

// ─── Ledger Effect Calculator ─────────────────────────────────────────────────

describe('calculateLedgerEffect', () => {
  it('exact payment: type = payment, balanceAfter = 0, creditAmount = 0', () => {
    const result = calculateLedgerEffect(15000, 15000)
    expect(result.type).toBe('payment')
    expect(result.balanceAfter).toBe(0)
    expect(result.creditAmount).toBe(0)
  })

  it('partial payment: type = partial, balanceAfter = remaining, creditAmount = 0', () => {
    const result = calculateLedgerEffect(15000, 7500)
    expect(result.type).toBe('partial')
    expect(result.balanceAfter).toBe(7500)
    expect(result.creditAmount).toBe(0)
  })

  it('overpayment: type = overpayment, balanceAfter = 0, creditAmount = excess', () => {
    const result = calculateLedgerEffect(15000, 17000)
    expect(result.type).toBe('overpayment')
    expect(result.balanceAfter).toBe(0)
    expect(result.creditAmount).toBe(2000)
  })
})

// ─── Core: evaluateMatch ──────────────────────────────────────────────────────

describe('evaluateMatch — §7 happy path', () => {
  it('exact match: same reference code, same amount → matched', () => {
    const result = evaluateMatch(
      makePayerSubmission(),
      makePayeeSubmission(),
      makeObligation(),
      makeOptions(),
    )
    expect(result.status).toBe('matched')
    expect(result.ledgerEffect?.type).toBe('payment')
    expect(result.ledgerEffect?.balanceAfter).toBe(0)
    expect(result.ledgerEffect?.creditAmount).toBe(0)
  })

  it('is case-insensitive on reference codes', () => {
    const result = evaluateMatch(
      makePayerSubmission({ reference_code: 'qjk23xf89h' }),
      makePayeeSubmission({ reference_code: 'QJK23XF89H' }),
      makeObligation(),
      makeOptions(),
    )
    expect(result.status).toBe('matched')
  })
})

describe('evaluateMatch — §7 non-match scenarios', () => {
  it('reference code mismatch → no_counterpart', () => {
    const result = evaluateMatch(
      makePayerSubmission({ reference_code: 'QJK23XF89H' }),
      makePayeeSubmission({ reference_code: 'ZZZZZZZZZZ' }),
      makeObligation(),
      makeOptions(),
    )
    expect(result.status).toBe('no_counterpart')
  })

  it('amount mismatch → amount_mismatch', () => {
    const result = evaluateMatch(
      makePayerSubmission({ parsed_amount: 15000 }),
      makePayeeSubmission({ parsed_amount: 14500 }),
      makeObligation(),
      makeOptions(),
    )
    expect(result.status).toBe('amount_mismatch')
  })

  it('currency mismatch → amount_mismatch', () => {
    const result = evaluateMatch(
      makePayerSubmission({ parsed_currency: 'KES' }),
      makePayeeSubmission({ parsed_currency: 'USD' }),
      makeObligation(),
      makeOptions(),
    )
    expect(result.status).toBe('amount_mismatch')
  })

  it('timestamp gap > window → needs_review', () => {
    const result = evaluateMatch(
      makePayerSubmission({ parsed_transaction_at: '2026-08-01T07:30:00Z' }),
      makePayeeSubmission({ parsed_transaction_at: '2026-08-10T07:30:01Z' }), // 9 days apart
      makeObligation(),
      makeOptions({ plausibilityWindowHours: 48 }),
    )
    expect(result.status).toBe('needs_review')
  })
})

// ─── §12 Edge Cases ───────────────────────────────────────────────────────────

describe('evaluateMatch — §12 edge cases', () => {
  it('replay attack: reference code already in a MatchRecord → replay_rejected', () => {
    const result = evaluateMatch(
      makePayerSubmission(),
      makePayeeSubmission(),
      makeObligation(),
      makeOptions({ retiredReferenceCodes: new Set(['QJK23XF89H']) }),
    )
    expect(result.status).toBe('replay_rejected')
  })

  it('cash payer submission → no_counterpart (never auto-matches)', () => {
    const result = evaluateMatch(
      makePayerSubmission({ payment_rail: 'cash', reference_code: 'CASH001' }),
      makePayeeSubmission(),
      makeObligation(),
      makeOptions(),
    )
    expect(result.status).toBe('no_counterpart')
  })

  it('cheque payee submission → no_counterpart (never auto-matches)', () => {
    const result = evaluateMatch(
      makePayerSubmission(),
      makePayeeSubmission({ payment_rail: 'cheque', reference_code: 'CHQ001' }),
      makeObligation(),
      makeOptions(),
    )
    expect(result.status).toBe('no_counterpart')
  })

  it('unparseable payer reference code → unparseable', () => {
    const result = evaluateMatch(
      makePayerSubmission({ reference_code: 'AB', payment_rail: 'mpesa_paybill' }), // too short
      makePayeeSubmission(),
      makeObligation(),
      makeOptions(),
    )
    expect(result.status).toBe('unparseable')
  })

  it('partial payment: payer pays half → matched with partial ledger effect', () => {
    const result = evaluateMatch(
      makePayerSubmission({ parsed_amount: 7500, reference_code: 'QJK23XF89H' }),
      makePayeeSubmission({ parsed_amount: 7500, reference_code: 'QJK23XF89H' }),
      makeObligation({ balance: 15000 }),
      makeOptions(),
    )
    expect(result.status).toBe('matched')
    expect(result.ledgerEffect?.type).toBe('partial')
    expect(result.ledgerEffect?.balanceAfter).toBe(7500)
  })

  it('overpayment: payer pays more than balance → matched with overpayment + credit', () => {
    const result = evaluateMatch(
      makePayerSubmission({ parsed_amount: 17000, reference_code: 'QJK23XF89H' }),
      makePayeeSubmission({ parsed_amount: 17000, reference_code: 'QJK23XF89H' }),
      makeObligation({ balance: 15000 }),
      makeOptions(),
    )
    expect(result.status).toBe('matched')
    expect(result.ledgerEffect?.type).toBe('overpayment')
    expect(result.ledgerEffect?.balanceAfter).toBe(0)
    expect(result.ledgerEffect?.creditAmount).toBe(2000)
  })

  it('both timestamps null → match proceeds (benefit of doubt)', () => {
    const result = evaluateMatch(
      makePayerSubmission({ parsed_transaction_at: null }),
      makePayeeSubmission({ parsed_transaction_at: null }),
      makeObligation(),
      makeOptions(),
    )
    expect(result.status).toBe('matched')
  })

  it('floating-point amounts within tolerance (e.g. 15000.00 vs 15000.001) → matched', () => {
    const result = evaluateMatch(
      makePayerSubmission({ parsed_amount: 15000.00 }),
      makePayeeSubmission({ parsed_amount: 15000.001 }),
      makeObligation(),
      makeOptions(),
    )
    expect(result.status).toBe('matched')
  })
})

// ─── findMatch (batch) ────────────────────────────────────────────────────────

describe('findMatch — batch matching', () => {
  it('finds the one matching candidate in a pool of non-matches', () => {
    const matchingPayee = makePayeeSubmission({ reference_code: 'QJK23XF89H' })
    const wrongPayee1 = makePayeeSubmission({
      id: 'sub-payee-002',
      reference_code: 'AAAAAAAAAA',
    })
    const wrongPayee2 = makePayeeSubmission({
      id: 'sub-payee-003',
      reference_code: 'BBBBBBBBBB',
    })

    const result = findMatch(
      makePayerSubmission(),
      [wrongPayee1, wrongPayee2, matchingPayee],
      makeObligation(),
      makeOptions(),
    )
    expect(result.status).toBe('matched')
  })

  it('returns no_counterpart when candidate pool is empty', () => {
    const result = findMatch(
      makePayerSubmission(),
      [],
      makeObligation(),
      makeOptions(),
    )
    expect(result.status).toBe('no_counterpart')
  })

  it('returns last non-match result when no candidate matches', () => {
    const result = findMatch(
      makePayerSubmission({ reference_code: 'QJK23XF89H' }),
      [makePayeeSubmission({ reference_code: 'AAAAAAAAAA' })],
      makeObligation(),
      makeOptions(),
    )
    expect(result.status).toBe('no_counterpart')
  })
})

// ─── Utility Functions ────────────────────────────────────────────────────────

describe('normalizeReferenceCode', () => {
  it('uppercases and trims whitespace', () => {
    expect(normalizeReferenceCode('  qjk23xf89h  ')).toBe('QJK23XF89H')
  })
})

describe('buildPayerDisplayRef', () => {
  it('tenant: returns Unit + property name', () => {
    expect(
      buildPayerDisplayRef({ role: 'tenant', unitNumber: 'A3', propertyName: 'Palm Court' }),
    ).toBe('Unit A3 · Palm Court')
  })

  it('tenant with no unit: returns property name only', () => {
    expect(
      buildPayerDisplayRef({ role: 'tenant', propertyName: 'Palm Court' }),
    ).toBe('Palm Court')
  })

  it('parent: returns admission number', () => {
    expect(
      buildPayerDisplayRef({ role: 'parent', admissionNumber: '2024-001' }),
    ).toBe('Adm. 2024-001')
  })

  it('landlord: returns business name', () => {
    expect(
      buildPayerDisplayRef({ role: 'landlord', businessName: 'Palm Holdings Ltd' }),
    ).toBe('Palm Holdings Ltd')
  })

  it('school: returns school name', () => {
    expect(
      buildPayerDisplayRef({ role: 'school', schoolName: 'Nairobi Academy' }),
    ).toBe('Nairobi Academy')
  })
})
