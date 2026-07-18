import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { CalendarDays } from 'lucide-react'
import { TeacherScheduleView } from '@/components/teacher/teacher-schedule-view'

export const dynamic = 'force-dynamic'

export default async function ParentTimetablePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id, role')
    .eq('id', user.id)
    .single()

  const p = profile as any
  if (!p?.school_id || p.role !== 'parent') redirect('/parent/dashboard')

  const adminClient = createAdminClient()

  // Find parent's children
  const { data: links } = await adminClient
    .from('student_parents' as any)
    .select('student_id')
    .eq('parent_id', user.id)

  const studentIds = ((links as any[]) || []).map((l: any) => l.student_id)

  // Get all class IDs for those children
  let classIds: string[] = []
  if (studentIds.length > 0) {
    const { data: students } = await adminClient
      .from('students')
      .select('class_id')
      .in('id', studentIds)
      .not('class_id', 'is', null)

    classIds = [...new Set((students || []).map((s: any) => s.class_id).filter(Boolean))] as string[]
  }

  // Fetch periods
  const { data: periods } = await supabase
    .from('timetable_periods' as any)
    .select('*')
    .eq('school_id', p.school_id)
    .order('sort_order')
    .order('start_time')

  // Fetch timetable slots for those classes
  let slots: any[] = []
  if (classIds.length > 0) {
    const { data: slotData } = await adminClient
      .from('timetable_slots' as any)
      .select('period_id, day_of_week, subject_id, class_id, timetable_periods(*), subjects(name), classes(name)')
      .in('class_id', classIds)

    slots = (slotData || []) as any[]
  }

  return (
    <div className="space-y-8 max-w-4xl pb-24">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
          <CalendarDays className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Class Timetable</h1>
          <p className="text-sm text-muted-foreground">Your child's weekly class schedule.</p>
        </div>
      </div>

      <TeacherScheduleView
        periods={(periods as any[]) || []}
        slots={slots}
        roleName="Parent"
      />
    </div>
  )
}
