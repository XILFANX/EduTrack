-- Add teacher_id to subjects table
alter table public.subjects add column teacher_id uuid references public.users(id);
