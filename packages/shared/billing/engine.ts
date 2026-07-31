import { SupabaseClient } from '@supabase/supabase-js';

export interface PlanBand {
  id: string;
  product: 'estatetrack' | 'edutrack';
  band_index: number;
  name: string;
  min_units: number;
  max_units: number | null;
  base_price_monthly: number;
  fixed_local_prices: Record<string, number>;
}

export interface UsageSnapshot {
  active_unit_count: number;
}

export interface Subscription {
  id: string;
  account_id: string;
  product: 'estatetrack' | 'edutrack';
  current_band_id: string;
  status: 'trialing' | 'active' | 'grace' | 'suspended' | 'cancelled';
  billing_cycle: 'monthly' | 'annual' | 'termly';
  current_band_unit_count: number;
  pending_band_change_id?: string | null;
  pending_band_change_date?: Date | null;
}

export interface CountryRegion {
  country_code: string;
  currency_code: string;
  region_tier: string;
  base_multiplier: number;
}

/**
 * Determine the correct plan band given a usage count.
 */
export function determineBandForUsage(bands: PlanBand[], usageCount: number): PlanBand | null {
  // Ensure bands are sorted by min_units ascending
  const sorted = [...bands].sort((a, b) => a.min_units - b.min_units);
  for (const band of sorted) {
    if (usageCount >= band.min_units && (band.max_units === null || usageCount <= band.max_units)) {
      return band;
    }
  }
  return null; // Should only happen if usage exceeds highest max_units and highest max_units isn't null.
}

/**
 * Calculates the exact local price for a given band in a specific currency.
 */
export function resolveLocalPrice(band: PlanBand, currencyCode: string, regionMultiplier: number): number {
  if (band.fixed_local_prices && typeof band.fixed_local_prices[currencyCode] === 'number') {
    return band.fixed_local_prices[currencyCode];
  }
  return band.base_price_monthly * regionMultiplier;
}

/**
 * Evaluates band transitions at cycle boundary.
 */
export function evaluateBandTransition(
  currentSubscription: Subscription,
  newSnapshot: UsageSnapshot,
  allBands: PlanBand[],
  bufferPercent: number = 0.10 // 10% headroom buffer
): { action: 'none' | 'upgrade' | 'downgrade' | 'enterprise_overflow', newBand?: PlanBand } {
  
  const currentBand = allBands.find(b => b.id === currentSubscription.current_band_id);
  if (!currentBand) throw new Error("Current band not found");

  const usage = newSnapshot.active_unit_count;

  // Usage fits perfectly in current band
  if (usage >= currentBand.min_units && (currentBand.max_units === null || usage <= currentBand.max_units)) {
    return { action: 'none' };
  }

  // Find the exact band the usage falls into
  const exactNewBand = determineBandForUsage(allBands, usage);
  
  if (!exactNewBand) {
    return { action: 'enterprise_overflow' };
  }

  // Headroom buffer logic for upgrades
  if (usage > (currentBand.max_units || Infinity)) {
    const bufferThreshold = Math.floor((currentBand.max_units || 0) * (1 + bufferPercent));
    if (usage <= bufferThreshold) {
      // Within buffer, do not upgrade yet.
      return { action: 'none' };
    }
    return { action: 'upgrade', newBand: exactNewBand };
  }

  // Downgrade logic (immediate drop if falls below min_units)
  if (usage < currentBand.min_units) {
    return { action: 'downgrade', newBand: exactNewBand };
  }

  return { action: 'none' };
}
