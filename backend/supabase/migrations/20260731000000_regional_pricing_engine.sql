-- Regional Pricing Engine — EduTrack
-- 20260731000000_regional_pricing_engine.sql
--
-- Pre-migration audit fixes applied:
--   #1  UK → GB (ISO 3166-1 alpha-2)
--   #2  product as ENUM
--   #3  billing_config table — trial/grace/buffer DB-driven (EduTrack = 90 days)
--   #4  plan_band_prices table replaces fixed_local_prices JSONB
--   #5  resolveLocalPrice no silent fallback (engine layer)
--   #6  onboarding fails hard on missing band/config (app layer)
--   #7  account_price_overrides (per-account deals only)
--   #8  band_change_events.direction via trigger
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 0. Shared ENUMs ──────────────────────────────────────────────────────────

CREATE TYPE product_key AS ENUM ('estatetrack', 'edutrack');
CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'grace', 'suspended', 'cancelled');
CREATE TYPE billing_cycle_type AS ENUM ('monthly', 'annual', 'termly');

-- ── 1. country_regions ───────────────────────────────────────────────────────

CREATE TABLE public.country_regions (
    country_code   text PRIMARY KEY,   -- ISO 3166-1 alpha-2
    currency_code  text NOT NULL,       -- ISO 4217
    region_name    text NOT NULL,
    locale_default text NOT NULL DEFAULT 'en',
    created_at     timestamptz DEFAULT now(),
    updated_at     timestamptz DEFAULT now()
);

INSERT INTO public.country_regions (country_code, currency_code, region_name, locale_default) VALUES
('KE', 'KES', 'East Africa',      'en-KE'),
('UG', 'UGX', 'East Africa',      'en-UG'),
('TZ', 'TZS', 'East Africa',      'en-TZ'),
('RW', 'RWF', 'East Africa',      'en-RW'),
('ET', 'ETB', 'East Africa',      'en-ET'),
('NG', 'NGN', 'West Africa',      'en-NG'),
('GH', 'GHS', 'West Africa',      'en-GH'),
('ZA', 'ZAR', 'Southern Africa',  'en-ZA'),
('GB', 'GBP', 'Europe',           'en-GB'),
('DE', 'EUR', 'Europe',           'de-DE'),
('FR', 'EUR', 'Europe',           'fr-FR'),
('US', 'USD', 'North America',    'en-US'),
('CA', 'CAD', 'North America',    'en-CA'),
('AU', 'AUD', 'Oceania',          'en-AU'),
('SG', 'SGD', 'Southeast Asia',   'en-SG'),
('IN', 'INR', 'South Asia',       'en-IN'),
('AE', 'AED', 'Middle East',      'ar-AE')
ON CONFLICT (country_code) DO NOTHING;

-- ── 2. billing_config ────────────────────────────────────────────────────────
-- EduTrack defaults: 90-day trial, 14-day grace period.

