create table if not exists public.discipline_logs (
    id uuid default gen_random_uuid() primary key,
    school_id uuid not null references public.schools(id) on delete cascade,
    class_id uuid not null references public.classes(id) on delete cascade,
    student_id uuid not null references public.students(id) on delete cascade,
    recorded_by uuid not null references public.users(id) on delete cascade,
    title text not null,
    description text not null,
    action_taken text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.discipline_logs enable row level security;

create policy "Users can view discipline logs in their school"
    on public.discipline_logs for select
    using (school_id in (
        select school_id from public.users where id = auth.uid()
    ));

create policy "Users can insert discipline logs in their school"
    on public.discipline_logs for insert
    with check (school_id in (
        select school_id from public.users where id = auth.uid()
    ));
