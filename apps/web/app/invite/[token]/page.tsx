import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import InviteClient from './invite-client'

interface Props {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params
  const admin = createAdminClient()

  // Look up user by the token-based fake email
  const fakeEmail = `${token}@edutrack.internal`
  const { data: { users } } = await admin.auth.admin.listUsers()
  const authUser = users.find((u) => u.email === fakeEmail)

  if (!authUser) return notFound()

  // Get their EduTrack profile
  const { data: profile } = await admin
    .from('users')
    .select('full_name, role, school_id')
    .eq('id', authUser.id)
    .single()

  if (!profile) return notFound()

  if (!profile.school_id) return notFound()

  // Get the school name
  const { data: school } = await admin
    .from('schools')
    .select('name')
    .eq('id', profile.school_id)
    .single()

  return (
    <InviteClient
      token={token}
      fullName={profile.full_name}
      role={profile.role}
      schoolName={school?.name ?? 'Your School'}
    />
  )
}
