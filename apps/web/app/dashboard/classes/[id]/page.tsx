import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ClassDetailClient } from './class-detail-client'
import { getTeachers } from '../actions'

export const dynamic = 'force-dynamic'

export default async function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params   // ← Next.js 15: params is a Promise

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return null

  // Fetch class details (exclude soft-deleted)
  const { data: cls } = await supabase
    .from('classes')
    .select('*, users!classes_class_teacher_id_fkey(id, full_name)')
    .eq('id', id)
    .eq('school_id', profile.school_id)
    .is('deleted_at', null)
    .single()

  if (!cls) notFound()

  // Fetch enrolled students (exclude soft-deleted)
  const { data: students } = await supabase
    .from('students')
    .select('*')
    .eq('class_id', id)
    .eq('school_id', profile.school_id)
    .is('deleted_at', null)
    .order('first_name')

  // Fetch teachers for the assign dropdown
  const teachers = await getTeachers(profile.school_id)

  const teacherObj = Array.isArray(cls.users) ? cls.users[0] : cls.users as any
  const teacherName = teacherObj?.full_name ?? null
  const teacherId = teacherObj?.id ?? null

  return (
    <ClassDetailClient
      cls={{ id: cls.id, name: cls.name }}
      initialStudents={students || []}
      teacherName={teacherName}
      teacherSalutation={null}
      teacherId={teacherId}
      teachers={teachers}
      schoolId={profile.school_id}
    />
  )
}
