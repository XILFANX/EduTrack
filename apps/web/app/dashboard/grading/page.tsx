import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GradingClient } from './grading-client'

export const dynamic = 'force-dynamic'

export default async function GradingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase
    .from('users')
    .select('school_id, role')
    .eq('id', user.id)
    .single()

  const profile = profileRaw as any
  const role = (profile?.role || '').toLowerCase()
  const isAdmin = role.includes('admin') || role.includes('principal') || role.includes('headteacher')
  if (!profile?.school_id || !isAdmin) redirect('/dashboard')

  const schoolId = profile.school_id

  const { data: scalesRaw } = await supabase
    .from('grade_scales')
    .select('id, grade, label, min_score, max_score, points, remarks')
    .eq('school_id', schoolId)
    .order('min_score', { ascending: false })

  const scales = (scalesRaw || []) as any[]

  return (
    <GradingClient
      schoolId={schoolId}
      initialScales={scales}
    />
  )
}
