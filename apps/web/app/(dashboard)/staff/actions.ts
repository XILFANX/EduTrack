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
  classId?: string // only for class_teacher
}

export async function inviteStaff(
  data: InviteStaffData
): Promise<{ token: string; schoolName: string; className?: string } | { error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { error: 'Not authenticated.' }

    const admin = createAdminClient()

    // Fetch school name for the WhatsApp message
    const { data: school } = await admin
      .from('schools')
      .select('name')
      .eq('id', data.schoolId)
      .single()

    // Fetch class name if class_teacher
    let className: string | undefined
    if (data.role === 'class_teacher' && data.classId) {
      const { data: cls } = await admin
        .from('classes')
        .select('name')
        .eq('id', data.classId)
        .single()
      className = (cls as any)?.name
    }

    // Generate unique token
    const token = randomUUID()

    // Insert into invitations table
    const { error: invErr } = await admin.from('invitations').insert({
      school_id: data.schoolId,
      role: data.role,
      token,
      target_name: data.fullName,
      target_phone: data.phoneNumber,
      target_class_id: data.classId || null,
      created_by: user.id,
    })

    if (invErr) {
      console.error('Invitation insert error:', invErr)
      return { error: 'Failed to generate invite link.' }
    }

    return { token, schoolName: (school as any)?.name ?? 'the school', className }
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred.' }
  }
}

export async function getClasses(schoolId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', schoolId)
    .order('name', { ascending: true })

  if (error) return []
  return (data ?? []) as { id: string; name: string }[]
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
