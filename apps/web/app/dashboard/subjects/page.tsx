import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SubjectClient } from './subject-client'

export const dynamic = 'force-dynamic'

export default async function SubjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return null

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', profile.school_id)
    .order('name')

  // Fetch all global subjects
  const { data: globalSubjects } = await supabase
    .from('subjects')
    .select('*')
    .eq('school_id', profile.school_id)
    .order('name')

  // Fetch all mappings
  const { data: classSubjects } = await supabase
    .from('class_subjects')
    .select('id, class_id, subject_id, teacher_id, users(id, full_name)')
    .eq('school_id', profile.school_id)

  return (
    <SubjectClient
      globalSubjects={globalSubjects || []}
      classSubjects={classSubjects || []}
      classes={classes || []}
      schoolId={profile.school_id}
    />
  )
}
