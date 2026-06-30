import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import InviteClient from './invite-client'

interface Props {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params
  const admin = createAdminClient()

  // Look up invitation by token
  const { data: rawInvitation } = await admin
    .from('invitations')
    .select('id, name, role, school_id, used_at, schools(name)')
    .eq('token', token)
    .single()

  const invitation = rawInvitation as any

  if (!invitation || invitation.used_at) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <h1 className="text-xl font-bold text-slate-900">Invalid or Expired Invite</h1>
          <p className="text-slate-500 mt-2">This invitation link is either invalid or has already been used.</p>
        </div>
      </div>
    )
  }

  const schoolName = (invitation.schools as any)?.name ?? 'Your School'

  return (
    <InviteClient
      token={token}
      fullName={invitation.name}
      role={invitation.role}
      schoolName={schoolName}
    />
  )
}
