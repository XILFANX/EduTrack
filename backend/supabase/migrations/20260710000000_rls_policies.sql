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
