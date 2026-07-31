/**
 * Regional Pricing Engine — Shared Logic
 *
 * This module contains all pure functions for the billing engine.
 * It has no side effects, no DB calls, and no hardcoded constants.
 * All configuration (buffer percent, trial days) must be read from
 * `billing_config` at the call site and passed in — never defaulted here.
 */

export type ProductKey = 'estatetrack' | 'edutrack';
export type SubscriptionStatus = 'trialing' | 'active' | 'grace' | 'suspended' | 'cancelled';
export type BillingCycle = 'monthly' | 'annual' | 'termly';
export type BandChangeDirection = 'initial' | 'up' | 'down' | 'none';

// ─── Schema Interfaces ────────────────────────────────────────────────────────

export interface PlanBand {
  id: string;
  product: ProductKey;
  band_index: number;
  name: string;
  min_units: number;
  max_units: number | null; // null = unlimited
  base_price_usd: number;   // Reference price only — never use to bill. Use PlanBandPrice.
}

/** One row from plan_band_prices for a specific (band, currency) pair. */
export interface PlanBandPrice {
  band_id: string;
  currency_code: string; // ISO 4217
  price: number;
}

export interface CountryRegion {
  country_code: string;  // ISO 3166-1 alpha-2
  currency_code: string; // ISO 4217
  region_name: string;
  locale_default: string;
}

/**
 * Billing constants read from billing_config table.
 * Never hardcode these values in application code.
 */
export interface BillingConfig {
  product: ProductKey;
  trial_days_default: number;
  grace_period_days: number;
  headroom_buffer_percent: number; // e.g. 0.10 for 10%
}

export interface Subscription {
  id: string;
  account_id: string;
  product: ProductKey;
  current_band_id: string;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  current_band_unit_count: number;
  pending_band_change_id?: string | null;
  pending_band_change_date?: string | null;
}

export interface UsageSnapshot {
  active_unit_count: number;
}

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * Finds the correct plan band for a given usage count.
 * Bands are sorted internally — call-site ordering does not matter.
 * Returns null only if usage exceeds every band's max_units (enterprise overflow).
 */
export function determineBandForUsage(bands: PlanBand[], usageCount: number): PlanBand | null {
  const sorted = [...bands].sort((a, b) => a.min_units - b.min_units);
  for (const band of sorted) {
    if (usageCount >= band.min_units && (band.max_units === null || usageCount <= band.max_units)) {
      return band;
    }
  }
  return null;
}

/**
 * Returns the local price for a band in a specific currency.
 *
 * IMPORTANT: This function intentionally throws if no price row exists.
 * A missing price means the region has not been configured — this is a
 * data-configuration error, not a runtime exception to swallow silently.
 * The caller must catch this and surface it as an admin alert.
 *
 * Never add a fallback multiplier here — silent wrong pricing is worse than
 * a visible error.
 */
export function resolveLocalPrice(
  bandPrice: PlanBandPrice | null | undefined,
  bandName: string,
  currencyCode: string,
): number {
  if (!bandPrice) {
    throw new Error(
      `Pricing not configured: no price for plan "${bandName}" in currency "${currencyCode}". ` +
      `Add a row to plan_band_prices for (band_id, currency_code="${currencyCode}").`,
    );
  }
  return bandPrice.price;
}

/**
 * Evaluates whether a band transition is required at a billing cycle boundary.
 *
 * Rules:
 *  - Upgrades: only trigger if usage exceeds max_units AND exceeds the headroom buffer threshold.
 *  - Downgrades: immediate at cycle boundary — no buffer applied.
 *  - Unlimited bands (max_units = null): never trigger an upgrade.
 *
 * @param bufferPercent - Read from billing_config.headroom_buffer_percent.
 *   No default is provided deliberately — the caller MUST read the DB value.
 */
export function evaluateBandTransition(
  currentSubscription: Subscription,
  newSnapshot: UsageSnapshot,
  allBands: PlanBand[],
  bufferPercent: number,
): {
  action: 'none' | 'upgrade' | 'downgrade' | 'enterprise_overflow';
  newBand?: PlanBand;
} {
  const currentBand = allBands.find((b) => b.id === currentSubscription.current_band_id);
  if (!currentBand) {
    throw new Error(
      `evaluateBandTransition: current band id="${currentSubscription.current_band_id}" not found in allBands.`,
    );
  }

  const usage = newSnapshot.active_unit_count;

  // 1. Usage fits within the current band — no change needed.
  if (
    usage >= currentBand.min_units &&
    (currentBand.max_units === null || usage <= currentBand.max_units)
  ) {
    return { action: 'none' };
  }

  // 2. Find the target band for the new usage count.
  const targetBand = determineBandForUsage(allBands, usage);

  // 3. Usage exceeds every band — notify for manual enterprise handling.
  if (!targetBand) {
    return { action: 'enterprise_overflow' };
  }

  // 4. Upgrade path — apply headroom buffer before committing.
  if (currentBand.max_units !== null && usage > currentBand.max_units) {
    const bufferThreshold = Math.floor(currentBand.max_units * (1 + bufferPercent));
    if (usage <= bufferThreshold) {
      // Within buffer — defer upgrade to next cycle.
      return { action: 'none' };
    }
    return { action: 'upgrade', newBand: targetBand };
  }

  // 5. Downgrade path — immediate at cycle boundary.
  if (usage < currentBand.min_units) {
    return { action: 'downgrade', newBand: targetBand };
  }

  return { action: 'none' };
}

/**
 * Computes a trial end date from a start date and the DB-sourced trial duration.
 * Always use this instead of `Date.now() + 30 * 86400000` at the call site.
 */
export function computeTrialEnd(startDate: Date, trialDays: number): Date {
  return new Date(startDate.getTime() + trialDays * 86_400_000);
}
