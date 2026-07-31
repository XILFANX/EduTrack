-- Regional Pricing Engine Migration for EduTrack
-- 20260731000000_regional_pricing_engine.sql

-- 1. country_regions
CREATE TABLE public.country_regions (
    country_code text PRIMARY KEY,
    currency_code text NOT NULL,
    region_tier text NOT NULL,
    base_multiplier numeric NOT NULL DEFAULT 1.0,
    locale_default text DEFAULT 'en',
    date_format_default text DEFAULT 'YYYY-MM-DD',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Seed basic country regions
INSERT INTO public.country_regions (country_code, currency_code, region_tier, base_multiplier) VALUES
('KE', 'KES', 'Tier 3', 130.0),
('US', 'USD', 'Tier 1', 1.0),
('UK', 'GBP', 'Tier 1', 0.8),
('ZA', 'ZAR', 'Tier 2', 18.0)
ON CONFLICT (country_code) DO NOTHING;

-- 2. plan_bands
CREATE TABLE public.plan_bands (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product text NOT NULL CHECK (product IN ('estatetrack', 'edutrack')),
    band_index integer NOT NULL,
    name text NOT NULL,
    min_units integer NOT NULL,
    max_units integer, -- null means Infinity
    base_price_monthly numeric NOT NULL,
    fixed_local_prices jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(product, band_index)
);

-- Seed standard EduTrack bands
INSERT INTO public.plan_bands (product, band_index, name, min_units, max_units, base_price_monthly, fixed_local_prices) VALUES
('edutrack', 1, 'Up to 50', 0, 50, 20.0, '{"KES": 2000, "USD": 20, "ZAR": 350}'),
('edutrack', 2, 'Up to 150', 51, 150, 89.0, '{"KES": 8900, "USD": 89, "ZAR": 1500}'),
('edutrack', 3, 'Up to 500', 151, 500, 249.0, '{"KES": 24900, "USD": 249, "ZAR": 4500}'),
('edutrack', 4, 'Up to 1500', 501, 1500, 799.0, '{"KES": 79900, "USD": 799, "ZAR": 14000}'),
('edutrack', 5, 'Unlimited', 1501, null, 1499.0, '{"KES": 149900, "USD": 1499, "ZAR": 27000}')
ON CONFLICT DO NOTHING;

-- 3. subscriptions
CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'grace', 'suspended', 'cancelled');
CREATE TYPE billing_cycle AS ENUM ('monthly', 'annual', 'termly');

CREATE TABLE public.subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    product text NOT NULL DEFAULT 'edutrack' CHECK (product IN ('estatetrack', 'edutrack')),
    current_band_id uuid REFERENCES public.plan_bands(id),
    status subscription_status NOT NULL DEFAULT 'trialing',
    billing_cycle billing_cycle NOT NULL DEFAULT 'monthly',
    trial_starts_at timestamptz,
    trial_ends_at timestamptz,
    current_period_start timestamptz,
    current_period_end timestamptz,
    current_band_unit_count integer NOT NULL DEFAULT 0,
    pending_band_change_id uuid REFERENCES public.plan_bands(id),
    pending_band_change_date timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 4. usage_snapshots
CREATE TABLE public.usage_snapshots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    product text NOT NULL DEFAULT 'edutrack',
    active_unit_count integer NOT NULL,
    snapshot_date timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

-- 5. band_change_events
CREATE TABLE public.band_change_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    old_band_id uuid REFERENCES public.plan_bands(id),
    new_band_id uuid REFERENCES public.plan_bands(id),
    direction text CHECK (direction IN ('up', 'down', 'none')),
    reason text NOT NULL,
    effective_date timestamptz NOT NULL,
    actor_id uuid,
    created_at timestamptz DEFAULT now()
);

-- 6. region_pricing_overrides
CREATE TABLE public.region_pricing_overrides (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    negotiated_price numeric NOT NULL,
    currency_code text NOT NULL,
    effective_date timestamptz NOT NULL,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(account_id)
);

-- 7. country_change_requests
CREATE TABLE public.country_change_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    old_country_code text NOT NULL,
    new_country_code text NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reason text NOT NULL,
    admin_notes text,
    resolved_at timestamptz,
    resolved_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ALTER schools to enforce country_code if not already there
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS country_code text DEFAULT 'KE' NOT NULL;

-- Enable RLS on all new tables
ALTER TABLE public.country_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.band_change_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.region_pricing_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.country_change_requests ENABLE ROW LEVEL SECURITY;

-- Basic RLS: Users can read their own account data
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions FOR SELECT USING (account_id IN (SELECT school_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can view their own usage snapshots" ON public.usage_snapshots FOR SELECT USING (account_id IN (SELECT school_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can view their own band changes" ON public.band_change_events FOR SELECT USING (account_id IN (SELECT school_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can view their own overrides" ON public.region_pricing_overrides FOR SELECT USING (account_id IN (SELECT school_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can view their own country requests" ON public.country_change_requests FOR SELECT USING (account_id IN (SELECT school_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can create country requests" ON public.country_change_requests FOR INSERT WITH CHECK (account_id IN (SELECT school_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Public read plan bands" ON public.plan_bands FOR SELECT USING (true);
CREATE POLICY "Public read country regions" ON public.country_regions FOR SELECT USING (true);

-- ==========================================
-- DATA MIGRATION SCRIPT (EduTrack)
-- ==========================================
-- Migrate all active schools to the new subscription engine.

INSERT INTO public.subscriptions (
    account_id,
    product,
    current_band_id,
    status,
    billing_cycle,
    current_period_end,
    current_band_unit_count
)
SELECT 
    s.id,
    'edutrack',
    (SELECT pb.id FROM public.plan_bands pb WHERE pb.product = 'edutrack' AND pb.band_index = 1 LIMIT 1),
    CASE 
        WHEN s.subscription_tier != 'Trial' AND s.subscription_tier != 'trial' THEN 'active'::subscription_status
        ELSE 'trialing'::subscription_status
    END,
    'termly'::billing_cycle,
    now() + interval '90 days',
    0
FROM public.schools s
ON CONFLICT DO NOTHING;

-- Log the transition
INSERT INTO public.band_change_events (
    account_id,
    new_band_id,
    direction,
    reason,
    effective_date,
    actor_id
)
SELECT 
    sub.account_id,
    sub.current_band_id,
    'none',
    'Migration - Grandfathered',
    now(),
    NULL
FROM public.subscriptions sub
WHERE sub.product = 'edutrack'
ON CONFLICT DO NOTHING;
