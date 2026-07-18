import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CalendarDays, GraduationCap } from 'lucide-react'
import { TimetableBuilder } from './timetable-builder'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ class?: string }>
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

  if (!profile?.school_id || !['admin', 'principal', 'headteacher'].includes((profile as any).role)) {
    redirect('/dashboard')
  }

  const schoolId = (profile as any).school_id

  // Fetch all classes
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .order('name')

  const classList = (classes || []) as any[]
  const selectedClassId = params.class || classList[0]?.id || ''

  // Fetch subjects for this class
  const adminClient = createAdminClient()
  const { data: classSubjects } = selectedClassId
    ? await adminClient
        .from('class_subjects')
        .select('subject_id, subjects(id, name)')
        .eq('class_id', selectedClassId)
    : { data: [] }

  const subjects = (classSubjects || [])
    .map((cs: any) => cs.subjects)
    .filter(Boolean)
    .sort((a: any, b: any) => a.name.localeCompare(b.name))

  // Fetch periods
  const { data: periods } = await supabase
    .from('timetable_periods' as any)
    .select('*')
    .eq('school_id', schoolId)
    .order('sort_order')
    .order('start_time')

  // Fetch slots for the selected class
  const { data: slots } = selectedClassId
    ? await adminClient
        .from('timetable_slots' as any)
        .select('id, class_id, period_id, day_of_week, subject_id, subjects(name)')
        .eq('class_id', selectedClassId)
    : { data: [] }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
          <CalendarDays className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Timetable Manager</h1>
          <p className="text-sm text-muted-foreground">Build and manage weekly class schedules for your school.</p>
        </div>
      </div>

      {/* Class Selector */}
      {classList.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-3xl">
          <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-foreground">No Classes Found</h3>
          <p className="text-sm text-muted-foreground mt-1">Create classes first before building a timetable.</p>
        </div>
      ) : (
        <>
          {/* Class pills */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Select Class</p>
            <div className="flex gap-2 flex-wrap">
              {classList.map((cls: any) => (
                <Link
                  key={cls.id}
                  href={`/dashboard/timetable?class=${cls.id}`}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                    selectedClassId === cls.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-card text-foreground border-border hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {cls.name}
                </Link>
              ))}
            </div>
          </div>

          <TimetableBuilder
            schoolId={schoolId}
            classes={classList}
            initialPeriods={(periods as any[]) || []}
            subjects={subjects as any[]}
            initialSlots={(slots as any[]) || []}
            selectedClassId={selectedClassId}
          />
        </>
      )}
    </div>
  )
}
