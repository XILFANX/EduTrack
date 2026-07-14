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

  const { data: subjects } = await supabase
    .from('subjects')
    .select('*, users!subjects_teacher_id_fkey(id, full_name)')
    .eq('school_id', profile.school_id)
    .order('name')

  return (
    <SubjectClient
      subjects={subjects || []}
      classes={classes || []}
      schoolId={profile.school_id}
    />
  )
}
