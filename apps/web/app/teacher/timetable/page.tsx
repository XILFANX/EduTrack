import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { CalendarDays } from 'lucide-react'
import { TeacherScheduleView } from '@/components/teacher/teacher-schedule-view'

export const dynamic = 'force-dynamic'

export default async function TeacherTimetablePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id, role, full_name, salutation')
    .eq('id', user.id)
    .single()

  const p = profile as any
  if (!p?.school_id) redirect('/login')

  const adminClient = createAdminClient()

  // Fetch all periods for this school
  const { data: periods } = await supabase
    .from('timetable_periods' as any)
    .select('*')
    .eq('school_id', p.school_id)
    .order('sort_order')
    .order('start_time')

  let slots: any[] = []

  if (p.role === 'class_teacher') {
    // Get the class this teacher manages
    const { data: cls } = await supabase
      .from('classes')
      .select('id, name')
      .eq('class_teacher_id', user.id)
      .eq('school_id', p.school_id)
      .single()

    if (cls) {
      const { data: slotData } = await adminClient
        .from('timetable_slots' as any)
        .select('period_id, day_of_week, subject_id, class_id, timetable_periods(*), subjects(name), classes(name)')
        .eq('class_id', (cls as any).id)

      slots = (slotData || []) as any[]
    }
  } else if (p.role === 'subject_teacher') {
    // Get all class-subject assignments for this teacher
    const { data: assignments } = await supabase
      .from('class_subjects')
      .select('class_id, subject_id')
      .eq('teacher_id', user.id)
      .eq('school_id', p.school_id)

    if (assignments && assignments.length > 0) {
      const classIds = [...new Set((assignments as any[]).map(a => a.class_id))]
      const subjectIds = [...new Set((assignments as any[]).map(a => a.subject_id))]

      const { data: slotData } = await adminClient
        .from('timetable_slots' as any)
        .select('period_id, day_of_week, subject_id, class_id, timetable_periods(*), subjects(name), classes(name)')
        .in('class_id', classIds)
        .in('subject_id', subjectIds)

      slots = (slotData || []) as any[]
    }
  }

  const roleName = p.role === 'class_teacher' ? 'Class Teacher' : 'Subject Teacher'

  return (
    <div className="space-y-8 max-w-5xl pb-24">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
          <CalendarDays className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Schedule</h1>
          <p className="text-sm text-muted-foreground">Your weekly teaching timetable.</p>
        </div>
      </div>

      <TeacherScheduleView
        periods={(periods as any[]) || []}
        slots={slots}
        roleName={roleName}
      />
    </div>
  )
}
