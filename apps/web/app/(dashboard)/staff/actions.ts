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

    // Create a synthetic auth user for the staff member using a token as their password
    const token = randomUUID()
    const fakeEmail = `${token}@edutrack.internal`

    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email: fakeEmail,
      password: token,
      email_confirm: true,
    })

    if (createError || !newUser.user) {
      return { error: `Failed to create account: ${createError?.message}` }
    }

    // Insert into users table
    const { error: profileError } = await admin.from('users').insert({
      id: newUser.user.id,
      school_id: data.schoolId,
      role: data.role,
      full_name: data.fullName,
      phone_number: data.phoneNumber,
    })

    if (profileError) {
      return { error: `Failed to create staff profile: ${profileError.message}` }
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
