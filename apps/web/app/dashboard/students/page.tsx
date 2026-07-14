import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StudentsPageClient } from '@/components/shared/students/students-client'

export default async function StudentsPage({ searchParams }: { searchParams: { enroll?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return null

  // Fetch all students in the school (excluding deleted ones)
  const { data: students } = await supabase
    .from('students')
    .select('*, classes(name)')
    .eq('school_id', profile.school_id)
    .is('deleted_at', null)
    .order('first_name')

  // Fetch all classes in the school for the enroll modal
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', profile.school_id)
    .is('deleted_at', null)
    .order('name')

  return (
    <StudentsPageClient 
      initialStudents={students || []} 
      classes={classes || []} 
      autoEnroll={searchParams?.enroll === 'true'}
    />
  )
}
