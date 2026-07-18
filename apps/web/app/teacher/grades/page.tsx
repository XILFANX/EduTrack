import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PenTool, BookOpen, ChevronRight } from 'lucide-react'
import { ResultsEntryTable } from '@/components/shared/results-entry-table'
import { ClassTeacherReviewPanel } from '@/components/teacher/class-teacher-review-panel'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ examId?: string; classId?: string; subjectId?: string }>
}

export default async function TeacherGrades({ searchParams }: Props) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileResult } = await supabase
    .from('users')
    .select('school_id, role')
    .eq('id', user.id)
    .single()

  const profile = profileResult as any
  if (!profile?.school_id) return null

  const isSubjectTeacher = profile.role === 'subject_teacher'
  const isClassTeacher = profile.role === 'class_teacher'
  const adminClient = createAdminClient()

  // Grade scales for this school
  const { data: scalesData } = await supabase
    .from('grade_scales')
    .select('grade, min_score, max_score, points, remarks')
    .eq('school_id', profile.school_id)
    .order('min_score', { ascending: false })
  const gradeScales = (scalesData || []) as any[]

  // Fetch exams — for subject teacher: exams for their scheduled subjects
  // For class teacher: all exams for their class
  let myClassId: string | null = null
  let assignments: any[] = []

  if (isClassTeacher) {
    const { data: cls } = await supabase
      .from('classes')
      .select('id')
      .eq('class_teacher_id', user.id)
      .eq('school_id', profile.school_id)
      .single()
    myClassId = (cls as any)?.id || null
  } else if (isSubjectTeacher) {
    const { data: asgn } = await supabase
      .from('class_subjects')
      .select('class_id, subject_id, classes(id, name), subjects(id, name)')
      .eq('teacher_id', user.id)
      .eq('school_id', profile.school_id)
    assignments = (asgn || []) as any[]
    myClassId = params.classId || assignments[0]?.class_id || null
  }

  // Fetch published exam timetable entries relevant to this teacher
  const { data: timetableSlots } = myClassId
    ? await adminClient
        .from('exam_timetables')
        .select('id, exam_id, subject_id, class_id, exam_date, start_time, end_time, exams(id, name, max_score)')
        .eq('class_id', myClassId)
        .eq('school_id', profile.school_id)
        .order('exam_date')
    : { data: [] }

  const slots = (timetableSlots || []) as any[]

  // Filter slots for subject teacher to only their subjects
  const mySubjectIds = assignments.map((a: any) => a.subject_id)
  const visibleSlots = isSubjectTeacher
    ? slots.filter(s => mySubjectIds.includes(s.subject_id))
    : slots

  // Which slot is selected
  const selectedExamId = params.examId || visibleSlots[0]?.exam_id || ''
  const selectedClassId = params.classId || myClassId || ''
  const selectedSubjectId = params.subjectId || visibleSlots[0]?.subject_id || ''
  const selectedSlot = visibleSlots.find(s => s.exam_id === selectedExamId && s.subject_id === selectedSubjectId)

  // Fetch subjects for breadcrumb lookup
  const { data: subjectsData } = await supabase
    .from('subjects')
    .select('id, name')
    .eq('school_id', profile.school_id)
  const subjects = (subjectsData || []) as any[]
  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || id

  // Fetch unique exams from slots
  const examMap = new Map<string, any>()
  visibleSlots.forEach(s => {
    if (s.exams && !examMap.has(s.exam_id)) examMap.set(s.exam_id, s.exams)
  })
  const myExams = [...examMap.values()]

  // Fetch students for the selected class
  let students: any[] = []
  if (selectedClassId) {
    const { data } = await supabase
      .from('students')
      .select('id, first_name, last_name, admission_number, photo_url')
      .eq('class_id', selectedClassId)
      .eq('school_id', profile.school_id)
      .is('deleted_at', null)
      .order('last_name')
    students = (data || []) as any[]
  }

  // Existing results for selected exam + subject + class students
  let existingResults: any[] = []
  if (students.length > 0 && selectedExamId && selectedSubjectId) {
    const { data: results } = await adminClient
      .from('exam_results')
      .select('student_id, score, grade, remarks')
      .in('student_id', students.map(s => s.id))
      .eq('exam_id', selectedExamId)
      .eq('subject_id', selectedSubjectId)
    existingResults = (results || []) as any[]
  }

  // Grading status for selected combo
  let gradingStatus = 'pending'
  if (selectedExamId && selectedClassId && selectedSubjectId) {
    const { data: statusRow } = await supabase
      .from('exam_grading_status')
      .select('status')
      .eq('exam_id', selectedExamId)
      .eq('class_id', selectedClassId)
      .eq('subject_id', selectedSubjectId)
      .single()
    if (statusRow) gradingStatus = (statusRow as any).status
  }

  const selectedExam = myExams.find(e => e.id === selectedExamId)

  // For class teacher: show grading status table for all subjects
  let subjectStatuses: any[] = []
  if (isClassTeacher && selectedExamId && selectedClassId) {
    const { data: statuses } = await supabase
      .from('exam_grading_status')
      .select('subject_id, status, submitted_at, finalized_at')
      .eq('exam_id', selectedExamId)
      .eq('class_id', selectedClassId)
    subjectStatuses = (statuses || []) as any[]
  }



  return (
    <div className="space-y-8 max-w-5xl pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center">
          <PenTool className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Grades & Results</h1>
          <p className="text-sm text-muted-foreground">Record and submit exam results for review.</p>
        </div>
      </div>

      {visibleSlots.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-3xl">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-foreground">No Exams Scheduled</h3>
          <p className="text-sm text-muted-foreground mt-1">The administrator hasn't scheduled any exams for your subjects yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
          {/* Left sidebar: exam + subject selector */}
          <div className="space-y-4">
            {/* Exams */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-b border-border">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Exams</p>
              </div>
              {myExams.map(exam => (
                <Link
                  key={exam.id}
                  href={`/teacher/grades?examId=${exam.id}&classId=${selectedClassId}&subjectId=${visibleSlots.find(s => s.exam_id === exam.id)?.subject_id || ''}`}
                  className={`flex items-center justify-between px-4 py-3 border-b border-border/50 last:border-b-0 transition-colors ${exam.id === selectedExamId ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' : 'hover:bg-slate-50 dark:hover:bg-slate-900/30 text-foreground'}`}
                >
                  <span className="font-medium text-sm">{exam.name}</span>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </Link>
              ))}
            </div>

            {/* Subjects for selected exam */}
            {selectedExamId && (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-b border-border">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Subjects</p>
                </div>
                {visibleSlots.filter(s => s.exam_id === selectedExamId).map(slot => {
                  const status = subjectStatuses.find(st => st.subject_id === slot.subject_id)?.status || 'pending'
                  const dotColor = status === 'finalized' ? 'bg-emerald-400' : status === 'submitted' ? 'bg-amber-400' : 'bg-slate-300'
                  return (
                    <Link
                      key={slot.id}
                      href={`/teacher/grades?examId=${selectedExamId}&classId=${slot.class_id}&subjectId=${slot.subject_id}`}
                      className={`flex items-center justify-between px-4 py-3 border-b border-border/50 last:border-b-0 transition-colors ${slot.subject_id === selectedSubjectId ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' : 'hover:bg-slate-50 dark:hover:bg-slate-900/30 text-foreground'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                        <span className="font-medium text-sm">{getSubjectName(slot.subject_id)}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Class teacher review panel */}
            {isClassTeacher && selectedExamId && selectedClassId && subjects.length > 0 && (
              <ClassTeacherReviewPanel
                examId={selectedExamId}
                classId={selectedClassId}
                subjects={subjects.map(s => ({
                  subject_id: s.id,
                  subject_name: s.name,
                  status: subjectStatuses.find(st => st.subject_id === s.id)?.status || 'pending',
                  submitted_at: subjectStatuses.find(st => st.subject_id === s.id)?.submitted_at || null,
                }))}
              />
            )}
          </div>

          {/* Main content: grade entry table */}
          <div className="bg-card border border-border rounded-3xl p-5 min-h-[400px]">
            {selectedSlot && selectedExam && students.length > 0 ? (
              <ResultsEntryTable
                examId={selectedExamId}
                classId={selectedClassId}
                subjectId={selectedSubjectId}
                subjectName={getSubjectName(selectedSubjectId)}
                examName={selectedExam.name}
                maxScore={selectedExam.max_score}
                students={students}
                gradeScales={gradeScales}
                existingResults={existingResults}
                gradingStatus={gradingStatus}
                isSubjectTeacher={isSubjectTeacher}
              />
            ) : (
              <div className="flex items-center justify-center h-full min-h-[300px]">
                <div className="text-center">
                  <PenTool className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Select an exam and subject to start entering grades.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
