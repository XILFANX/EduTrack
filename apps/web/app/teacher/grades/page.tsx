import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { SubjectTeacherGradesView } from './subject-teacher-grades-view'
import { ClassTeacherReviewView } from './class-teacher-review-view'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ examEventId?: string; subjectId?: string; classId?: string }>
}

export default async function TeacherGradesPage({ searchParams }: Props) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase
    .from('users').select('school_id, role, full_name').eq('id', user.id).single()
  const profile = profileRaw as any
  if (!profile?.school_id) redirect('/login')

  const adminClient = createAdminClient()
  const isSubjectTeacher = profile.role === 'subject_teacher'
  const isClassTeacher = profile.role === 'class_teacher'

  // Grade scales for auto-grading
  const { data: scalesRaw } = await supabase
    .from('grade_scales').select('grade, min_score, max_score, points, remarks')
    .eq('school_id', profile.school_id).order('min_score', { ascending: false })
  const gradeScales = (scalesRaw || []) as any[]

  // Active term
  const { data: activeTermRaw } = await supabase
    .from('academic_terms').select('id, name').eq('school_id', profile.school_id).eq('is_active', true).single()
  const activeTerm = activeTermRaw as any

  // Published exam events
  const { data: eventsRaw } = await adminClient
    .from('exam_events' as any)
    .select('id, name, status, term_id, exam_event_classes(class_id)')
    .eq('school_id', profile.school_id)
    .in('status', ['published', 'closed'])
    .order('created_at', { ascending: false })
  const events = (eventsRaw || []) as any[]

  if (isSubjectTeacher) {
    // ── SUBJECT TEACHER ──────────────────────────────────────────
    // Get their subject assignments
    const { data: assignmentsRaw } = await supabase
      .from('class_subjects')
      .select('class_id, subject_id, classes(id, name), subjects(id, name)')
      .eq('teacher_id', user.id)
      .eq('school_id', profile.school_id)
    const assignments = (assignmentsRaw || []) as any[]

    const myClassIds = [...new Set(assignments.map((a: any) => a.class_id))]
    const mySubjectIds = [...new Set(assignments.map((a: any) => a.subject_id))]

    // Filter events relevant to this teacher's classes
    const relevantEvents = events.filter((e: any) =>
      (e.exam_event_classes || []).some((ec: any) => myClassIds.includes(ec.class_id))
    )

    const selectedEventId = params.examEventId || relevantEvents[0]?.id || ''
    const selectedEvent = relevantEvents.find((e: any) => e.id === selectedEventId) || null

    // Exam timetable slots for this teacher's classes/subjects in the selected event
    let examSlots: any[] = []
    if (selectedEventId && myClassIds.length > 0) {
      const { data: slotsRaw } = await adminClient
        .from('exam_timetables')
        .select('id, exam_id, subject_id, class_id, exam_date, start_time, end_time, subjects(id, name), classes(id, name)')
        .eq('exam_id', selectedEventId)
        .eq('school_id', profile.school_id)
        .in('class_id', myClassIds)
        .in('subject_id', mySubjectIds)
        .order('exam_date')
      examSlots = (slotsRaw || []) as any[]
    }

    const selectedClassId = params.classId || examSlots[0]?.class_id || ''
    const selectedSubjectId = params.subjectId || examSlots[0]?.subject_id || ''
    const selectedSlot = examSlots.find(s => s.class_id === selectedClassId && s.subject_id === selectedSubjectId) || null

    // Students for selected class
    let students: any[] = []
    if (selectedClassId) {
      const { data: studentsRaw } = await adminClient
        .from('students')
        .select('id, first_name, last_name, admission_number')
        .eq('class_id', selectedClassId)
        .eq('school_id', profile.school_id)
        .order('last_name')
      students = (studentsRaw || []) as any[]
    }

    // Existing results for this exam+class+subject
    let existingResults: any[] = []
    if (selectedEventId && selectedClassId && selectedSubjectId) {
      const examId = selectedSlot?.exam_id || ''
      if (examId) {
        const { data: resultsRaw } = await adminClient
          .from('exam_results')
          .select('student_id, score, grade, remarks, status')
          .eq('exam_id', examId)
          .eq('subject_id', selectedSubjectId)
          .eq('school_id', profile.school_id)
        existingResults = (resultsRaw || []) as any[]
      }
    }

    // Grading status for this slot
    let slotGradingStatus: any = null
    if (selectedSlot && selectedClassId && selectedSubjectId) {
      const { data: gsRaw } = await adminClient
        .from('exam_grading_status' as any)
        .select('status, rejection_comment, submitted_at')
        .eq('exam_id', selectedSlot.exam_id)
        .eq('class_id', selectedClassId)
        .eq('subject_id', selectedSubjectId)
        .single()
      slotGradingStatus = gsRaw as any
    }

    return (
      <SubjectTeacherGradesView
        teacherId={user.id}
        schoolId={profile.school_id}
        events={relevantEvents}
        examSlots={examSlots}
        selectedEventId={selectedEventId}
        selectedClassId={selectedClassId}
        selectedSubjectId={selectedSubjectId}
        selectedSlot={selectedSlot}
        students={students}
        existingResults={existingResults}
        gradeScales={gradeScales}
        slotGradingStatus={slotGradingStatus}
      />
    )
  }

  if (isClassTeacher) {
    // ── CLASS TEACHER ─────────────────────────────────────────────
    const { data: clsRaw } = await supabase
      .from('classes').select('id, name')
      .eq('class_teacher_id', user.id).eq('school_id', profile.school_id).single()
    const myClass = clsRaw as any
    if (!myClass) {
      return (
        <div className="text-center py-20 text-muted-foreground">
          <p>You are not assigned as a class teacher to any class.</p>
        </div>
      )
    }

    const selectedEventId = params.examEventId || events[0]?.id || ''
    const selectedEvent = events.find((e: any) => e.id === selectedEventId) || null

    // Subjects scheduled for this class in the selected event
    let classSlots: any[] = []
    let gradingStatuses: any[] = []

    if (selectedEventId) {
      const [{ data: slotsRaw }, { data: statusesRaw }] = await Promise.all([
        adminClient
          .from('exam_timetables')
          .select('id, exam_id, subject_id, class_id, exam_date, subjects(id, name)')
          .eq('exam_id', selectedEventId)
          .eq('class_id', myClass.id)
          .eq('school_id', profile.school_id)
          .order('exam_date'),
        adminClient
          .from('exam_grading_status' as any)
          .select('*')
          .eq('exam_id', selectedEventId)
          .eq('class_id', myClass.id),
      ])
      classSlots = (slotsRaw || []) as any[]
      gradingStatuses = (statusesRaw || []) as any[]
    }

    // For selected subject to review — fetch results
    const selectedSubjectId = params.subjectId || ''
    let reviewResults: any[] = []
    let reviewStudents: any[] = []

    if (selectedSubjectId && selectedEventId) {
      const selectedSlot = classSlots.find(s => s.subject_id === selectedSubjectId)
      if (selectedSlot) {
        const [{ data: resultsRaw }, { data: studentsRaw }] = await Promise.all([
          adminClient
            .from('exam_results')
            .select('student_id, score, grade, remarks, status')
            .eq('exam_id', selectedSlot.exam_id)
            .eq('subject_id', selectedSubjectId)
            .eq('school_id', profile.school_id),
          adminClient
            .from('students')
            .select('id, first_name, last_name, admission_number')
            .eq('class_id', myClass.id)
            .eq('school_id', profile.school_id)
            .order('last_name'),
        ])
        reviewResults = (resultsRaw || []) as any[]
        reviewStudents = (studentsRaw || []) as any[]
      }
    }

    return (
      <ClassTeacherReviewView
        teacherId={user.id}
        schoolId={profile.school_id}
        myClass={myClass}
        events={events}
        selectedEventId={selectedEventId}
        classSlots={classSlots}
        gradingStatuses={gradingStatuses}
        selectedSubjectId={selectedSubjectId}
        reviewResults={reviewResults}
        reviewStudents={reviewStudents}
        gradeScales={gradeScales}
      />
    )
  }

  redirect('/dashboard')
}
