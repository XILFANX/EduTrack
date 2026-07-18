-- Grade scales for dynamic result grading
CREATE TABLE IF NOT EXISTS public.grade_scales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  grade VARCHAR(5) NOT NULL,
  min_score NUMERIC(5, 2) NOT NULL,
  max_score NUMERIC(5, 2) NOT NULL,
  points INTEGER NOT NULL,
  remarks VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS for grade scales
ALTER TABLE public.grade_scales ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Admins can manage grade scales"
    ON public.grade_scales FOR ALL
    USING (
      school_id IN (
        SELECT school_id FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'principal', 'headteacher')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff can view grade scales"
    ON public.grade_scales FOR SELECT
    USING (
      school_id IN (
        SELECT school_id FROM public.users WHERE id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
