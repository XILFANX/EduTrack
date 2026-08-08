import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { CalendarDays, AlertCircle, Coffee } from 'lucide-react'

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

export default async function ParentTimetablePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase
    .from('users')
    .select('school_id, role')
    .eq('id', user.id)
    .single()

  const profile = profileRaw as any
  if (!profile?.school_id || profile.role !== 'parent') redirect('/parent/dashboard')

  const adminClient = createAdminClient()

  // Find parent's children with their classes
  const { data: linksRaw } = await adminClient
    .from('student_parents' as any)
    .select('student_id')
    .eq('parent_id', user.id)

  const studentIds = ((linksRaw as any[]) || []).map((l: any) => l.student_id)

  let children: any[] = []
  if (studentIds.length > 0) {
    const { data: studentsRaw } = await adminClient
      .from('students')
      .select('id, first_name, last_name, class_id, classes(id, name)')
      .in('id', studentIds)
      .not('class_id', 'is', null)
    children = (studentsRaw || []) as any[]
  }

  // Active term
  const { data: activeTerm } = await supabase
    .from('academic_terms')
    .select('id, name')
    .eq('school_id', profile.school_id)
    .eq('is_active', true)
    .single()

  const termId = (activeTerm as any)?.id || null

  // Fetch periods
  const { data: periodsRaw } = await supabase
    .from('timetable_periods' as any)
    .select('id, name, start_time, end_time, is_break, sort_order')
    .eq('school_id', profile.school_id)
    .order('sort_order')
    .order('start_time')
  const periods = (periodsRaw || []) as any[]

  // For each child's class, fetch published timetable slots
  const classIds = [...new Set(children.map((c: any) => c.class_id).filter(Boolean))]
  let allSlots: any[] = []
  if (classIds.length > 0) {
    let query = adminClient
      .from('timetable_slots' as any)
      .select('period_id, day_of_week, subject_id, class_id, teacher_id, is_published, subjects(name), users(full_name)')
      .in('class_id', classIds)
      .eq('is_published', true)

    if (termId) query = query.eq('term_id', termId)
    const { data } = await query
    allSlots = (data || []) as any[]
  }

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
            <h1 className="text-2xl font-black tracking-tight">Class Timetable</h1>
            <p className="text-cyan-100 text-sm mt-0.5">
              Weekly schedule{activeTerm ? ` · ${(activeTerm as any).name}` : ''}
            </p>
          </div>
        </div>
      </div>

      {children.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-3xl">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No children linked to your account.</p>
        </div>
      ) : allSlots.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-3xl">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-foreground">Timetable Not Published Yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            The school has not yet published the timetable for {activeTerm ? (activeTerm as any).name : 'this term'}.
          </p>
        </div>
      ) : (
        /* Render one timetable card per child */
        children.map((child: any) => {
          const childSlots = allSlots.filter((s: any) => s.class_id === child.class_id)

          // Build slot map: periodId → dayNum → slot
          const slotMap: Record<string, Record<number, any>> = {}
          for (const s of childSlots) {
            if (!slotMap[s.period_id]) slotMap[s.period_id] = {}
            slotMap[s.period_id][s.day_of_week] = s
          }

          return (
            <div key={child.id} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                    {child.first_name?.[0]}{child.last_name?.[0]}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-foreground">{child.first_name} {child.last_name}</p>
                  <p className="text-xs text-muted-foreground">{child.classes?.name}</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-3xl border border-border shadow-sm bg-card">
                <table className="w-full text-sm border-collapse min-w-[460px]">
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-10 bg-card border-b border-r border-border px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider min-w-[110px]">
                        Period
                      </th>
                      {DAYS.map(d => (
                        <th key={d.num} className="border-b border-r border-border last:border-r-0 px-2 py-3 text-center">
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{d.label}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {periods.map((period: any, idx: number) => (
                      <tr key={period.id} className={idx % 2 === 0 ? '' : 'bg-slate-50/40 dark:bg-slate-900/20'}>
                        <td className="sticky left-0 z-10 bg-card border-b border-r border-border px-4 py-3">
                          {idx % 2 !== 0 && <div className="absolute inset-0 bg-slate-50/40 dark:bg-slate-900/20" />}
                          <div className="relative">
                            <p className="font-semibold text-foreground text-xs">{period.name}</p>
                            <p className="text-[10px] text-muted-foreground">{fmt12(period.start_time)}–{fmt12(period.end_time)}</p>
                          </div>
                        </td>

                        {DAYS.map(day => {
                          const slot = slotMap[period.id]?.[day.num]
                          if (period.is_break) {
                            return (
                              <td key={day.num} className="border-b border-r border-border last:border-r-0 p-1.5">
                                <div className="rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-red-100 dark:border-red-900/30 px-2 py-3 flex items-center justify-center">
                                  <Coffee className="w-3 h-3 text-red-400" />
                                </div>
                              </td>
                            )
                          }
                          return (
                            <td key={day.num} className="border-b border-r border-border last:border-r-0 p-1.5">
                              {slot?.subjects?.name ? (
                                <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 px-1.5 py-2">
                                  <p className="text-[10px] font-bold text-cyan-800 dark:text-cyan-200 text-center leading-tight">
                                    {slot.subjects.name}
                                  </p>
                                  {slot.users?.full_name && (
                                    <p className="text-[9px] text-cyan-400 text-center mt-0.5 truncate">
                                      {slot.users.full_name}
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
            </div>
          )
        })
      )}
    </div>
  )
}
