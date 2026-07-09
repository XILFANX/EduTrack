import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClassDetailClient } from './class-detail-client'
import { getTeachers } from '../actions'

export default async function ClassDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return null

  // Fetch class details
  const { data: cls } = await supabase
    .from('classes')
    .select('*, users!classes_class_teacher_id_fkey(id, full_name)')
    .eq('id', params.id)
    .eq('school_id', profile.school_id)
    .single()

  if (!cls) redirect('/dashboard/classes')

  // Fetch enrolled students
  const { data: students } = await supabase
    .from('students')
    .select('*')
    .eq('class_id', params.id)
    .eq('school_id', profile.school_id)
    .order('first_name')

  // Fetch teachers for the assign dropdown
  const teachers = await getTeachers(profile.school_id)

  const teacherObj = Array.isArray(cls.users) ? cls.users[0] : cls.users as any
  const teacherName = teacherObj?.full_name ?? null
  const teacherSalutation = teacherObj?.salutation ?? null
  const teacherId = teacherObj?.id ?? null

  return (
    <ClassDetailClient
      cls={{ id: cls.id, name: cls.name }}
      initialStudents={students || []}
      teacherName={teacherName}
      teacherSalutation={teacherSalutation}
      teacherId={teacherId}
      teachers={teachers}
      schoolId={profile.school_id}
    />
  )
}
