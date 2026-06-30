import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AttendanceClient } from './attendance-client'

export default async function TeacherAttendance() {
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
  let existingRecords: Record<string, 'Present' | 'Absent' | 'Late'> = {}
  
  // Use current date
  const today = new Date().toISOString().split('T')[0]

  if (cls) {
    const { data: stdData } = await supabase
      .from('students')
      .select('id, first_name, last_name, admission_number')
      .eq('class_id', cls.id)
      .eq('school_id', profile.school_id)
      .order('first_name')
      
    if (stdData) students = stdData as any[]

    // Fetch existing attendance for today
    const { data: attData } = await supabase
      .from('attendance')
      .select('student_id, status')
      .eq('class_id', cls.id)
      .eq('date', today)

    if (attData) {
      existingRecords = (attData as any[]).reduce((acc, curr) => {
        acc[curr.student_id] = curr.status
        return acc
      }, {} as Record<string, 'Present' | 'Absent' | 'Late'>)
    }
  }

  return (
    <AttendanceClient 
      schoolId={profile.school_id}
      teacherId={user.id}
      cls={cls}
      students={students}
      existingRecords={existingRecords}
      date={today}
    />
  )
}
