-- =============================================================================
-- Migration: 20260801000001_corridor_and_signals.sql
-- EstateTrack
--
-- Adds:
--   1. corridors table (Corridor model from §7 spec)
--   2. match_records: signal audit columns + corridor_id + updated match_method enum
--   3. submissions: new parsed signal fields + payer_display_ref
--   4. dispute_cases: origin column + rail_profile_snapshot
--   5. Initial corridor seed data (§7.1 defaults)
--   6. pg_cron jobs for §8 unmatched pool management
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. CORRIDORS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE corridor_match_strategy_et AS ENUM (
  'exact',
  'transform_pattern',
  'unmapped'
);

CREATE TYPE fee_model_et AS ENUM (
  'fee_added_to_sender_debit',
  'fee_deducted_from_received_amount'
);

CREATE TABLE IF NOT EXISTS corridors (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payer_rail                text NOT NULL,
  payee_rail                text NOT NULL,
  match_strategy            corridor_match_strategy_et NOT NULL DEFAULT 'unmapped',
  -- Named function key applied in engine when match_strategy = 'transform_pattern'
  transformation_fn         text,
  -- Evidence counter for promotion (§7.4)
  confirmed_pair_count      integer NOT NULL DEFAULT 0 CHECK (confirmed_pair_count >= 0),
  promotion_threshold       integer NOT NULL DEFAULT 5 CHECK (promotion_threshold > 0),
  -- NULL means use strategy default (exact=0.5h, transform=24h, unmapped=72h)
  time_window_hours         numeric(6,2),
  -- NULL until evidence-gated (§7.4) — never defaulted
  amount_tolerance_fraction numeric(6,5) CHECK (amount_tolerance_fraction >= 0 AND amount_tolerance_fraction < 0.1),
  fee_model                 fee_model_et NOT NULL DEFAULT 'fee_added_to_sender_debit',
  cross_currency            boolean NOT NULL DEFAULT false,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),
  -- One row per (payer_rail, payee_rail) pair
  CONSTRAINT corridors_payer_payee_unique UNIQUE (payer_rail, payee_rail)
);

CREATE INDEX corridors_rails_idx ON corridors (payer_rail, payee_rail);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. SUBMISSIONS: new signal fields + payer_display_ref
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS payer_display_ref     text,
  ADD COLUMN IF NOT EXISTS parsed_counterparty   text,
  ADD COLUMN IF NOT EXISTS parsed_narration      text,
  ADD COLUMN IF NOT EXISTS parsed_fee            numeric(14,2),
  ADD COLUMN IF NOT EXISTS parsed_balance_after  numeric(14,2);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. MATCH_RECORDS: signal audit + corridor_id + new match_method values
-- ─────────────────────────────────────────────────────────────────────────────

-- Extend match_method enum to include new values
-- NOTE: Postgres enums cannot be shrunk; we only ADD new values.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'exact_code'
    AND   enumtypid = 'match_method_et'::regtype
  ) THEN
    ALTER TYPE match_method_et ADD VALUE 'exact_code';
    ALTER TYPE match_method_et ADD VALUE 'transform_pattern';
    ALTER TYPE match_method_et ADD VALUE 'unmapped_fallback';
  END IF;
EXCEPTION WHEN undefined_object THEN
  -- Type does not exist yet — create it with all values
  CREATE TYPE match_method_et AS ENUM (
    'exact_code',
    'transform_pattern',
    'unmapped_fallback',
    'manual_override',
    'legacy_import'
  );
END;
$$;

ALTER TABLE match_records
  ADD COLUMN IF NOT EXISTS corridor_id        uuid REFERENCES corridors(id),
  ADD COLUMN IF NOT EXISTS signals_passed     text[],
  ADD COLUMN IF NOT EXISTS signals_absent     text[],
  ADD COLUMN IF NOT EXISTS signals_disagreed  text[];

