export type SubscriptionPlan = 'trial' | 'starter' | 'growth' | 'business' | 'enterprise';

export const PLAN_LIMITS: Record<SubscriptionPlan, { maxUnits: number, maxStaff: number }> = {
  trial: {
    maxUnits: 10,
    maxStaff: 2
  },
  starter: {
    maxUnits: 50,
    maxStaff: 5
  },
  growth: {
    maxUnits: 100,
    maxStaff: 10
  },
  business: {
    maxUnits: Infinity,
    maxStaff: Infinity
  },
  enterprise: {
    maxUnits: Infinity,
    maxStaff: Infinity
  }
};

export function getPlanLimits(plan: string | null) {
  const normalizedPlan = (plan || 'trial') as SubscriptionPlan;
  return PLAN_LIMITS[normalizedPlan] || PLAN_LIMITS.trial;
}
