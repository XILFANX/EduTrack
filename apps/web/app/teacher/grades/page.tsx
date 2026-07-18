import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GradesClient } from './grades-client'

export default async function TeacherGrades({ searchParams }: { searchParams: Promise<{ class?: string; subject?: string }> }) {
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

  const isClassTeacher = profile.role === 'class_teacher'

  // ─── CLASS TEACHER: fetch their one assigned class ───
  let cls: any = null
  let students: any[] = []
  let subjects: any[] = []

  if (isClassTeacher) {
    const { data: clsData } = await supabase
      .from('classes')
      .select('id, name')
      .eq('class_teacher_id', user.id)
      .eq('school_id', profile.school_id)
      .single()
    cls = clsData

    if (cls) {
      const { data } = await supabase
        .from('students')
        .select('id, first_name, last_name, admission_number, photo_url')
        .eq('class_id', cls.id)
        .eq('school_id', profile.school_id)
        .is('deleted_at', null)
        .order('first_name')
      if (data) students = data as any[]
    }

    // All subjects available to the class teacher
    const { data: subjectsData } = await supabase
      .from('subjects')
      .select('id, name')
      .eq('school_id', profile.school_id)
      .order('name')
    subjects = (subjectsData || []) as any[]

  } else {
    // ─── SUBJECT TEACHER: get only their class-subject assignments ───
    const { data: assignmentsData } = await supabase
      .from('class_subjects')
      .select('id, class_id, subject_id, classes(id, name), subjects(id, name)')
      .eq('teacher_id', user.id)
      .eq('school_id', profile.school_id)

    const assignments = (assignmentsData || []) as any[]

    // Determine selected class (from query param or first assignment)
    const selectedClassId = params.class || assignments[0]?.class_id
    const selectedSubjectId = params.subject || assignments[0]?.subject_id

    // Unique classes from assignments
    const uniqueClassMap = new Map<string, { id: string; name: string }>()
    assignments.forEach((a) => {
      if (a.classes) uniqueClassMap.set(a.class_id, { id: a.class_id, name: a.classes.name })
    })

    // Subjects for selected class
    const subjectsForClass = assignments
      .filter((a) => a.class_id === selectedClassId)
      .map((a) => ({ id: a.subject_id, name: a.subjects?.name || '' }))
    subjects = subjectsForClass

    // Students in selected class
    if (selectedClassId) {
      cls = uniqueClassMap.get(selectedClassId) || null
      const { data } = await supabase
        .from('students')
        .select('id, first_name, last_name, admission_number, photo_url')
        .eq('class_id', selectedClassId)
        .eq('school_id', profile.school_id)
        .is('deleted_at', null)
        .order('first_name')
      if (data) students = data as any[]
    }
  }

  // Exams
  const { data: examsData } = await supabase
    .from('exams')
    .select('id, name')
    .eq('school_id', profile.school_id)
    .order('created_at', { ascending: false })
  const exams = (examsData || []) as any[]

  // Existing results for all students in this class
  let existingResults: any[] = []
  if (students.length > 0) {
    const studentIds = students.map((s) => s.id)
    const { data: resultsData } = await supabase
      .from('exam_results')
      .select('student_id, exam_id, subject_id, score, grade')
      .in('student_id', studentIds)
    if (resultsData) existingResults = resultsData as any[]
  }

  // Grade Scales
  const { data: scalesData } = await supabase
    .from('grade_scales')
    .select('grade, min_score, remarks')
    .eq('school_id', profile.school_id)
    .order('min_score', { ascending: false })
  const gradeScales = (scalesData || []) as any[]

  // Available classes list (for subject teacher class switcher)
  let availableClasses: { id: string; name: string }[] = []
  if (!isClassTeacher) {
    const { data: assignmentsData } = await supabase
      .from('class_subjects')
      .select('class_id, classes(id, name)')
      .eq('teacher_id', user.id)
      .eq('school_id', profile.school_id)
    const seenIds = new Set<string>()
    availableClasses = ((assignmentsData || []) as any[])
      .filter((a) => { if (seenIds.has(a.class_id)) return false; seenIds.add(a.class_id); return true })
      .map((a) => ({ id: a.class_id, name: a.classes?.name || '' }))
  }

  return (
    <GradesClient 
      schoolId={profile.school_id}
      teacherId={user.id}
      cls={cls}
      students={students}
      exams={exams}
      subjects={subjects}
      existingResults={existingResults}
      isClassTeacher={isClassTeacher}
      availableClasses={availableClasses}
      preselectedSubjectId={params.subject}
      gradeScales={gradeScales}
    />
  )
}
