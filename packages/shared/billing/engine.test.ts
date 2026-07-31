import { describe, it, expect } from 'vitest';
import { PlanBand, Subscription, determineBandForUsage, evaluateBandTransition, resolveLocalPrice } from './engine';

const MOCK_BANDS: PlanBand[] = [
  { id: 'band1', product: 'estatetrack', band_index: 1, name: 'Up to 10', min_units: 0, max_units: 10, base_price_monthly: 20, fixed_local_prices: { 'KES': 2000 } },
  { id: 'band2', product: 'estatetrack', band_index: 2, name: 'Up to 50', min_units: 11, max_units: 50, base_price_monthly: 89, fixed_local_prices: { 'KES': 8900 } },
  { id: 'band3', product: 'estatetrack', band_index: 3, name: 'Unlimited', min_units: 51, max_units: null, base_price_monthly: 1499, fixed_local_prices: {} }
];

describe('Regional Pricing Engine', () => {
  it('determines the correct band for usage', () => {
    expect(determineBandForUsage(MOCK_BANDS, 5)?.id).toBe('band1');
    expect(determineBandForUsage(MOCK_BANDS, 10)?.id).toBe('band1');
    expect(determineBandForUsage(MOCK_BANDS, 11)?.id).toBe('band2');
    expect(determineBandForUsage(MOCK_BANDS, 49)?.id).toBe('band2');
    expect(determineBandForUsage(MOCK_BANDS, 55)?.id).toBe('band3');
    expect(determineBandForUsage(MOCK_BANDS, 1000)?.id).toBe('band3');
  });

  it('resolves local price using fixed price map', () => {
    const price = resolveLocalPrice(MOCK_BANDS[0], 'KES', 130);
    expect(price).toBe(2000); // from fixed map
  });

  it('resolves local price falling back to multiplier', () => {
    const price = resolveLocalPrice(MOCK_BANDS[2], 'KES', 130);
    expect(price).toBe(1499 * 130); // fallback to multiplier because map is empty
  });

  describe('evaluateBandTransition', () => {
    const mockSub: Subscription = {
      id: 'sub1', account_id: 'acc1', product: 'estatetrack', current_band_id: 'band1',
      status: 'active', billing_cycle: 'monthly', current_band_unit_count: 5
    };

    it('returns none if usage fits current band', () => {
      const res = evaluateBandTransition(mockSub, { active_unit_count: 8 }, MOCK_BANDS);
      expect(res.action).toBe('none');
    });

    it('applies buffer for upgrades', () => {
      // band1 max is 10. 10% buffer makes it 11.
      const res = evaluateBandTransition(mockSub, { active_unit_count: 11 }, MOCK_BANDS);
      expect(res.action).toBe('none'); // within buffer
    });

    it('upgrades if usage exceeds buffer', () => {
      // band1 max is 10. 10% buffer makes it 11.
      const res = evaluateBandTransition(mockSub, { active_unit_count: 12 }, MOCK_BANDS);
      expect(res.action).toBe('upgrade');
      expect(res.newBand?.id).toBe('band2');
    });

    it('downgrades immediately without buffer', () => {
      const subInBand2 = { ...mockSub, current_band_id: 'band2', current_band_unit_count: 30 };
      const res = evaluateBandTransition(subInBand2, { active_unit_count: 10 }, MOCK_BANDS);
      expect(res.action).toBe('downgrade');
      expect(res.newBand?.id).toBe('band1');
    });

    it('handles unlimited bands properly', () => {
      const subInBand3 = { ...mockSub, current_band_id: 'band3', current_band_unit_count: 100 };
      const res = evaluateBandTransition(subInBand3, { active_unit_count: 5000 }, MOCK_BANDS);
      expect(res.action).toBe('none');
    });
  });
});
