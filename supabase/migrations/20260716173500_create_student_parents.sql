-- ============================================================
-- Create student_parents join table
-- This table was used in the codebase but was never formally created
-- ============================================================

CREATE TABLE IF NOT EXISTS public.student_parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    relationship TEXT DEFAULT 'Guardian',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(student_id, parent_id)
);

ALTER TABLE public.student_parents ENABLE ROW LEVEL SECURITY;

-- Parents can view their own links; staff can view all for their school
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'student_parents' AND policyname = 'Allow parent to view own links') THEN
    CREATE POLICY "Allow parent to view own links"
      ON public.student_parents FOR SELECT
      USING (
        parent_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid()
            AND role IN ('principal', 'class_teacher', 'subject_teacher', 'bursar')
        )
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'student_parents' AND policyname = 'Allow insert on student_parents') THEN
    CREATE POLICY "Allow insert on student_parents"
      ON public.student_parents FOR INSERT
      WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'student_parents' AND policyname = 'Allow delete on student_parents') THEN
    CREATE POLICY "Allow delete on student_parents"
      ON public.student_parents FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid()
            AND role IN ('principal', 'class_teacher')
        )
      );
  END IF;
END $$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
