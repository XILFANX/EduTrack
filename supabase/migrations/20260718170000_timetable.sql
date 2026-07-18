-- ═══════════════════════════════════════════════════════════════
-- Timetable Module
-- ═══════════════════════════════════════════════════════════════

-- Table: timetable_periods
-- Defines reusable named periods (e.g. "Period 1", "Break", "Lunch")
CREATE TABLE IF NOT EXISTS public.timetable_periods (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id    UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name         VARCHAR(80) NOT NULL,
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  is_break     BOOLEAN NOT NULL DEFAULT false,  -- Break/lunch slots don't need a subject
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: timetable_slots
-- One slot = one class having one subject/period on one day
CREATE TABLE IF NOT EXISTS public.timetable_slots (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id    UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id     UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id   UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  period_id    UUID NOT NULL REFERENCES public.timetable_periods(id) ON DELETE CASCADE,
  day_of_week  SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),  -- 1=Mon, 7=Sun
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (class_id, period_id, day_of_week)  -- One subject per slot per class
);

-- ─── RLS ───────────────────────────────────────────────────────

ALTER TABLE public.timetable_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_slots   ENABLE ROW LEVEL SECURITY;

-- Admins can fully manage periods
DO $$ BEGIN
  CREATE POLICY "Admins manage timetable_periods"
    ON public.timetable_periods FOR ALL
    USING (
      school_id IN (
        SELECT school_id FROM public.users
        WHERE id = auth.uid()
          AND role::text IN ('admin', 'principal', 'headteacher')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Everyone in the school can read periods
DO $$ BEGIN
  CREATE POLICY "School users read timetable_periods"
    ON public.timetable_periods FOR SELECT
    USING (
      school_id IN (
        SELECT school_id FROM public.users WHERE id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Admins can fully manage slots
DO $$ BEGIN
  CREATE POLICY "Admins manage timetable_slots"
    ON public.timetable_slots FOR ALL
    USING (
      school_id IN (
        SELECT school_id FROM public.users
        WHERE id = auth.uid()
          AND role::text IN ('admin', 'principal', 'headteacher')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Everyone in the school can read slots
DO $$ BEGIN
  CREATE POLICY "School users read timetable_slots"
    ON public.timetable_slots FOR SELECT
    USING (
      school_id IN (
        SELECT school_id FROM public.users WHERE id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
