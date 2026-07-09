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
