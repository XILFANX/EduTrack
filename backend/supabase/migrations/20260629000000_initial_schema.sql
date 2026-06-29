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
