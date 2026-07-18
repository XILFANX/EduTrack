-- ============================================================
-- Add student_routes for Transport Portal
-- Links students to their designated bus routes
-- ============================================================

CREATE TABLE IF NOT EXISTS public.student_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    route_id UUID NOT NULL REFERENCES public.transport_routes(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(student_id, route_id)
);

ALTER TABLE public.student_routes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'student_routes' AND policyname = 'School isolation for student_routes') THEN
    CREATE POLICY "School isolation for student_routes" ON public.student_routes FOR ALL USING (school_id = (SELECT school_id FROM users WHERE id = auth.uid()));
  END IF;
END $$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
