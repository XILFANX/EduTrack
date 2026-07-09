import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClassesPageClient } from './classes-client'

export default async function ClassesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return null

  // Fetch classes and aggregate student counts manually
  const { data: classes } = await supabase
    .from('classes')
    .select('*, users!classes_class_teacher_id_fkey(id, full_name, salutation)')
    .eq('school_id', profile.school_id)
    .order('name')

  const { data: students } = await supabase
    .from('students')
    .select('class_id')
    .eq('school_id', profile.school_id)

  const studentCountMap = (students || []).reduce((acc: any, student) => {
    if (student.class_id) {
      acc[student.class_id] = (acc[student.class_id] || 0) + 1
    }
    return acc
  }, {})

  const curriculumType = 'cbc'

  return (
    <ClassesPageClient 
      classes={classes || []}
      studentCountMap={studentCountMap}
      schoolId={profile.school_id}
      curriculumType={curriculumType}
    />
  )
}
