import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CalendarDays, GraduationCap, ChevronLeft } from 'lucide-react'
import { TimetableBuilder } from './timetable-builder'
import { ClassDirectory } from '@/components/shared/class-directory'

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

  const role = ((profile as any).role || '').toLowerCase()
  const isAdmin = role.includes('admin') || role.includes('principal') || role.includes('headteacher')
  if (!profile?.school_id || !isAdmin) {
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
  const selectedClassId = params.class || ''

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

  if (!selectedClassId) {
    return (
      <ClassDirectory
        title="Class Timetables"
        description="Select a class to build or view its weekly timetable."
        classes={classList.map(c => ({ id: c.id, name: c.name, countLabel: 'Manage timetable' }))}
        basePath="/dashboard/timetable?class"
      />
    )
  }

  const selectedClass = classList.find(c => c.id === selectedClassId)

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/timetable" className="p-2 rounded-xl bg-[#121827] border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            Timetable <span className="text-slate-600">/</span> <span className="text-blue-400">{selectedClass?.name}</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Drag and drop subjects to create the weekly schedule.
          </p>
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
    </div>
  )
}
