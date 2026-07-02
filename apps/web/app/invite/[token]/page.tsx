import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import InviteClient from './invite-client'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

interface Props {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params
  const admin = createAdminClient()

  // Fetch the invitation — public lookup by token
  const { data: invite, error } = await admin
    .from('invitations')
    .select(`
      id,
      token,
      role,
      target_name,
      target_phone,
      used_at,
      school_id,
      target_class_id,
      schools ( name ),
      classes ( name )
    `)
    .eq('token', token)
    .single()

  if (error || !invite) {
    notFound()
  }

  const isReturningUser = invite.used_at !== null
  const schoolName = (invite.schools as any)?.name ?? 'Your School'
  const className = (invite.classes as any)?.name ?? null

  // Access Revocation Check — if returning user, verify they still have an active account
  if (isReturningUser) {
    const syntheticEmail = `${token}@invite.edutrack.app`
    const { data: usersData } = await admin.auth.admin.listUsers()
    const existingUser = usersData?.users?.find(u => u.email === syntheticEmail)

    if (!existingUser) {
      return <RevokedAccessScreen message="Your account has been removed. Please contact your school administrator." />
    }

    // Check if their user profile still exists and is active
    const { data: profile } = await admin
      .from('users')
      .select('id, role')
      .eq('id', existingUser.id)
      .single()

    if (!profile) {
      return <RevokedAccessScreen message="Your access has been revoked. Please contact your school administrator." />
    }
  }

  const roleLabels: Record<string, string> = {
    class_teacher:    'Class Teacher',
    subject_teacher:  'Subject Teacher',
    bursar:           'Bursar',
    librarian:        'Librarian',
    storekeeper:      'Storekeeper',
    transport_matron: 'Transport Matron',
    parent:           'Parent',
  }

  const roleLabel = roleLabels[invite.role] ?? invite.role

  return (
    <InviteClient
      token={token}
      inviteId={invite.id}
      role={invite.role}
      roleLabel={roleLabel}
      schoolId={invite.school_id}
      schoolName={schoolName}
      className={className}
      prefilledName={invite.target_name ?? ''}
      registeredPhone={invite.target_phone ?? null}
      isReturningUser={isReturningUser}
    />
  )
}

function RevokedAccessScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 text-center shadow-xl">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">Access Revoked</h1>
        <p className="text-muted-foreground text-sm mb-6">{message}</p>
        <Link href="/" className="inline-block bg-primary text-primary-foreground font-semibold px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors">
          Return Home
        </Link>
      </div>
    </div>
  )
}
