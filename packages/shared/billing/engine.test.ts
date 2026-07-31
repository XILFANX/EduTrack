import { describe, it, expect } from 'vitest';
import {
  PlanBand,
  PlanBandPrice,
  Subscription,
  determineBandForUsage,
  evaluateBandTransition,
  resolveLocalPrice,
  computeTrialEnd,
} from './engine';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_BANDS: PlanBand[] = [
  { id: 'band1', product: 'estatetrack', band_index: 1, name: 'Starter',    min_units: 0,   max_units: 10,  base_price_usd: 20  },
  { id: 'band2', product: 'estatetrack', band_index: 2, name: 'Growth',     min_units: 11,  max_units: 50,  base_price_usd: 49  },
  { id: 'band3', product: 'estatetrack', band_index: 3, name: 'Enterprise', min_units: 51,  max_units: null, base_price_usd: 599 },
];

const MOCK_PRICES: PlanBandPrice[] = [
  { band_id: 'band1', currency_code: 'KES', price: 2000 },
  { band_id: 'band2', currency_code: 'KES', price: 5500 },
  // band3 KES deliberately absent to test throw behavior
  { band_id: 'band1', currency_code: 'USD', price: 20   },
];

const BASE_SUB: Subscription = {
  id: 'sub1',
  account_id: 'acc1',
  product: 'estatetrack',
  current_band_id: 'band1',
  status: 'active',
  billing_cycle: 'monthly',
  current_band_unit_count: 5,
};

// Buffer percent — read from billing_config at runtime; hardcoded here for tests only.
const BUFFER = 0.10;

// ─── determineBandForUsage ────────────────────────────────────────────────────

describe('determineBandForUsage', () => {
  it('returns the correct band for various usage counts', () => {
    expect(determineBandForUsage(MOCK_BANDS, 0)?.id).toBe('band1');
    expect(determineBandForUsage(MOCK_BANDS, 5)?.id).toBe('band1');
    expect(determineBandForUsage(MOCK_BANDS, 10)?.id).toBe('band1');
    expect(determineBandForUsage(MOCK_BANDS, 11)?.id).toBe('band2');
    expect(determineBandForUsage(MOCK_BANDS, 50)?.id).toBe('band2');
    expect(determineBandForUsage(MOCK_BANDS, 51)?.id).toBe('band3');
    expect(determineBandForUsage(MOCK_BANDS, 10_000)?.id).toBe('band3'); // unlimited band
  });

  it('returns null when usage exceeds all finite bands and none is unlimited', () => {
    const finiteBands: PlanBand[] = [
      { ...MOCK_BANDS[0] },
      { ...MOCK_BANDS[1], max_units: 50 },
      // no unlimited band
    ];
    expect(determineBandForUsage(finiteBands, 1000)).toBeNull();
  });

  it('is order-independent — works even if bands are not sorted by min_units', () => {
    const shuffled = [MOCK_BANDS[2], MOCK_BANDS[0], MOCK_BANDS[1]];
    expect(determineBandForUsage(shuffled, 25)?.id).toBe('band2');
  });
});

// ─── resolveLocalPrice ────────────────────────────────────────────────────────

describe('resolveLocalPrice', () => {
  it('returns the exact price when a PlanBandPrice row exists', () => {
    const price = MOCK_PRICES.find(p => p.band_id === 'band1' && p.currency_code === 'KES');
    expect(resolveLocalPrice(price, 'Starter', 'KES')).toBe(2000);
  });

  it('throws with a clear message when no price row exists (null)', () => {
    expect(() => resolveLocalPrice(null, 'Enterprise', 'KES')).toThrowError(
      /Pricing not configured.*Enterprise.*KES/,
    );
  });

  it('throws with a clear message when no price row exists (undefined)', () => {
    expect(() => resolveLocalPrice(undefined, 'Enterprise', 'NGN')).toThrowError(
      /Pricing not configured.*Enterprise.*NGN/,
    );
  });

  it('never silently falls back to a multiplier — a missing price is always a thrown error', () => {
    // This test encodes the contract. If a future developer re-adds a fallback,
    // this test will fail and force them to justify the change.
    const missingPrice = MOCK_PRICES.find(p => p.band_id === 'band3' && p.currency_code === 'KES');
    expect(missingPrice).toBeUndefined(); // fixture confirms the price is absent
    expect(() => resolveLocalPrice(missingPrice, 'Enterprise', 'KES')).toThrow();
  });
});

