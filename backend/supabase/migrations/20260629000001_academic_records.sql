-- Migration: Academic Records (Attendance & Grades)

-- 1. Exams Table
create table public.exams (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references public.schools(id) not null,
  term_id uuid references public.academic_terms(id) not null,
  name text not null, -- e.g., "Term 1 Mid-Term", "End of Year"
  max_score numeric default 100,
  created_at timestamp with time zone default now()
);

-- 2. Exam Results Table
create table public.exam_results (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references public.schools(id) not null,
  exam_id uuid references public.exams(id) not null,
  student_id uuid references public.students(id) not null,
  subject_id uuid references public.subjects(id) not null,
  score numeric not null,
  grade text, -- e.g., 'A', 'B+', etc.
  remarks text,
  recorded_by uuid references public.users(id), -- The teacher who entered it
  created_at timestamp with time zone default now(),
  unique(exam_id, student_id, subject_id)
);

-- 3. Attendance Table
create table public.attendance (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references public.schools(id) not null,
  class_id uuid references public.classes(id) not null,
  student_id uuid references public.students(id) not null,
  date date not null default current_date,
  status text not null, -- 'Present', 'Absent', 'Late'
  notes text,
  recorded_by uuid references public.users(id),
  created_at timestamp with time zone default now(),
  unique(student_id, date)
);

-- Basic RLS for new tables
alter table public.exams enable row level security;
alter table public.exam_results enable row level security;
alter table public.attendance enable row level security;
