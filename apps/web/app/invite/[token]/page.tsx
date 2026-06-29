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
      name,
      phone,
      used_at,
      landlord_id,
      property_id,
      landlords ( name ),
      properties ( name )
    `)
    .eq('token', token)
    .single()

  if (error || !invite) {
    notFound()
  }

  const isReturningUser = invite.used_at !== null

  // Fetch landlord info for display
  const landlordName = (invite.landlords as any)?.name ?? 'Your Property Manager'
  const propertyName = (invite.properties as any)?.name ?? null

  let unitName = null

  // Access Revocation Check
  if (isReturningUser) {
    if (invite.role === 'tenant' && invite.name && invite.phone) {
      const { data: tenantInfo } = await admin
        .from('tenants')
        .select('status, units(unit_number, properties(name))')
        .eq('landlord_id', invite.landlord_id)
        .eq('full_name', invite.name)
        .eq('phone', invite.phone)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!tenantInfo || tenantInfo.status === 'moved_out') {
        return <RevokedAccessScreen message="Your lease has ended or your account has been deactivated." />
      }

      const unit = tenantInfo.units as any
      if (unit) {
        unitName = unit.unit_number
      }
    } else if (invite.role === 'caretaker' && invite.property_id) {
      // Check if property still has this caretaker assigned
      const { data: prop } = await admin
        .from('properties')
        .select('caretaker_id')
        .eq('id', invite.property_id)
        .single()
      
      // We also need to check if they have a profile
      const syntheticEmail = `${token}@invite.estatetrack.app`
      const { data: usersData } = await admin.auth.admin.listUsers()
      const existingUser = usersData?.users?.find(u => u.email === syntheticEmail)

      if (!existingUser || prop?.caretaker_id !== existingUser.id) {
        return <RevokedAccessScreen message="You are no longer assigned as a caretaker for this property." />
      }
    }
  } else {
    // For first-time setup, just get the unit name if available
    if (invite.role === 'tenant' && invite.name && invite.phone) {
      const { data: tenantInfo } = await admin
        .from('tenants')
        .select('units(unit_number, properties(name))')
        .eq('landlord_id', invite.landlord_id)
        .eq('full_name', invite.name)
        .eq('phone', invite.phone)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const unit = tenantInfo?.units as any
      if (unit) {
        unitName = unit.unit_number
      }
    }
  }

  const roleLabels: Record<string, string> = {
    tenant: 'Tenant',
    caretaker: 'Caretaker',
    property_manager: 'Property Manager',
    accountant: 'Accountant',
  }

  const roleLabel = roleLabels[invite.role] ?? invite.role

  return (
    <InviteClient
      token={token}
      inviteId={invite.id}
      role={invite.role}
      roleLabel={roleLabel}
      landlordId={invite.landlord_id}
      landlordName={landlordName}
      propertyName={propertyName}
      unitName={unitName}
      prefilledName={invite.name ?? ''}
      registeredPhone={invite.phone ?? null}
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
