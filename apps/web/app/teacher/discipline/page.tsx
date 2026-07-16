import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DisciplineClient } from './discipline-client'

export default async function TeacherDiscipline() {
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

  // Only class teachers should land here
  if (profile.role !== 'class_teacher') redirect('/teacher/dashboard')

  // Fetch the class
  const { data: cls } = await supabase
    .from('classes')
    .select('id, name')
    .eq('class_teacher_id', user.id)
    .eq('school_id', profile.school_id)
    .single()

  let students: any[] = []
  let logs: any[] = []

  if (cls) {
    // Fetch students
    const { data: stdData } = await supabase
      .from('students')
      .select('id, first_name, last_name, admission_number, photo_url')
      .eq('class_id', cls.id)
      .eq('school_id', profile.school_id)
      .is('deleted_at', null)
      .order('first_name')
    if (stdData) students = stdData as any[]

    // Fetch discipline logs for this class
    const { data: logsData } = await supabase
      .from('discipline_logs')
      .select('*, students(first_name, last_name, admission_number, photo_url)')
      .eq('class_id', cls.id)
      .eq('school_id', profile.school_id)
      .order('created_at', { ascending: false })
    if (logsData) logs = logsData as any[]
  }

  return (
    <DisciplineClient 
      schoolId={profile.school_id}
      teacherId={user.id}
      cls={cls}
      students={students}
      logs={logs}
    />
  )
}
