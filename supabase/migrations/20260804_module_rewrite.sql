-- ============================================================
-- EduTrack: Core Module Rewrite — Schema Extension
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Extend timetable_slots: teacher assignment + term scoping + publish state
ALTER TABLE timetable_slots
  ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS year_id uuid REFERENCES academic_years(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS term_id uuid REFERENCES academic_terms(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_timetable_slots_teacher
  ON timetable_slots(teacher_id) WHERE teacher_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_timetable_slots_term
  ON timetable_slots(term_id, school_id);

-- 2. School-wide Exam Events
CREATE TABLE IF NOT EXISTS exam_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  year_id uuid REFERENCES academic_years(id),
  term_id uuid REFERENCES academic_terms(id),
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS exam_event_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_event_id uuid NOT NULL REFERENCES exam_events(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  UNIQUE(exam_event_id, class_id)
);

-- 3. Report Cards
CREATE TABLE IF NOT EXISTS report_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  exam_event_id uuid NOT NULL REFERENCES exam_events(id) ON DELETE CASCADE,
  total_score numeric DEFAULT 0,
  average_score numeric DEFAULT 0,
  overall_grade text,
  position_in_class int,
  class_size int,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, exam_event_id)
);

-- 4. Extend exam_results with lifecycle fields
ALTER TABLE exam_results
  ADD COLUMN IF NOT EXISTS exam_event_id uuid REFERENCES exam_events(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_comment text;

-- 5. Fee Templates (multi-component)
CREATE TABLE IF NOT EXISTS fee_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  name text NOT NULL,
  year_id uuid REFERENCES academic_years(id),
  term_id uuid REFERENCES academic_terms(id),
  class_id uuid REFERENCES classes(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fee_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES fee_templates(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  sort_order int NOT NULL DEFAULT 0
);

-- 6. Extend invoices with template link + discount support
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES fee_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS discount_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_reason text;
