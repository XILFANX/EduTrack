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
