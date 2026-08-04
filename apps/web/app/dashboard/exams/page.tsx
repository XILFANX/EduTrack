import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { ExamEventsManager } from './exam-events-manager'
import { ResultsMonitor } from './results-monitor'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ view?: string; eventId?: string }>
}

export default async function AdminExamsPage({ searchParams }: Props) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase.from('users').select('school_id, role').eq('id', user.id).single()
  const profile = profileRaw as any
  const role = (profile?.role || '').toLowerCase()
  const isAdmin = role.includes('admin') || role.includes('principal') || role.includes('headteacher')
  if (!profile?.school_id || !isAdmin) redirect('/dashboard')

  const schoolId = profile.school_id
  const adminClient = createAdminClient()

  const [
    { data: yearsRaw },
    { data: termsRaw },
    { data: classesRaw },
    { data: subjectsRaw },
    { data: eventsRaw },
  ] = await Promise.all([
    supabase.from('academic_years').select('id, name, is_active').eq('school_id', schoolId).order('start_date', { ascending: false }),
    supabase.from('academic_terms').select('id, name, year_id, is_active').eq('school_id', schoolId).order('start_date'),
    supabase.from('classes').select('id, name').eq('school_id', schoolId).is('deleted_at', null).order('name'),
    supabase.from('subjects').select('id, name').eq('school_id', schoolId).order('name'),
    adminClient.from('exam_events' as any).select('id, name, status, term_id, year_id, created_at, exam_event_classes(class_id, classes(name))').eq('school_id', schoolId).order('created_at', { ascending: false }),
  ])

  const years = (yearsRaw || []) as any[]
  const terms = (termsRaw || []) as any[]
  const classes = (classesRaw || []) as any[]
  const subjects = (subjectsRaw || []) as any[]
  const events = (eventsRaw || []) as any[]

  const selectedEventId = params.eventId || ''
  const selectedEvent = events.find(e => e.id === selectedEventId) || null

  // Fetch exam_timetable slots and grading status for selected event
  let eventSlots: any[] = []
  let gradingStatus: any[] = []

  if (selectedEventId) {
    const [{ data: slotsRaw }, { data: statusRaw }] = await Promise.all([
      adminClient
        .from('exam_timetables')
        .select('id, exam_id, subject_id, class_id, exam_date, start_time, end_time, subjects(name), classes(name)')
        .eq('exam_id', selectedEventId)
        .eq('school_id', schoolId)
        .order('exam_date'),
      adminClient
        .from('exam_grading_status' as any)
        .select('*')
        .eq('exam_id', selectedEventId)
        .eq('school_id', schoolId),
    ])
    eventSlots = (slotsRaw || []) as any[]
    gradingStatus = (statusRaw || []) as any[]
  }

  const view = params.view || 'events'

  return (
    <div className="space-y-6 pb-24">
      {view === 'monitor' && selectedEvent ? (
        <ResultsMonitor
          event={selectedEvent}
          eventSlots={eventSlots}
          gradingStatus={gradingStatus}
          classes={classes}
          subjects={subjects}
          schoolId={schoolId}
        />
      ) : (
        <ExamEventsManager
          schoolId={schoolId}
          events={events}
          years={years}
          terms={terms}
          classes={classes}
          subjects={subjects}
        />
      )}
    </div>
  )
}
