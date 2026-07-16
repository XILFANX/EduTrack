-- ============================================================
-- Ensure core tables have RLS policies for teacher roles
-- The classes, students, attendance and subjects tables were
-- created by the platform but never received teacher-specific
-- read policies. Teachers querying with their auth token get
-- silently empty results due to RLS blocking.
-- ============================================================

-- CLASSES: Allow teachers to read classes in their school
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'classes' AND policyname = 'Teachers can read their school classes') THEN
    CREATE POLICY "Teachers can read their school classes"
      ON public.classes FOR SELECT
      USING (
        school_id IN (
          SELECT school_id FROM public.users WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- STUDENTS: Allow teachers to read students in their school
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'students' AND policyname = 'Teachers can read their school students') THEN
    CREATE POLICY "Teachers can read their school students"
      ON public.students FOR SELECT
      USING (
        school_id IN (
          SELECT school_id FROM public.users WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- ATTENDANCE: Allow class teachers to read and insert attendance
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'attendance' AND policyname = 'Teachers can read attendance') THEN
    CREATE POLICY "Teachers can read attendance"
      ON public.attendance FOR SELECT
      USING (
        school_id IN (
          SELECT school_id FROM public.users WHERE id = auth.uid()
        )
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'attendance' AND policyname = 'Teachers can insert attendance') THEN
    CREATE POLICY "Teachers can insert attendance"
      ON public.attendance FOR INSERT
      WITH CHECK (
        school_id IN (
          SELECT school_id FROM public.users WHERE id = auth.uid()
        )
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'attendance' AND policyname = 'Teachers can update attendance') THEN
    CREATE POLICY "Teachers can update attendance"
      ON public.attendance FOR UPDATE
      USING (
        school_id IN (
          SELECT school_id FROM public.users WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- CLASS_SUBJECTS: Teachers need to read their assignments
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'class_subjects' AND policyname = 'Teachers can read class subjects') THEN
    CREATE POLICY "Teachers can read class subjects"
      ON public.class_subjects FOR SELECT
      USING (
        school_id IN (
          SELECT school_id FROM public.users WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- SUBJECTS: Teachers need to read subjects
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subjects' AND policyname = 'Teachers can read subjects') THEN
    CREATE POLICY "Teachers can read subjects"
      ON public.subjects FOR SELECT
      USING (
        school_id IN (
          SELECT school_id FROM public.users WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- EXAM_RESULTS: Teachers can read and write results for their school
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exam_results' AND policyname = 'Teachers can read exam results') THEN
    CREATE POLICY "Teachers can read exam results"
      ON public.exam_results FOR SELECT
      USING (
        school_id IN (
          SELECT school_id FROM public.users WHERE id = auth.uid()
        )
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exam_results' AND policyname = 'Teachers can insert exam results') THEN
    CREATE POLICY "Teachers can insert exam results"
      ON public.exam_results FOR INSERT
      WITH CHECK (
        school_id IN (
          SELECT school_id FROM public.users WHERE id = auth.uid()
        )
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exam_results' AND policyname = 'Teachers can update exam results') THEN
    CREATE POLICY "Teachers can update exam results"
      ON public.exam_results FOR UPDATE
      USING (
        school_id IN (
          SELECT school_id FROM public.users WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- ACADEMIC_TERMS: All school members should read terms
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'academic_terms' AND policyname = 'School members can read terms') THEN
    CREATE POLICY "School members can read terms"
      ON public.academic_terms FOR SELECT
      USING (
        school_id IN (
          SELECT school_id FROM public.users WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- FEE_PAYMENTS: Parents can see payments for their linked students
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fee_payments' AND policyname = 'School members can read fee payments') THEN
    CREATE POLICY "School members can read fee payments"
      ON public.fee_payments FOR SELECT
      USING (
        school_id IN (
          SELECT school_id FROM public.users WHERE id = auth.uid()
        )
        OR student_id IN (
          SELECT student_id FROM public.student_parents WHERE parent_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
