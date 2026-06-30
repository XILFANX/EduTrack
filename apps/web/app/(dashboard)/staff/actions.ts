'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { randomUUID } from 'crypto'

export type StaffRole =
  | 'class_teacher'
  | 'subject_teacher'
  | 'bursar'
  | 'librarian'
  | 'storekeeper'
  | 'transport_matron'

export interface InviteStaffData {
  fullName: string
  phoneNumber: string
  role: StaffRole
  schoolId: string
}

export async function inviteStaff(
  data: InviteStaffData
): Promise<{ token: string } | { error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { error: 'Not authenticated.' }

    const admin = createAdminClient()

    // Generate unique token
    const token = randomUUID()

    // Insert into invitations table
    const { error: invErr } = await admin.from('invitations').insert({
      school_id: data.schoolId,
      role: data.role,
      token,
      name: data.fullName,
      phone: data.phoneNumber,
      created_by: user.id,
    })

    if (invErr) {
      console.error('Invitation insert error:', invErr)
      return { error: 'Failed to generate invite link.' }
    }

    return { token }
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred.' }
  }
}


export async function getStaff(schoolId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, role, phone_number, created_at')
    .eq('school_id', schoolId)
    .neq('role', 'principal')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) return []
  return data ?? []
}
