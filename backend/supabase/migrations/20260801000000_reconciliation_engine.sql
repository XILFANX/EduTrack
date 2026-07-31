-- ============================================================
-- EduTrack: Payment Settlement Reconciliation Engine
-- Migration: 20260801000000_reconciliation_engine.sql
--
-- Obligation types in this file:
--   fee_term                → Parent (payer) → School/Bursar (payee)
--   edutrack_subscription   → School/Bursar (payer) → Platform (payee)
--
-- Legacy tables kept READ-ONLY for 90 days:
--   fee_payments, mpesa_stk_requests
-- ============================================================

-- ── 0. ENUMs ──────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE public.obligation_type_et AS ENUM (
    'fee_term',
    'edutrack_subscription'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.obligation_status_et AS ENUM (
    'open', 'partial', 'settled', 'overpaid', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payer_role_et AS ENUM (
    'parent', 'school'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payee_role_et AS ENUM (
    'school', 'platform'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.submitter_role_et AS ENUM (
    'payer', 'payee'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.submission_status_et AS ENUM (
    'unmatched', 'matched', 'expired', 'disputed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.submission_source_et AS ENUM (
    'manual', 'gateway', 'legacy_import'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_rail_et AS ENUM (
    'mpesa_paybill', 'mpesa_till', 'bank_transfer', 'cash', 'cheque', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.match_method_et AS ENUM (
    'auto_code_match', 'manual_override', 'legacy_import'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.ledger_entry_type_et AS ENUM (
    'payment', 'partial', 'overpayment', 'credit_apply', 'correction'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.dispute_status_et AS ENUM (
    'open', 'resolved_matched', 'resolved_no_match', 'resolved_credit'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 1. payee_rail_profiles ────────────────────────────────────────────────────
-- Versioned receiving details for each school (bursar) and the platform.

CREATE TABLE IF NOT EXISTS public.payee_rail_profiles (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payee_account_id    UUID NOT NULL,   -- FK: schools.id OR platform sentinel UUID
  payee_role          public.payee_role_et NOT NULL,
  rail                public.payment_rail_et NOT NULL,
  display_details     TEXT NOT NULL,
  structured_details  JSONB NOT NULL DEFAULT '{}',
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  version             INTEGER NOT NULL DEFAULT 1,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  superseded_at       TIMESTAMPTZ,
  CONSTRAINT payee_rail_profiles_version_positive CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS prp_payee_account_id_idx ON public.payee_rail_profiles (payee_account_id);
CREATE INDEX IF NOT EXISTS prp_active_idx ON public.payee_rail_profiles (payee_account_id, is_active) WHERE is_active = TRUE;

ALTER TABLE public.payee_rail_profiles ENABLE ROW LEVEL SECURITY;

-- Helper: get the current user's school_id
CREATE OR REPLACE FUNCTION public.get_auth_school_id_v2()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT school_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

-- Bursar manages school's own rail profiles
DROP POLICY IF EXISTS "Bursar manages school rail profiles" ON public.payee_rail_profiles;
CREATE POLICY "Bursar manages school rail profiles"
  ON public.payee_rail_profiles FOR ALL
  USING (
    payee_role = 'school'
    AND payee_account_id = public.get_auth_school_id_v2()
    AND public.get_auth_role() = 'bursar'
  )
  WITH CHECK (
    payee_role = 'school'
    AND payee_account_id = public.get_auth_school_id_v2()
    AND public.get_auth_role() = 'bursar'
  );

-- Parents can read their school's rail profiles (to know where to pay)
DROP POLICY IF EXISTS "Parents read school rail profiles" ON public.payee_rail_profiles;
CREATE POLICY "Parents read school rail profiles"
  ON public.payee_rail_profiles FOR SELECT
  USING (
    payee_role = 'school'
    AND payee_account_id = public.get_auth_school_id_v2()
  );

-- All authenticated users can read platform rail profiles
DROP POLICY IF EXISTS "All users read platform rail profiles" ON public.payee_rail_profiles;
CREATE POLICY "All users read platform rail profiles"
  ON public.payee_rail_profiles FOR SELECT
  USING (payee_role = 'platform');

-- ── 2. obligations ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.obligations (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type                public.obligation_type_et NOT NULL,

  payer_account_id    UUID NOT NULL,   -- parent user id OR school id
  payer_role          public.payer_role_et NOT NULL,
  -- e.g. "Adm. 2024-001" for parent, "Nairobi Academy" for school subscription
  payer_display_ref   TEXT NOT NULL,

  payee_account_id    UUID NOT NULL,   -- school id OR platform sentinel UUID
  payee_role          public.payee_role_et NOT NULL,

  -- FK back to the existing EduTrack invoice (for fee_term obligations)
  source_invoice_id   UUID REFERENCES public.invoices(id),

  amount_due          NUMERIC(14,2) NOT NULL CHECK (amount_due > 0),
  currency            TEXT NOT NULL DEFAULT 'KES',
  due_date            DATE NOT NULL,
  period_label        TEXT NOT NULL,   -- "Term 1 2026", "Term 2 Subscription"
  status              public.obligation_status_et NOT NULL DEFAULT 'open',
  balance             NUMERIC(14,2) NOT NULL,
  credit_balance      NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (credit_balance >= 0),

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT obligation_balance_non_negative CHECK (balance >= 0),
  CONSTRAINT obligation_balance_lte_due CHECK (balance <= amount_due)
);

CREATE INDEX IF NOT EXISTS obl_payer_account_id_idx ON public.obligations (payer_account_id);
CREATE INDEX IF NOT EXISTS obl_payee_account_id_idx ON public.obligations (payee_account_id);
CREATE INDEX IF NOT EXISTS obl_status_idx ON public.obligations (status) WHERE status IN ('open','partial');
CREATE INDEX IF NOT EXISTS obl_type_idx ON public.obligations (type);
CREATE INDEX IF NOT EXISTS obl_source_invoice_id_idx ON public.obligations (source_invoice_id);

ALTER TABLE public.obligations ENABLE ROW LEVEL SECURITY;

-- Bursar sees obligations where school is payee (fees) or payer (subscription)
DROP POLICY IF EXISTS "Bursar sees school obligations" ON public.obligations;
CREATE POLICY "Bursar sees school obligations"
  ON public.obligations FOR SELECT
  USING (
    public.get_auth_role() = 'bursar'
    AND (
      payee_account_id = public.get_auth_school_id_v2()
      OR payer_account_id = public.get_auth_school_id_v2()
    )
  );

-- Parents see their own fee_term obligations
DROP POLICY IF EXISTS "Parent sees own fee obligations" ON public.obligations;
CREATE POLICY "Parent sees own fee obligations"
  ON public.obligations FOR SELECT
  USING (
    payer_role = 'parent'
    AND payer_account_id = auth.uid()
  );

-- ── 3. submissions ────────────────────────────────────────────────────────────
-- BLINDNESS RULE enforced at DB level via constraint.

CREATE TABLE IF NOT EXISTS public.submissions (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- NULL on payee-side submissions (blindness rule)
  obligation_id           UUID REFERENCES public.obligations(id),

  submitter_role          public.submitter_role_et NOT NULL,
  submitter_id            UUID NOT NULL REFERENCES public.users(id),

  raw_message             TEXT,
  reference_code          TEXT NOT NULL,
  parsed_amount           NUMERIC(14,2) NOT NULL CHECK (parsed_amount > 0),
  parsed_currency         TEXT NOT NULL DEFAULT 'KES',
  parsed_transaction_at   TIMESTAMPTZ,
  payment_rail            public.payment_rail_et NOT NULL,
  source                  public.submission_source_et NOT NULL DEFAULT 'manual',
  status                  public.submission_status_et NOT NULL DEFAULT 'unmatched',

  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  matched_at              TIMESTAMPTZ,
  match_record_id         UUID,

  -- BLINDNESS RULE: payee submissions must never carry obligation_id
  CONSTRAINT payee_submission_must_be_blind
    CHECK (submitter_role <> 'payee' OR obligation_id IS NULL),
  -- Payer submissions must always be tied to an obligation
  CONSTRAINT payer_submission_must_have_obligation
    CHECK (submitter_role <> 'payer' OR obligation_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS sub_reference_code_idx ON public.submissions (reference_code);
CREATE INDEX IF NOT EXISTS sub_obligation_id_idx ON public.submissions (obligation_id);
CREATE INDEX IF NOT EXISTS sub_submitter_id_idx ON public.submissions (submitter_id);
CREATE INDEX IF NOT EXISTS sub_status_unmatched_idx ON public.submissions (status) WHERE status = 'unmatched';
CREATE INDEX IF NOT EXISTS sub_created_at_idx ON public.submissions (created_at);

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Any user sees their own submissions
DROP POLICY IF EXISTS "User sees own submissions" ON public.submissions;
CREATE POLICY "User sees own submissions"
  ON public.submissions FOR SELECT
  USING (submitter_id = auth.uid());

-- Bursar inserts blind payee submissions
DROP POLICY IF EXISTS "Bursar inserts payee submissions" ON public.submissions;
CREATE POLICY "Bursar inserts payee submissions"
  ON public.submissions FOR INSERT
  WITH CHECK (
    submitter_role = 'payee'
    AND submitter_id = auth.uid()
    AND obligation_id IS NULL
    AND public.get_auth_role() = 'bursar'
  );

-- Parent inserts payer submissions
DROP POLICY IF EXISTS "Parent inserts payer submissions" ON public.submissions;
CREATE POLICY "Parent inserts payer submissions"
  ON public.submissions FOR INSERT
  WITH CHECK (
    submitter_role = 'payer'
    AND submitter_id = auth.uid()
  );

-- Bursar sees matched submissions for their school's obligations
DROP POLICY IF EXISTS "Bursar sees matched submissions" ON public.submissions;
CREATE POLICY "Bursar sees matched submissions"
  ON public.submissions FOR SELECT
  USING (
    status = 'matched'
    AND obligation_id IN (
      SELECT id FROM public.obligations
      WHERE payee_account_id = public.get_auth_school_id_v2()
    )
    AND public.get_auth_role() = 'bursar'
  );

-- ── 4. match_records ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.match_records (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  obligation_id         UUID NOT NULL REFERENCES public.obligations(id),
  payer_submission_id   UUID NOT NULL REFERENCES public.submissions(id),
  payee_submission_id   UUID NOT NULL REFERENCES public.submissions(id),
  matched_amount        NUMERIC(14,2) NOT NULL CHECK (matched_amount > 0),
  currency              TEXT NOT NULL DEFAULT 'KES',
  match_method          public.match_method_et NOT NULL,
  override_reason       TEXT,
  override_by           UUID REFERENCES public.users(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT match_different_submissions CHECK (payer_submission_id <> payee_submission_id),
  CONSTRAINT override_requires_reason CHECK (
    match_method <> 'manual_override'
    OR (override_reason IS NOT NULL AND override_by IS NOT NULL)
  ),
  UNIQUE (payer_submission_id),
  UNIQUE (payee_submission_id)
);

CREATE INDEX IF NOT EXISTS mr_obligation_id_idx ON public.match_records (obligation_id);

-- Add deferred FK from submissions → match_records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'submissions_match_record_id_fkey'
  ) THEN
    ALTER TABLE public.submissions
      ADD CONSTRAINT submissions_match_record_id_fkey
      FOREIGN KEY (match_record_id) REFERENCES public.match_records(id);
  END IF;
END $$;

ALTER TABLE public.match_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Bursar sees match records for school" ON public.match_records;
CREATE POLICY "Bursar sees match records for school"
  ON public.match_records FOR SELECT
  USING (
    public.get_auth_role() = 'bursar'
    AND obligation_id IN (
      SELECT id FROM public.obligations
      WHERE payee_account_id = public.get_auth_school_id_v2()
    )
  );

DROP POLICY IF EXISTS "Parent sees own match records" ON public.match_records;
CREATE POLICY "Parent sees own match records"
  ON public.match_records FOR SELECT
  USING (
    payer_submission_id IN (
      SELECT id FROM public.submissions WHERE submitter_id = auth.uid()
    )
  );

-- ── 5. ledger_entries ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  obligation_id     UUID NOT NULL REFERENCES public.obligations(id),
  match_record_id   UUID REFERENCES public.match_records(id),
  entry_type        public.ledger_entry_type_et NOT NULL,
  amount            NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  currency          TEXT NOT NULL DEFAULT 'KES',
  balance_after     NUMERIC(14,2) NOT NULL CHECK (balance_after >= 0),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS le_obligation_id_idx ON public.ledger_entries (obligation_id);
CREATE INDEX IF NOT EXISTS le_match_record_id_idx ON public.ledger_entries (match_record_id);

-- Immutability trigger
CREATE OR REPLACE FUNCTION public.prevent_ledger_entry_update()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION
    'ledger_entries are immutable. To correct an entry, insert a new offsetting ledger_entry with entry_type = ''correction''.';
END;
$$;

DROP TRIGGER IF EXISTS ledger_entry_immutable ON public.ledger_entries;
CREATE TRIGGER ledger_entry_immutable
  BEFORE UPDATE ON public.ledger_entries
  FOR EACH ROW EXECUTE FUNCTION public.prevent_ledger_entry_update();

ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Bursar sees school ledger entries" ON public.ledger_entries;
CREATE POLICY "Bursar sees school ledger entries"
  ON public.ledger_entries FOR SELECT
  USING (
    public.get_auth_role() = 'bursar'
    AND obligation_id IN (
      SELECT id FROM public.obligations
      WHERE payee_account_id = public.get_auth_school_id_v2()
         OR payer_account_id = public.get_auth_school_id_v2()
    )
  );

DROP POLICY IF EXISTS "Parent sees own ledger entries" ON public.ledger_entries;
CREATE POLICY "Parent sees own ledger entries"
  ON public.ledger_entries FOR SELECT
  USING (
    obligation_id IN (
      SELECT id FROM public.obligations
      WHERE payer_role = 'parent' AND payer_account_id = auth.uid()
    )
  );

-- ── 6. dispute_cases ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.dispute_cases (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  obligation_id             UUID NOT NULL REFERENCES public.obligations(id),
  payer_submission_id       UUID REFERENCES public.submissions(id),
  payee_submission_id       UUID REFERENCES public.submissions(id),
  status                    public.dispute_status_et NOT NULL DEFAULT 'open',
  resolution_notes          TEXT,
  resolved_by               UUID REFERENCES public.users(id),
  resolved_at               TIMESTAMPTZ,
  payer_evidence_revealed   BOOLEAN NOT NULL DEFAULT FALSE,
  payee_evidence_revealed   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS dc_obligation_id_idx ON public.dispute_cases (obligation_id);
CREATE INDEX IF NOT EXISTS dc_status_open_idx ON public.dispute_cases (status) WHERE status = 'open';

ALTER TABLE public.dispute_cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parties see their own disputes" ON public.dispute_cases;
CREATE POLICY "Parties see their own disputes"
  ON public.dispute_cases FOR SELECT
  USING (
    obligation_id IN (
      SELECT id FROM public.obligations
      WHERE payee_account_id = public.get_auth_school_id_v2()
         OR payer_account_id = public.get_auth_school_id_v2()
         OR payer_account_id = auth.uid()
    )
  );

-- ── 7. notification_log ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notification_log (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event           TEXT NOT NULL,
  recipient_ids   UUID[] NOT NULL,
  obligation_id   UUID REFERENCES public.obligations(id),
  submission_id   UUID REFERENCES public.submissions(id),
  dispute_id      UUID REFERENCES public.dispute_cases(id),
  was_blind       BOOLEAN NOT NULL DEFAULT TRUE,
  payload         JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS nl_obligation_id_idx ON public.notification_log (obligation_id);
CREATE INDEX IF NOT EXISTS nl_event_idx ON public.notification_log (event);

ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

-- ── 8. Helper functions ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_retired_reference_codes()
RETURNS TABLE (reference_code TEXT)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT s.reference_code
  FROM public.submissions s
  WHERE s.status = 'matched'
    AND s.match_record_id IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.refresh_obligation_status(p_obligation_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_amount_due    NUMERIC;
  v_total_posted  NUMERIC;
  v_new_balance   NUMERIC;
  v_new_status    public.obligation_status_et;
BEGIN
  SELECT amount_due INTO v_amount_due
  FROM public.obligations WHERE id = p_obligation_id;

  SELECT COALESCE(SUM(amount), 0) INTO v_total_posted
  FROM public.ledger_entries
  WHERE obligation_id = p_obligation_id
    AND entry_type NOT IN ('correction', 'credit_apply');

  v_new_balance := GREATEST(0, v_amount_due - v_total_posted);

  IF v_new_balance = 0 AND v_total_posted >= v_amount_due THEN
    v_new_status := CASE WHEN v_total_posted > v_amount_due THEN 'overpaid' ELSE 'settled' END;
  ELSIF v_total_posted > 0 THEN
    v_new_status := 'partial';
  ELSE
    v_new_status := 'open';
  END IF;

  UPDATE public.obligations
  SET balance = v_new_balance, status = v_new_status, updated_at = NOW()
  WHERE id = p_obligation_id;
END;
$$;

-- ── 9. Seed: create obligations from existing EduTrack invoices ───────────────
-- For each unpaid/partial invoice, create an open fee_term obligation.
-- This is a one-time migration — idempotent via ON CONFLICT DO NOTHING.

INSERT INTO public.obligations (
  type, payer_account_id, payer_role, payer_display_ref,
  payee_account_id, payee_role,
  source_invoice_id, amount_due, currency,
  due_date, period_label, status, balance
)
SELECT
  'fee_term',
  -- Map to the first linked parent for this student (or the student's own user if no parent)
  COALESCE(
    (SELECT parent_id FROM public.student_parents WHERE student_id = i.student_id LIMIT 1),
    i.student_id  -- fallback
  ),
  'parent',
  COALESCE(
    (SELECT s.first_name || ' ' || s.last_name || ' (Adm. ' || s.admission_number || ')'
     FROM public.students s WHERE s.id = i.student_id),
    'Unknown Student'
  ),
  i.school_id,
  'school',
  i.id,
  i.amount,
  'KES',
  COALESCE(i.due_date, NOW()::DATE + 14),
  COALESCE(
    (SELECT at.name FROM public.academic_terms at WHERE at.id = i.term_id),
    'Unknown Term'
  ),
  CASE
    WHEN i.balance <= 0 THEN 'settled'
    WHEN i.balance < i.amount THEN 'partial'
    ELSE 'open'
  END,
  GREATEST(0, i.balance)
FROM public.invoices i
WHERE i.deleted_at IS NULL
ON CONFLICT DO NOTHING;

-- ── 10. Legacy table lockdown (READ-ONLY) ─────────────────────────────────────

-- fee_payments: read-only from now on
DROP POLICY IF EXISTS "Bursar can view fee payments" ON public.fee_payments;
CREATE POLICY "Bursar can view fee payments (legacy read-only)"
  ON public.fee_payments FOR SELECT
  USING (
    school_id = public.get_auth_school_id_v2()
    AND public.get_auth_role() = 'bursar'
  );

DROP POLICY IF EXISTS "Parents can view their fee payments" ON public.fee_payments;
CREATE POLICY "Parents can view their fee payments (legacy read-only)"
  ON public.fee_payments FOR SELECT
  USING (
    student_id IN (
      SELECT student_id FROM public.student_parents WHERE parent_id = auth.uid()
    )
  );

-- mpesa_stk_requests: read-only
DROP POLICY IF EXISTS "Bursars can view stk requests" ON public.mpesa_stk_requests;
CREATE POLICY "Bursars can view stk requests (legacy read-only)"
  ON public.mpesa_stk_requests FOR SELECT
  USING (
    school_id = public.get_auth_school_id_v2()
    AND public.get_auth_role() = 'bursar'
  );

-- ── 11. pg_cron: termly subscription obligation generation ────────────────────
-- EduTrack billing is termly (≈ 3x per year).
-- This cron runs monthly and creates an obligation only when a new term starts.
-- The actual term-based scheduling is handled by checking academic_terms.is_active.

SELECT cron.schedule(
  'generate-edutrack-subscription-obligations',
  '0 3 1 * *',
  $$
  INSERT INTO public.obligations (
    type, payer_account_id, payer_role, payer_display_ref,
    payee_account_id, payee_role,
    amount_due, currency, due_date, period_label,
    status, balance
  )
  SELECT
    'edutrack_subscription',
    s.account_id,
    'school',
    COALESCE(sc.name, 'Unknown School'),
    (SELECT value::uuid FROM public.billing_config WHERE key = 'platform_account_id'),
    'platform',
    COALESCE(pbp.price, 0),
    COALESCE(pbp.currency_code, 'KES'),
    (DATE_TRUNC('month', NOW()) + INTERVAL '14 days')::DATE,
    'Subscription - ' || TO_CHAR(NOW(), 'Mon YYYY'),
    'open',
    COALESCE(pbp.price, 0)
  FROM public.subscriptions s
  JOIN public.schools sc ON sc.id = s.account_id
  JOIN public.plan_bands pb ON pb.id = s.current_band_id
  LEFT JOIN public.plan_band_prices pbp ON pbp.band_id = pb.id AND pbp.currency_code = 'KES'
  WHERE s.product_key = 'edutrack'
    AND s.status IN ('active', 'past_due')
    -- Only generate when there is an active academic term (termly billing)
    AND EXISTS (
      SELECT 1 FROM public.academic_terms at
      WHERE at.school_id = s.account_id AND at.is_active = TRUE
    )
    -- Idempotency: skip if obligation already exists for this month
    AND NOT EXISTS (
      SELECT 1 FROM public.obligations o
      WHERE o.payer_account_id = s.account_id
        AND o.type = 'edutrack_subscription'
        AND DATE_TRUNC('month', o.created_at) = DATE_TRUNC('month', NOW())
    )
  ON CONFLICT DO NOTHING;
  $$
);
