-- Phase 7: Robust Exam Workflow

-- 1. Exam Timetables
CREATE TABLE IF NOT EXISTS public.exam_timetables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  exam_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(exam_id, subject_id, class_id)
);

-- 2. Exam Grading Status
-- Tracks the workflow of grading per subject/class combo
CREATE TABLE IF NOT EXISTS public.exam_grading_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'submitted', 'finalized'
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  finalized_at TIMESTAMPTZ,
  finalized_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(exam_id, subject_id, class_id)
);

-- RLS
ALTER TABLE public.exam_timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_grading_status ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  -- Admins can manage all
  CREATE POLICY "Admins manage exam_timetables" ON public.exam_timetables FOR ALL USING (
    school_id IN (SELECT school_id FROM public.users WHERE id = auth.uid() AND role::text IN ('admin', 'principal', 'headteacher'))
  );
  CREATE POLICY "School users read exam_timetables" ON public.exam_timetables FOR SELECT USING (
    school_id IN (SELECT school_id FROM public.users WHERE id = auth.uid())
  );
  
  -- Admins can manage grading status
  CREATE POLICY "Admins manage exam_grading_status" ON public.exam_grading_status FOR ALL USING (
    school_id IN (SELECT school_id FROM public.users WHERE id = auth.uid() AND role::text IN ('admin', 'principal', 'headteacher'))
  );
  -- Teachers can read and update grading status
  CREATE POLICY "Staff manage exam_grading_status" ON public.exam_grading_status FOR SELECT USING (
    school_id IN (SELECT school_id FROM public.users WHERE id = auth.uid())
  );
  CREATE POLICY "Staff update exam_grading_status" ON public.exam_grading_status FOR UPDATE USING (
    school_id IN (SELECT school_id FROM public.users WHERE id = auth.uid() AND role::text IN ('class_teacher', 'subject_teacher'))
  );
  CREATE POLICY "Staff insert exam_grading_status" ON public.exam_grading_status FOR INSERT WITH CHECK (
    school_id IN (SELECT school_id FROM public.users WHERE id = auth.uid() AND role::text IN ('class_teacher', 'subject_teacher'))
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
