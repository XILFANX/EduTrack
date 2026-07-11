import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStaff, getInvitations } from './actions'
import { StaffPageClient } from './staff-page-client'

export const dynamic = 'force-dynamic'

export default async function StaffPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) redirect('/onboarding')

  const staff = await getStaff(profile.school_id)
  const invitations = await getInvitations(profile.school_id)

  return <StaffPageClient staff={staff} invitations={invitations} schoolId={profile.school_id} />
}
