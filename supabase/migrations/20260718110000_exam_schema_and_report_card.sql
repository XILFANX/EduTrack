-- Add year_id to exams table (term_id already exists, just need year_id for the Session Engine)
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL;

-- Add a class_id to exams so we know which class an exam is for
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL;

-- Add remarks to exam_results if not already there
ALTER TABLE public.exam_results ADD COLUMN IF NOT EXISTS teacher_remarks TEXT;

-- Create a view for report card data to simplify queries
CREATE OR REPLACE VIEW public.report_card_view AS
SELECT
  er.id as result_id,
  er.student_id,
  er.exam_id,
  er.subject_id,
  er.score,
  er.grade,
  er.remarks,
  er.teacher_remarks,
  er.created_at,
  e.name as exam_name,
  e.max_score,
  e.term_id,
  e.year_id,
  e.class_id,
  s.name as subject_name,
  s.code as subject_code,
  st.first_name,
  st.last_name,
  st.admission_number,
  st.photo_url,
  st.class_id as student_class_id,
  at.name as term_name,
  ay.name as year_name,
  c.name as class_name,
  sch.name as school_name,
  sch.logo_url as school_logo_url,
  sch.id as school_id
FROM public.exam_results er
JOIN public.exams e ON er.exam_id = e.id
JOIN public.subjects s ON er.subject_id = s.id
JOIN public.students st ON er.student_id = st.id
LEFT JOIN public.academic_terms at ON e.term_id = at.id
LEFT JOIN public.academic_years ay ON e.year_id = ay.id
LEFT JOIN public.classes c ON e.class_id = c.id
JOIN public.schools sch ON er.school_id = sch.id;
