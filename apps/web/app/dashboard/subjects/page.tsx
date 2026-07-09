import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SubjectClient } from './subject-client'

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

  // Fetch subjects with assigned teacher names
  const { data: subjects } = await supabase
    .from('subjects')
    .select('*, users!subjects_teacher_id_fkey(full_name)')
    .eq('school_id', profile.school_id)
    .is('deleted_at', null)
    .order('name')

  return (
    <SubjectClient subjects={subjects || []} schoolId={profile.school_id} />
  )
}