CREATE TABLE public.billing_config (
    product                   product_key PRIMARY KEY,
    trial_days_default        int     NOT NULL DEFAULT 90,
    grace_period_days         int     NOT NULL DEFAULT 14,
    headroom_buffer_percent   numeric NOT NULL DEFAULT 0.10
        CHECK (headroom_buffer_percent >= 0 AND headroom_buffer_percent <= 1),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

INSERT INTO public.billing_config (product, trial_days_default, grace_period_days, headroom_buffer_percent)
VALUES ('edutrack', 90, 14, 0.10)
ON CONFLICT (product) DO NOTHING;

-- ── 3. plan_bands ────────────────────────────────────────────────────────────
-- Per-student count tiers.

CREATE TABLE public.plan_bands (
    id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    product       product_key NOT NULL,
    band_index    integer     NOT NULL CHECK (band_index >= 1),
    name          text        NOT NULL,
    min_units     integer     NOT NULL CHECK (min_units >= 0),  -- "units" = students
    max_units     integer,    -- NULL = unlimited
    base_price_usd numeric   NOT NULL CHECK (base_price_usd >= 0),
    created_at    timestamptz DEFAULT now(),
    updated_at    timestamptz DEFAULT now(),
    UNIQUE(product, band_index)
);

INSERT INTO public.plan_bands (product, band_index, name, min_units, max_units, base_price_usd) VALUES
('edutrack', 1, 'Up to 50',    0,    50,   20.00),
('edutrack', 2, 'Up to 150',  51,   150,   55.00),
('edutrack', 3, 'Up to 500', 151,   500,  149.00),
('edutrack', 4, 'Up to 1500',501,  1500,  399.00),
('edutrack', 5, 'Unlimited', 1501, null,  749.00)
ON CONFLICT (product, band_index) DO NOTHING;

-- ── 4. plan_band_prices ──────────────────────────────────────────────────────

CREATE TABLE public.plan_band_prices (
    id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
    band_id       uuid    NOT NULL REFERENCES public.plan_bands(id) ON DELETE CASCADE,
    currency_code text    NOT NULL,
    price         numeric NOT NULL CHECK (price >= 0),
    created_at    timestamptz DEFAULT now(),
    updated_at    timestamptz DEFAULT now(),
    UNIQUE(band_id, currency_code)
);

INSERT INTO public.plan_band_prices (band_id, currency_code, price)
SELECT pb.id, v.currency_code, v.price
FROM public.plan_bands pb
JOIN (VALUES
    (1, 'KES',   2000), (2, 'KES',   5500), (3, 'KES',  15000), (4, 'KES',  40000), (5, 'KES',  75000),
    (1, 'USD',     20), (2, 'USD',     55), (3, 'USD',    149), (4, 'USD',    399), (5, 'USD',    749),
    (1, 'GBP',     16), (2, 'GBP',     44), (3, 'GBP',    120), (4, 'GBP',    320), (5, 'GBP',    600),
    (1, 'ZAR',    350), (2, 'ZAR',    950), (3, 'ZAR',   2600), (4, 'ZAR',   6900), (5, 'ZAR',  13000),
    (1, 'NGN',  33000), (2, 'NGN',  90000), (3, 'NGN', 245000), (4, 'NGN', 660000), (5, 'NGN',1230000),
    (1, 'GHS',    240), (2, 'GHS',    650), (3, 'GHS',   1750), (4, 'GHS',   4700), (5, 'GHS',   8800),
    (1, 'AED',     75), (2, 'AED',    200), (3, 'AED',    550), (4, 'AED',   1450), (5, 'AED',   2750),
    (1, 'INR',   1650), (2, 'INR',   4550), (3, 'INR',  12300), (4, 'INR',  33000), (5, 'INR',  62000),
    (1, 'SGD',     27), (2, 'SGD',     74), (3, 'SGD',    200), (4, 'SGD',    540), (5, 'SGD',   1010),
    (1, 'CAD',     27), (2, 'CAD',     74), (3, 'CAD',    200), (4, 'CAD',    540), (5, 'CAD',   1010),
    (1, 'AUD',     30), (2, 'AUD',     83), (3, 'AUD',    225), (4, 'AUD',    605), (5, 'AUD',   1135)
) AS v(band_index, currency_code, price)
    ON pb.band_index = v.band_index AND pb.product = 'edutrack'
ON CONFLICT (band_id, currency_code) DO NOTHING;

-- ── 5. subscriptions ─────────────────────────────────────────────────────────

CREATE TABLE public.subscriptions (
    id                       uuid               PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id               uuid               NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    product                  product_key        NOT NULL DEFAULT 'edutrack',
    current_band_id          uuid               REFERENCES public.plan_bands(id),
    status                   subscription_status NOT NULL DEFAULT 'trialing',
    billing_cycle            billing_cycle_type  NOT NULL DEFAULT 'termly',
    trial_starts_at          timestamptz,
    trial_ends_at            timestamptz,
    current_period_start     timestamptz,
    current_period_end       timestamptz,
    current_band_unit_count  integer            NOT NULL DEFAULT 0 CHECK (current_band_unit_count >= 0),
    pending_band_change_id   uuid               REFERENCES public.plan_bands(id),
    pending_band_change_date timestamptz,
    created_at               timestamptz        DEFAULT now(),
    updated_at               timestamptz        DEFAULT now(),
    UNIQUE(account_id, product)
);

-- ── 6. usage_snapshots ───────────────────────────────────────────────────────

CREATE TABLE public.usage_snapshots (
    id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id        uuid        NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    product           product_key NOT NULL DEFAULT 'edutrack',
    active_unit_count integer     NOT NULL CHECK (active_unit_count >= 0),
    snapshot_date     date        NOT NULL DEFAULT CURRENT_DATE,
    created_at        timestamptz DEFAULT now(),
    UNIQUE(account_id, product, snapshot_date)
);

-- ── 7. band_change_events ────────────────────────────────────────────────────

CREATE TABLE public.band_change_events (
    id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id     uuid        NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    old_band_id    uuid        REFERENCES public.plan_bands(id),
    new_band_id    uuid        NOT NULL REFERENCES public.plan_bands(id),
    direction      text        NOT NULL,  -- set by trigger: 'initial' | 'up' | 'down' | 'none'
    reason         text        NOT NULL,
    effective_date timestamptz NOT NULL DEFAULT now(),
    actor_id       uuid        REFERENCES public.users(id),  -- NULL = system
    created_at     timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.set_band_change_direction()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    old_idx int;
    new_idx int;
BEGIN
    IF NEW.old_band_id IS NULL THEN
        NEW.direction := 'initial';
    ELSE
        SELECT band_index INTO old_idx FROM public.plan_bands WHERE id = NEW.old_band_id;
        SELECT band_index INTO new_idx FROM public.plan_bands WHERE id = NEW.new_band_id;
        IF old_idx IS NULL OR new_idx IS NULL THEN
            RAISE EXCEPTION 'band_change_events: invalid band reference (old=%, new=%)', NEW.old_band_id, NEW.new_band_id;
        END IF;
        NEW.direction := CASE
            WHEN new_idx > old_idx THEN 'up'
            WHEN new_idx < old_idx THEN 'down'
            ELSE 'none'
        END;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_band_change_direction
    BEFORE INSERT ON public.band_change_events
    FOR EACH ROW EXECUTE FUNCTION public.set_band_change_direction();

-- ── 8. account_price_overrides ───────────────────────────────────────────────

CREATE TABLE public.account_price_overrides (
    id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id       uuid        NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    band_id          uuid        NOT NULL REFERENCES public.plan_bands(id),
    negotiated_price numeric     NOT NULL CHECK (negotiated_price >= 0),
    currency_code    text        NOT NULL,
    effective_from   timestamptz NOT NULL DEFAULT now(),
    effective_until  timestamptz,
    notes            text,
    approved_by      uuid        REFERENCES public.users(id),
    created_at       timestamptz DEFAULT now(),
    updated_at       timestamptz DEFAULT now(),
    UNIQUE(account_id, band_id, currency_code)
);

-- ── 9. country_change_requests ───────────────────────────────────────────────

CREATE TABLE public.country_change_requests (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id       uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    old_country_code text NOT NULL,
    new_country_code text NOT NULL,
    status           text NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
    reason           text NOT NULL,
    admin_notes      text,
    resolved_at      timestamptz,
    resolved_by      uuid REFERENCES public.users(id),
    created_at       timestamptz DEFAULT now(),
    updated_at       timestamptz DEFAULT now()
);

-- ── 10. ALTER schools — ensure country_code exists ───────────────────────────
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS country_code text NOT NULL DEFAULT 'KE';

-- ── 11. RLS ──────────────────────────────────────────────────────────────────

ALTER TABLE public.country_regions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_config          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_bands              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_band_prices        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_snapshots         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.band_change_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_price_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.country_change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_country_regions"  ON public.country_regions  FOR SELECT USING (true);
CREATE POLICY "public_read_billing_config"   ON public.billing_config   FOR SELECT USING (true);
CREATE POLICY "public_read_plan_bands"       ON public.plan_bands       FOR SELECT USING (true);
CREATE POLICY "public_read_plan_band_prices" ON public.plan_band_prices FOR SELECT USING (true);

CREATE POLICY "school_read_own_subscription"
    ON public.subscriptions FOR SELECT
    USING (account_id IN (SELECT school_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "school_read_own_usage"
    ON public.usage_snapshots FOR SELECT
    USING (account_id IN (SELECT school_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "school_read_own_band_changes"
    ON public.band_change_events FOR SELECT
    USING (account_id IN (SELECT school_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "school_read_own_overrides"
    ON public.account_price_overrides FOR SELECT
    USING (account_id IN (SELECT school_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "school_read_own_country_requests"
    ON public.country_change_requests FOR SELECT
    USING (account_id IN (SELECT school_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "school_create_country_requests"
    ON public.country_change_requests FOR INSERT
    WITH CHECK (account_id IN (SELECT school_id FROM public.users WHERE id = auth.uid()));

-- ── 12. DATA MIGRATION ───────────────────────────────────────────────────────

DO $$
DECLARE
    v_band_id    uuid;
    v_trial_days int;
BEGIN
    SELECT id INTO v_band_id
    FROM public.plan_bands
    WHERE product = 'edutrack' AND band_index = 1
    LIMIT 1;

    IF v_band_id IS NULL THEN
        RAISE EXCEPTION 'Migration aborted: plan_bands seed missing for edutrack band_index=1';
    END IF;

    SELECT trial_days_default INTO v_trial_days
    FROM public.billing_config
    WHERE product = 'edutrack';

    IF v_trial_days IS NULL THEN
        RAISE EXCEPTION 'Migration aborted: billing_config missing for edutrack';
    END IF;

    -- Migrate existing schools
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'schools'
          AND column_name = 'subscription_tier'
    ) THEN
        INSERT INTO public.subscriptions (
            account_id, product, current_band_id, status,
            billing_cycle, trial_starts_at, trial_ends_at,
            current_period_start, current_period_end, current_band_unit_count
        )
        SELECT
            s.id,
            'edutrack',
            v_band_id,
            CASE
                WHEN LOWER(s.subscription_tier) IN ('active', 'paid') THEN 'active'::subscription_status
                ELSE 'trialing'::subscription_status
            END,
            'termly'::billing_cycle_type,
            now(),
            now() + (v_trial_days * interval '1 day'),
            now(),
            now() + (v_trial_days * interval '1 day'),
            0
        FROM public.schools s
        ON CONFLICT (account_id, product) DO NOTHING;
    ELSE
        INSERT INTO public.subscriptions (
            account_id, product, current_band_id, status,
            billing_cycle, trial_starts_at, trial_ends_at,
            current_period_start, current_period_end, current_band_unit_count
        )
        SELECT
            s.id, 'edutrack', v_band_id, 'trialing'::subscription_status,
            'termly'::billing_cycle_type,
            now(), now() + (v_trial_days * interval '1 day'),
            now(), now() + (v_trial_days * interval '1 day'), 0
        FROM public.schools s
        ON CONFLICT (account_id, product) DO NOTHING;
    END IF;

    INSERT INTO public.band_change_events (account_id, old_band_id, new_band_id, reason, effective_date, actor_id)
    SELECT s.account_id, NULL, s.current_band_id, 'System migration — Regional Pricing Engine v1', now(), NULL
    FROM public.subscriptions s
    WHERE s.product = 'edutrack'
    ON CONFLICT DO NOTHING;
END $$;
