import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { CalendarDays, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

const DAYS = [
  { num: 1, label: 'Monday' },
  { num: 2, label: 'Tuesday' },
  { num: 3, label: 'Wednesday' },
  { num: 4, label: 'Thursday' },
  { num: 5, label: 'Friday' },
]

function fmt12(t: string) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

export default async function TeacherTimetablePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase
    .from('users')
    .select('school_id, role, full_name')
    .eq('id', user.id)
    .single()

  const profile = profileRaw as any
  if (!profile?.school_id) redirect('/login')

  const adminClient = createAdminClient()
  const isClassTeacher = profile.role === 'class_teacher'
  const isSubjectTeacher = profile.role === 'subject_teacher'

  // Fetch periods (shared bell schedule)
  const { data: periodsRaw } = await supabase
    .from('timetable_periods' as any)
    .select('id, name, start_time, end_time, is_break, sort_order')
    .eq('school_id', profile.school_id)
    .order('sort_order')
    .order('start_time')
  const periods = (periodsRaw || []) as any[]

  // Active term
  const { data: activeTerm } = await supabase
    .from('academic_terms')
    .select('id, name')
    .eq('school_id', profile.school_id)
    .eq('is_active', true)
    .single()

  const termId = (activeTerm as any)?.id || null

  let slots: any[] = []
  let contextLabel = ''
  let className = ''

  if (isClassTeacher) {
    // Find teacher's class
    const { data: cls } = await supabase
      .from('classes')
      .select('id, name')
      .eq('class_teacher_id', user.id)
      .eq('school_id', profile.school_id)
      .single()

    className = (cls as any)?.name || ''

    if (cls) {
      let query = adminClient
        .from('timetable_slots' as any)
        .select('period_id, day_of_week, subject_id, teacher_id, is_published, subjects(name), users(full_name)')
        .eq('class_id', (cls as any).id)
        .eq('school_id', profile.school_id)
        .eq('is_published', true)

      if (termId) query = query.eq('term_id', termId)
      const { data } = await query
      slots = (data || []) as any[]
    }
    contextLabel = `Class Teacher · ${className}`

  } else if (isSubjectTeacher) {
    // Get all class-subject assignments for this teacher
    const { data: assignments } = await supabase
      .from('class_subjects')
      .select('class_id, subject_id, classes(name), subjects(name)')
      .eq('teacher_id', user.id)
      .eq('school_id', profile.school_id)

    const asgn = (assignments || []) as any[]
    const classIds = [...new Set(asgn.map((a: any) => a.class_id))]
    const subjectIds = [...new Set(asgn.map((a: any) => a.subject_id))]

    if (classIds.length > 0 && subjectIds.length > 0) {
      let query = adminClient
        .from('timetable_slots' as any)
        .select('period_id, day_of_week, subject_id, class_id, teacher_id, is_published, subjects(name), classes(name), users(full_name)')
        .in('class_id', classIds)
        .in('subject_id', subjectIds)
        .eq('teacher_id', user.id)
        .eq('is_published', true)

      if (termId) query = query.eq('term_id', termId)
      const { data } = await query
      slots = (data || []) as any[]
    }
    contextLabel = 'Subject Teacher · My Schedule'
  }

  // Build lookup: periodId → dayNum → slot
  const slotMap: Record<string, Record<number, any>> = {}
  for (const s of slots) {
    if (!slotMap[s.period_id]) slotMap[s.period_id] = {}
    slotMap[s.period_id][s.day_of_week] = s
  }

  const hasPublishedTimetable = slots.length > 0

  return (
    <div className="space-y-6 pb-24">
      {/* Hero */}
      <div className="bg-gradient-to-br from-cyan-600 via-cyan-500 to-cyan-500 rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[50px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">My Timetable</h1>
            <p className="text-cyan-100 text-sm mt-0.5">
              {contextLabel}{activeTerm ? ` · ${(activeTerm as any).name}` : ''}
            </p>
          </div>
        </div>
      </div>

      {!hasPublishedTimetable ? (
        <div className="text-center py-16 bg-card border border-border rounded-3xl">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-foreground">No Timetable Published Yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Your school administrator hasn&apos;t published the timetable for {activeTerm ? (activeTerm as any).name : 'the current term'} yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Weekly grid */}
          <div className="overflow-x-auto rounded-3xl border border-border shadow-sm bg-card">
            <table className="w-full text-sm border-collapse min-w-[560px]">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-card border-b border-r border-border px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider min-w-[120px]">
                    Period
                  </th>
                  {DAYS.map(d => (
                    <th key={d.num} className="border-b border-r border-border last:border-r-0 px-3 py-3 text-center">
                      <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">{d.label}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {periods.map((period: any, idx: number) => (
                  <tr key={period.id} className={idx % 2 === 0 ? '' : 'bg-slate-50/40 dark:bg-slate-900/20'}>
                    {/* Period label */}
                    <td className="sticky left-0 z-10 bg-card border-b border-r border-border px-4 py-3">
                      {idx % 2 !== 0 && <div className="absolute inset-0 bg-slate-50/40 dark:bg-slate-900/20" />}
                      <div className="relative">
                        <p className="font-semibold text-foreground text-xs">{period.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {fmt12(period.start_time)}–{fmt12(period.end_time)}
                        </p>
                      </div>
                    </td>

                    {/* Day cells */}
                    {DAYS.map(day => {
                      const slot = slotMap[period.id]?.[day.num]

                      if (period.is_break) {
                        return (
                          <td key={day.num} className="border-b border-r border-border last:border-r-0 p-1.5">
                            <div className="rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 px-2 py-3 text-center">
                              <span className="text-[10px] text-orange-400 font-semibold">Break</span>
                            </div>
                          </td>
                        )
                      }

                      return (
                        <td key={day.num} className="border-b border-r border-border last:border-r-0 p-1.5">
                          {slot ? (
                            <div className="rounded-xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/40 px-2 py-2">
                              <p className="text-[11px] font-bold text-cyan-800 dark:text-cyan-200 text-center leading-tight">
                                {slot.subjects?.name}
                              </p>
                              {/* Subject teacher also sees the class they're teaching */}
                              {isSubjectTeacher && slot.classes?.name && (
                                <p className="text-[9px] text-cyan-500 text-center mt-0.5 font-semibold">
                                  {slot.classes.name}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 px-2 py-3 text-center">
                              <span className="text-[10px] text-slate-300">—</span>
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-card border border-border rounded-2xl px-4 py-3 text-center">
              <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400">{slots.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mt-0.5">Teaching Slots</p>
            </div>
            {isSubjectTeacher && (
              <div className="bg-card border border-border rounded-2xl px-4 py-3 text-center">
                <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
                  {new Set(slots.map((s: any) => s.class_id)).size}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mt-0.5">Classes</p>
              </div>
            )}
            <div className="bg-card border border-border rounded-2xl px-4 py-3 text-center">
              <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
                {new Set(slots.map((s: any) => s.day_of_week)).size}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mt-0.5">Active Days</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
