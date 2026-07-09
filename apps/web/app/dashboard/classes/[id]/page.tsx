import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClassDetailClient } from './class-detail-client'

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
    .select('*, users!classes_class_teacher_id_fkey(full_name)')
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

  const teacherName = Array.isArray(cls.users) ? cls.users[0]?.full_name : (cls.users as any)?.full_name

  return (
    <ClassDetailClient 
      cls={{ id: cls.id, name: cls.name }}
      initialStudents={students || []}
      teacherName={teacherName}
    />
  )
}
