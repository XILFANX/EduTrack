import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FeeStructuresClient } from './fee-structures-client'

export default async function FeeStructuresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return null
  const schoolId = profile.school_id

  const [
    { data: structuresData },
    { data: termsData },
    { data: classesData },
  ] = await Promise.all([
    supabase
      .from('fee_structures')
      .select('id, description, amount, academic_terms(name), classes(name)')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false }),
    supabase
      .from('academic_terms')
      .select('id, name, is_active')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false }),
    supabase
      .from('classes')
      .select('id, name')
      .eq('school_id', schoolId)
      .order('name'),
  ])

  return (
    <FeeStructuresClient
      schoolId={schoolId}
      structures={(structuresData as any[]) || []}
      terms={(termsData as any[]) || []}
      classes={(classesData as any[]) || []}
    />
  )
}