// ─── evaluateBandTransition ───────────────────────────────────────────────────

describe('evaluateBandTransition', () => {
  it('returns none when usage fits comfortably in the current band', () => {
    const result = evaluateBandTransition(BASE_SUB, { active_unit_count: 8 }, MOCK_BANDS, BUFFER);
    expect(result.action).toBe('none');
  });

  it('returns none when usage is at the band ceiling exactly', () => {
    const result = evaluateBandTransition(BASE_SUB, { active_unit_count: 10 }, MOCK_BANDS, BUFFER);
    expect(result.action).toBe('none');
  });

  it('returns none when usage exceeds max but is within the headroom buffer', () => {
    // band1 max = 10, buffer = 10% → threshold = floor(10 * 1.10) = 11
    const result = evaluateBandTransition(BASE_SUB, { active_unit_count: 11 }, MOCK_BANDS, BUFFER);
    expect(result.action).toBe('none');
  });

  it('returns upgrade when usage exceeds the buffer threshold', () => {
    // 12 > 11 (buffer threshold) → upgrade to band2
    const result = evaluateBandTransition(BASE_SUB, { active_unit_count: 12 }, MOCK_BANDS, BUFFER);
    expect(result.action).toBe('upgrade');
    expect(result.newBand?.id).toBe('band2');
  });

  it('returns downgrade immediately when usage drops below band min_units (no buffer)', () => {
    const subInBand2: Subscription = { ...BASE_SUB, current_band_id: 'band2', current_band_unit_count: 30 };
    const result = evaluateBandTransition(subInBand2, { active_unit_count: 10 }, MOCK_BANDS, BUFFER);
    expect(result.action).toBe('downgrade');
    expect(result.newBand?.id).toBe('band1');
  });

  it('returns none for unlimited bands regardless of usage', () => {
    const subInBand3: Subscription = { ...BASE_SUB, current_band_id: 'band3', current_band_unit_count: 100 };
    const result = evaluateBandTransition(subInBand3, { active_unit_count: 999_999 }, MOCK_BANDS, BUFFER);
    expect(result.action).toBe('none');
  });

  it('returns enterprise_overflow when usage exceeds all finite bands', () => {
    const allFinite: PlanBand[] = [
      { ...MOCK_BANDS[0] },
      { ...MOCK_BANDS[1], max_units: 50 },
    ];
    const result = evaluateBandTransition(
      { ...BASE_SUB, current_band_id: 'band1' },
      { active_unit_count: 500 },
      allFinite,
      BUFFER,
    );
    expect(result.action).toBe('enterprise_overflow');
  });

  it('throws if the current band id is not in allBands', () => {
    expect(() =>
      evaluateBandTransition(
        { ...BASE_SUB, current_band_id: 'nonexistent-id' },
        { active_unit_count: 5 },
        MOCK_BANDS,
        BUFFER,
      ),
    ).toThrow(/current band id/);
  });

  it('bufferPercent = 0 means upgrades trigger immediately at max_units + 1', () => {
    const result = evaluateBandTransition(BASE_SUB, { active_unit_count: 11 }, MOCK_BANDS, 0);
    expect(result.action).toBe('upgrade');
  });
});

// ─── computeTrialEnd ─────────────────────────────────────────────────────────

describe('computeTrialEnd', () => {
  it('computes correct trial end date from start and day count', () => {
    const start = new Date('2026-01-01T00:00:00Z');
    const end = computeTrialEnd(start, 30);
    expect(end.toISOString()).toBe('2026-01-31T00:00:00.000Z');
  });

  it('works for EduTrack 90-day trial', () => {
    const start = new Date('2026-01-01T00:00:00Z');
    const end = computeTrialEnd(start, 90);
    expect(end.toISOString()).toBe('2026-04-01T00:00:00.000Z');
  });
});
