DROP TYPE IF EXISTS user_role CASCADE;
DROP TABLE IF EXISTS public.schools CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.student_parents CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;
DROP TABLE IF EXISTS public.academic_terms CASCADE;
DROP TABLE IF EXISTS public.fee_structures CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.invoice_items CASCADE;
DROP TABLE IF EXISTS public.fee_payments CASCADE;
DROP TABLE IF EXISTS public.inventory_ledger CASCADE;
DROP TABLE IF EXISTS public.bus_routes CASCADE;
DROP TABLE IF EXISTS public.salary_advances CASCADE;
DROP TABLE IF EXISTS public.exams CASCADE;
DROP TABLE IF EXISTS public.exam_results CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.conversation_participants CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.invitations CASCADE;
DROP TABLE IF EXISTS public.mpesa_stk_requests CASCADE;

-- EduTrack Initial Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Core Entities
create type user_role as enum ('admin', 'principal', 'class_teacher', 'subject_teacher', 'bursar', 'librarian', 'storekeeper', 'transport_matron', 'parent');

create table public.schools (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  domain text unique,
  address text,
  subscription_tier text default 'Trial',
  created_at timestamp with time zone default now(),
  deleted_at timestamp with time zone
);

create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  school_id uuid references public.schools(id),
  role user_role not null,
  full_name text not null,
  phone_number text not null,
  email text,
  created_at timestamp with time zone default now(),
  deleted_at timestamp with time zone
);

-- Academic Entities
create table public.classes (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references public.schools(id) not null,
  name text not null, -- e.g. "Grade 1", "Form 4"
  class_teacher_id uuid references public.users(id),
  created_at timestamp with time zone default now(),
  deleted_at timestamp with time zone
);

create table public.students (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references public.schools(id) not null,
  class_id uuid references public.classes(id),
  first_name text not null,
  last_name text not null,
  admission_number text not null,
  dob date,
  created_at timestamp with time zone default now(),
  deleted_at timestamp with time zone,
  unique(school_id, admission_number)
);

create table public.student_parents (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.students(id) not null,
  parent_id uuid references public.users(id) not null,
  relationship text, -- 'Father', 'Mother', 'Guardian'
  unique(student_id, parent_id)
);

create table public.subjects (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references public.schools(id) not null,
  name text not null,
  created_at timestamp with time zone default now(),
  deleted_at timestamp with time zone
);

-- Financial & Operational Entities
create table public.academic_terms (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references public.schools(id) not null,
  name text not null, -- e.g., "Term 1 - 2026"
  start_date date not null,
  end_date date not null,
  is_active boolean default false,
  created_at timestamp with time zone default now()
);

create table public.fee_structures (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references public.schools(id) not null,
  term_id uuid references public.academic_terms(id) not null,
  class_id uuid references public.classes(id), -- If null, applies to the whole school
  amount numeric not null,
  description text, -- e.g., "Tuition Fee", "Transport Fee"
  created_at timestamp with time zone default now()
);

create table public.invoices (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references public.schools(id) not null,
  student_id uuid references public.students(id) not null,
  term_id uuid references public.academic_terms(id) not null,
  amount numeric not null,
  balance numeric not null,
  due_date date,
  status text default 'unpaid', -- 'unpaid', 'partial', 'paid'
  created_at timestamp with time zone default now(),
  deleted_at timestamp with time zone
);

create table public.invoice_items (
  id uuid default uuid_generate_v4() primary key,
  invoice_id uuid references public.invoices(id) on delete cascade not null,
  description text not null,
  amount numeric not null
);