CREATE INDEX IF NOT EXISTS match_records_corridor_idx ON match_records (corridor_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. DISPUTE_CASES: origin + rail_profile_snapshot
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'dispute_origin_et'
  ) THEN
    CREATE TYPE dispute_origin_et AS ENUM (
      'timeout',
      'flagged_pair',
      'legacy_import'
    );
  END IF;
END;
$$;

ALTER TABLE dispute_cases
  ADD COLUMN IF NOT EXISTS origin               dispute_origin_et NOT NULL DEFAULT 'timeout',
  ADD COLUMN IF NOT EXISTS rail_profile_snapshot jsonb;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. CORRIDOR SEED DATA
-- ─────────────────────────────────────────────────────────────────────────────
-- Exact corridors: reference code is shared verbatim between parties.
-- Time window uses strategy default (NULL) = 0.5h for exact.

INSERT INTO corridors (payer_rail, payee_rail, match_strategy, time_window_hours)
VALUES
  ('mpesa_paybill', 'mpesa_paybill', 'exact',    NULL),  -- default 0.5h
  ('mpesa_till',    'mpesa_till',    'exact',    NULL),  -- default 0.5h
  ('mpesa_paybill', 'mpesa_till',   'exact',    NULL),  -- cross-channel M-Pesa, still exact code
  ('mpesa_till',    'mpesa_paybill','exact',    NULL),   -- reverse direction
  ('bank_transfer', 'bank_transfer','exact',    24),     -- banks may batch overnight → 24h override
  ('other',         'other',        'unmapped', NULL)   -- catch-all unmapped 72h
ON CONFLICT (payer_rail, payee_rail) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. HELPER FUNCTION: get_corridor_for_pair
-- ─────────────────────────────────────────────────────────────────────────────
-- Used by the match-engine server action to look up a corridor without a join.
-- Returns NULL if no explicit row — callers must create an unmapped fallback row.

CREATE OR REPLACE FUNCTION get_corridor_for_pair(
  p_payer_rail text,
  p_payee_rail text
) RETURNS corridors AS $$
  SELECT * FROM corridors
  WHERE payer_rail = p_payer_rail
    AND payee_rail = p_payee_rail
  LIMIT 1;
$$ LANGUAGE sql STABLE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. PG_CRON: §8 Unmatched Pool Management
-- ─────────────────────────────────────────────────────────────────────────────
-- Requires pg_cron extension enabled on the project.
-- Runs every hour; the functions themselves guard against running if no rows match.

DO $$
BEGIN
  -- Check pg_cron is available before scheduling
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN

    -- 7a. 24h payee nudge: payee has a submission unmatched for >24h → notify
    PERFORM cron.schedule(
      'payee-nudge-24h',
      '0 * * * *',  -- every hour
      $$
        SELECT notify_unmatched_submissions(
          'payee',
          interval '24 hours',
          interval '5 days'
        );
      $$
    );

    -- 7b. 5-day payer escalation → DisputeCase if payee not found after 5 days
    PERFORM cron.schedule(
      'payer-dispute-escalation-5d',
      '30 * * * *',  -- every hour, offset by 30 min from nudge
      $$
        SELECT escalate_unmatched_to_dispute(
          'payer',
          interval '5 days',
          'timeout'
        );
      $$
    );

    -- 7c. 7-day payee escalation → DisputeCase if payer not found after 7 days
    PERFORM cron.schedule(
      'payee-dispute-escalation-7d',
      '45 * * * *',
      $$
        SELECT escalate_unmatched_to_dispute(
          'payee',
          interval '7 days',
          'timeout'
        );
      $$
    );

  END IF;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. UPDATED_AT trigger for corridors
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_corridors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS corridors_updated_at ON corridors;
CREATE TRIGGER corridors_updated_at
  BEFORE UPDATE ON corridors
  FOR EACH ROW EXECUTE FUNCTION update_corridors_updated_at();
