import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { TimetableGrid } from './timetable-grid'
import { PeriodManager } from './period-manager'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ term?: string; view?: string }>
}

export default async function AdminTimetablePage({ searchParams }: Props) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id, role')
    .eq('id', user.id)
    .single()

  const role = ((profile as any)?.role || '').toLowerCase()
  const isAdmin = role.includes('admin') || role.includes('principal') || role.includes('headteacher')
  if (!profile || !(profile as any).school_id || !isAdmin) redirect('/dashboard')

  const schoolId = (profile as any).school_id
  const adminClient = createAdminClient()

  // Fetch all supporting data in parallel
  const [
    { data: periodsRaw },
    { data: classesRaw },
    { data: subjectsRaw },
    { data: yearsRaw },
    { data: termsRaw },
    { data: teachersRaw },
  ] = await Promise.all([
    supabase
      .from('timetable_periods' as any)
      .select('*')
      .eq('school_id', schoolId)
      .order('sort_order')
      .order('start_time'),
    supabase
      .from('classes')
      .select('id, name')
      .eq('school_id', schoolId)
      .is('deleted_at', null)
      .order('name'),
    supabase
      .from('subjects')
      .select('id, name')
      .eq('school_id', schoolId)
      .order('name'),
    supabase
      .from('academic_years')
      .select('id, name, is_active')
      .eq('school_id', schoolId)
      .order('start_date', { ascending: false }),
    supabase
      .from('academic_terms')
      .select('id, name, year_id, is_active')
      .eq('school_id', schoolId)
      .order('start_date'),
    supabase
      .from('users')
      .select('id, full_name, role')
      .eq('school_id', schoolId)
      .in('role', ['class_teacher', 'subject_teacher'])
      .order('full_name'),
  ])

  const periods = (periodsRaw || []) as any[]
  const classes = (classesRaw || []) as any[]
  const subjects = (subjectsRaw || []) as any[]
  const years = (yearsRaw || []) as any[]
  const terms = (termsRaw || []) as any[]
  const teachers = (teachersRaw || []) as any[]

  // Default to active term
  const activeYear = years.find((y: any) => y.is_active) || years[0]
  const activeTerms = terms.filter((t: any) => t.year_id === activeYear?.id)
  const selectedTermId = params.term || activeTerms.find((t: any) => t.is_active)?.id || activeTerms[0]?.id || ''
  const selectedTerm = terms.find((t: any) => t.id === selectedTermId)

  // Fetch all slots for the selected term
  const { data: slotsRaw } = selectedTermId
    ? await adminClient
        .from('timetable_slots' as any)
        .select('id, class_id, period_id, day_of_week, subject_id, teacher_id, is_published, subjects(name), users(full_name)')
        .eq('school_id', schoolId)
        .eq('term_id', selectedTermId)
    : { data: [] }

  const slots = (slotsRaw || []) as any[]
  const isPublished = slots.length > 0 && slots.every((s: any) => s.is_published)

  // Detect conflicts
  const slotsByTeacher: Record<string, any[]> = {}
  for (const s of slots) {
    if (!s.teacher_id) continue
    const key = `${s.teacher_id}::${s.day_of_week}::${s.period_id}`
    if (!slotsByTeacher[key]) slotsByTeacher[key] = []
    slotsByTeacher[key].push(s)
  }
  const conflicts = Object.values(slotsByTeacher).filter(g => g.length > 1).flat()
  const conflictSlotIds = new Set(conflicts.map((s: any) => s.id))

  const viewMode = (params.view as 'builder' | 'setup') || 'builder'

  return (
    <div className="space-y-6 max-w-full mx-auto pb-24">
      {/* Hero */}
      <div className="bg-gradient-to-br from-cyan-600 via-cyan-500 to-cyan-500 rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[50px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight">School Timetable</h1>
            <p className="text-cyan-100 text-sm mt-1">
              {selectedTerm ? `${selectedTerm.name} — ` : ''}School-wide schedule builder with conflict detection
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {isPublished ? (
              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-white/20 border border-white/30">
                ✓ Published
              </span>
            ) : (
              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-orange-400/30 border border-red-300/40">
                Draft
              </span>
            )}
            {conflicts.length > 0 && (
              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-red-400/30 border border-red-300/40">
                ⚠ {conflicts.length} Conflict{conflicts.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Period Setup Tab */}
      {viewMode === 'setup' ? (
        <PeriodManager
          schoolId={schoolId}
          initialPeriods={periods}
        />
      ) : (
        <TimetableGrid
          schoolId={schoolId}
          periods={periods}
          classes={classes}
          subjects={subjects}
          teachers={teachers}
          slots={slots}
          terms={terms}
          years={years}
          selectedTermId={selectedTermId}
          conflictSlotIds={Array.from(conflictSlotIds)}
          isPublished={isPublished}
        />
      )}
    </div>
  )
}