create table public.fee_payments (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references public.schools(id) not null,
  invoice_id uuid references public.invoices(id) not null,
  student_id uuid references public.students(id) not null,
  amount numeric not null,
  payment_method text not null, -- 'M-Pesa', 'Bank', 'Cash'
  mpesa_receipt text unique,
  payment_date timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

create table public.inventory_ledger (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references public.schools(id) not null,
  item_name text not null,
  quantity_change numeric not null, -- Positive for IN, Negative for OUT
  recorded_by uuid references public.users(id) not null,
  notes text,
  created_at timestamp with time zone default now()
);

create table public.bus_routes (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references public.schools(id) not null,
  route_name text not null,
  driver_name text,
  vehicle_registration text,
  created_at timestamp with time zone default now(),
  deleted_at timestamp with time zone
);

create table public.salary_advances (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references public.schools(id) not null,
  staff_id uuid references public.users(id) not null,
  amount numeric not null,
  status text default 'Pending', -- 'Pending', 'Approved', 'Deducted'
  created_at timestamp with time zone default now()
);

-- Basic RLS
alter table public.schools enable row level security;
alter table public.users enable row level security;
alter table public.students enable row level security;
alter table public.invoices enable row level security;
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
-- Migration: Communications (Announcements & Direct Messaging)

-- 1. Announcements (Global / Group Broadcasts)
create table public.announcements (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references public.schools(id) not null,
  title text not null,
  body text not null,
  target_audience text not null default 'All', -- 'All', 'Parents', 'Staff', 'Teachers'
  author_id uuid references public.users(id) not null,
  created_at timestamp with time zone default now()
);

-- 2. Conversations (Direct Message Threads)
create table public.conversations (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references public.schools(id) not null,
  title text, -- Optional, e.g. "Grade 4 Parents" or null for 1-on-1
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3. Conversation Participants
create table public.conversation_participants (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  user_id uuid references public.users(id) not null,
  last_read_at timestamp with time zone default now(),
  joined_at timestamp with time zone default now(),
  unique(conversation_id, user_id)
);

-- 4. Messages
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.users(id) not null,
  content text not null,
  created_at timestamp with time zone default now()
);

-- Basic RLS
alter table public.announcements enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
-- RLS Policies for EduTrack

-- Helper function to get current user's school_id
create or replace function public.get_auth_school_id()
returns uuid as $$
  select school_id from public.users where id = auth.uid();
$$ language sql security definer;

-- Helper function to get current user's role
create or replace function public.get_auth_role()
returns public.user_role as $$
  select role from public.users where id = auth.uid();
$$ language sql security definer;

-- 1. Schools
create policy "Users can view their own school"
  on public.schools for select
  using (id = public.get_auth_school_id());

-- 2. Users
create policy "Users can view other users in their school"
  on public.users for select
  using (school_id = public.get_auth_school_id() or id = auth.uid());

create policy "Principals can insert users in their school"
  on public.users for insert
  with check (school_id = public.get_auth_school_id() and public.get_auth_role() = 'principal'::user_role);

create policy "Principals can update users in their school"
  on public.users for update
  using (school_id = public.get_auth_school_id() and public.get_auth_role() = 'principal'::user_role);

-- 3. Classes
create policy "Users can view classes in their school"
  on public.classes for select
  using (school_id = public.get_auth_school_id());

create policy "Principals can manage classes"
  on public.classes for all
  using (school_id = public.get_auth_school_id() and public.get_auth_role() = 'principal'::user_role);

-- 4. Students
create policy "Staff can view students in their school"
  on public.students for select
  using (school_id = public.get_auth_school_id() and public.get_auth_role() != 'parent'::user_role);

create policy "Parents can view their own children"
  on public.students for select
  using (
    id in (
      select student_id from public.student_parents where parent_id = auth.uid()
    )
  );

create policy "Principals can manage students"
  on public.students for all
  using (school_id = public.get_auth_school_id() and public.get_auth_role() = 'principal'::user_role);

-- 5. Invoices
create policy "Staff can view invoices in their school"
  on public.invoices for select
  using (school_id = public.get_auth_school_id() and public.get_auth_role() != 'parent'::user_role);

create policy "Parents can view their children's invoices"
  on public.invoices for select
  using (
    student_id in (
      select student_id from public.student_parents where parent_id = auth.uid()
    )
  );

create policy "Bursars can manage invoices"
  on public.invoices for all
  using (school_id = public.get_auth_school_id() and public.get_auth_role() = 'bursar'::user_role);

-- 6. Attendance
create policy "Staff can view attendance in their school"
  on public.attendance for select
  using (school_id = public.get_auth_school_id() and public.get_auth_role() != 'parent'::user_role);

create policy "Parents can view their children's attendance"
  on public.attendance for select
  using (
    student_id in (
      select student_id from public.student_parents where parent_id = auth.uid()
    )
  );

create policy "Teachers can insert attendance"
  on public.attendance for insert
  with check (school_id = public.get_auth_school_id() and public.get_auth_role() in ('class_teacher'::user_role, 'subject_teacher'::user_role, 'principal'::user_role));

create policy "Teachers can update attendance"
  on public.attendance for update
  using (school_id = public.get_auth_school_id() and public.get_auth_role() in ('class_teacher'::user_role, 'subject_teacher'::user_role, 'principal'::user_role));

-- 7. Exam Results
create policy "Staff can view exam results in their school"
  on public.exam_results for select
  using (school_id = public.get_auth_school_id() and public.get_auth_role() != 'parent'::user_role);

create policy "Parents can view their children's exam results"
  on public.exam_results for select
  using (
    student_id in (
      select student_id from public.student_parents where parent_id = auth.uid()
    )
  );

create policy "Teachers can manage exam results"
  on public.exam_results for all
  using (school_id = public.get_auth_school_id() and public.get_auth_role() in ('class_teacher'::user_role, 'subject_teacher'::user_role, 'principal'::user_role));
-- Migration: Invites System (Delegated Onboarding)

create table public.invitations (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references public.schools(id) not null,
  token text unique not null,
  role public.user_role not null,
  target_phone text,
  target_name text,
  target_entity_id uuid, -- e.g. student_id if role is parent, or class_id if teacher
  created_by uuid references public.users(id) not null,
  used_by uuid references public.users(id),
  used_at timestamp with time zone,
  reset_otp text,
  reset_otp_expires_at timestamp with time zone,
  expires_at timestamp with time zone not null default (now() + interval '7 days'),
  created_at timestamp with time zone default now()
);

-- RLS for invitations
alter table public.invitations enable row level security;

create policy "Users can view invites in their school"
  on public.invitations for select
  using (school_id = public.get_auth_school_id());

create policy "Principals can insert invites"
  on public.invitations for insert
  with check (school_id = public.get_auth_school_id() and public.get_auth_role() = 'principal'::user_role);

create policy "Class teachers can insert parent invites"
  on public.invitations for insert
  with check (
    school_id = public.get_auth_school_id() 
    and public.get_auth_role() = 'class_teacher'::user_role
    and role = 'parent'::user_role
  );
-- Migration: M-Pesa STK Push tracking

create table public.mpesa_stk_requests (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references public.schools(id) not null,
  invoice_id uuid references public.invoices(id) not null,
  student_id uuid references public.students(id) not null,
  checkout_request_id text unique not null,
  amount numeric not null,
  phone_number text not null,
  status text default 'Pending', -- 'Pending', 'Completed', 'Failed'
  created_at timestamp with time zone default now()
);

-- RLS
alter table public.mpesa_stk_requests enable row level security;

create policy "Bursars can view stk requests"
  on public.mpesa_stk_requests for select
  using (school_id = public.get_auth_school_id() and public.get_auth_role() = 'bursar'::user_role);

create policy "Parents can view their own stk requests"
  on public.mpesa_stk_requests for select
  using (
    student_id in (
      select student_id from public.student_parents where parent_id = auth.uid()
    )
  );
-- Add teacher_id to subjects table
alter table public.subjects add column teacher_id uuid references public.users(id);
