import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GradesClient } from './grades-client'

export default async function TeacherGrades() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileResult } = await supabase
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  const profile = profileResult as any
  if (!profile?.school_id) return null

  // Fetch the first class where the user is the class teacher
  const { data: cls } = await supabase
    .from('classes')
    .select('id, name')
    .eq('class_teacher_id', user.id)
    .eq('school_id', profile.school_id)
    .single()

  let students: any[] = []
  if (cls) {
    const { data } = await supabase
      .from('students')
      .select('id, first_name, last_name, admission_number')
      .eq('class_id', cls.id)
      .eq('school_id', profile.school_id)
      .order('first_name')
    if (data) students = data as any[]
  }

  // Fetch Exams
  const { data: examsData } = await supabase
    .from('exams')
    .select('id, name')
    .eq('school_id', profile.school_id)
    .order('created_at', { ascending: false })
  const exams = (examsData || []) as any[]

  // Fetch Subjects
  const { data: subjectsData } = await supabase
    .from('subjects')
    .select('id, name')
    .eq('school_id', profile.school_id)
    .order('name')
  const subjects = (subjectsData || []) as any[]

  // Fetch existing results for this class
  // Since results are linked to student, we fetch results where student_id is in our students list
  let existingResults: any[] = []
  if (students.length > 0 && exams.length > 0 && subjects.length > 0) {
    const studentIds = students.map(s => s.id)
    const { data: resultsData } = await supabase
      .from('exam_results')
      .select('student_id, exam_id, subject_id, score, grade')
      .in('student_id', studentIds)
    if (resultsData) existingResults = resultsData as any[]
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
    />
  )
}
