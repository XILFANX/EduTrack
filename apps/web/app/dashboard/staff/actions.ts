'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'

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
  salutation: string
  role: StaffRole
  schoolId: string
  classId?: string // only for class_teacher
  classSubjectId?: string // only for subject_teacher
  photoUrl?: string
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

    // Fetch subject details if subject_teacher
    if (data.role === 'subject_teacher' && data.classSubjectId) {
      const { data: classSubj } = await admin
        .from('class_subjects')
        .select('classes(name), subjects(name)')
        .eq('id', data.classSubjectId)
        .single()
      if (classSubj) {
        className = `${(classSubj as any).subjects?.name} (${(classSubj as any).classes?.name})`
      }
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
      target_entity_id: data.role === 'subject_teacher' ? data.classSubjectId : (data.classId || null),
      target_salutation: data.salutation || null,
      target_photo_url: data.photoUrl || null,
      created_by: user.id,
    } as any)

    if (invErr) {
      console.error('Invitation insert error:', invErr)
      return { error: 'Failed to generate invite link.' }
    }

    revalidatePath('/dashboard/staff')
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
    .is('deleted_at', null)
    .order('name', { ascending: true })

  if (error) return []
  return (data ?? []) as { id: string; name: string }[]
}

export async function getUnoccupiedSubjects(schoolId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('class_subjects')
    .select('id, classes(name), subjects(name)')
    .eq('school_id', schoolId)
    .is('teacher_id', null)

  if (error) return []
  return (data || []).map((cs: any) => ({
    id: cs.id,
    label: `${cs.subjects?.name} - ${cs.classes?.name}`
  })).sort((a, b) => a.label.localeCompare(b.label))
}

export async function getStaff(schoolId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, role, phone_number, created_at, photo_url, salutation')
    .eq('school_id', schoolId)
    .neq('role', 'principal')
    .neq('role', 'parent')  // Parents have their own directory
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) return []
  return (data || []).map((u: any) => ({
    ...u,
    raw_name: u.full_name,
    full_name: u.salutation ? `${u.salutation} ${u.full_name}` : u.full_name
  }))
}

export async function getInvitations(schoolId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })

  if (error) return []
  return data ?? []
}

export async function deleteInviteAndAccount(inviteId: string) {
  const admin = createAdminClient()
  
  // 1. Fetch the invite to get the token (used as synthetic email prefix)
  const { data: invite, error: invErr } = await admin
    .from('invitations')
    .select('token, used_at')
    .eq('id', inviteId)
    .single()
    
  if (invErr || !invite) return { error: 'Invite not found.' }
  
  // 2. Delete the invitation row
  const { error: delInvErr } = await admin
    .from('invitations')
    .delete()
    .eq('id', inviteId)
    
  if (delInvErr) return { error: 'Could not delete invitation.' }
  
  // 3. Cascading delete of user account (if they already signed up)
  if (invite.used_at) {
    const syntheticEmail = `${invite.token}@invite.edutrack.app`
    const { data: usersData } = await admin.auth.admin.listUsers()
    const existingUser = usersData?.users?.find(u => u.email === syntheticEmail)
    
    if (existingUser) {
      // Hard-delete the user profile
      await admin.from('users').delete().eq('id', existingUser.id)
      // Hard-delete the auth account
      await admin.auth.admin.deleteUser(existingUser.id)
    }
  }
  
  revalidatePath('/dashboard/staff')
  return { success: true }
}
