'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface EnrollStudentData {
  admissionNumber: string
  firstName: string
  middleName?: string
  lastName: string
  dob: string
  gender: string
  classId: string | null
}

export async function enrollStudent(
  data: EnrollStudentData
): Promise<{ success: true; studentId: string } | { error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated.' }

    const { data: profile } = await supabase
      .from('users')
      .select('school_id')
      .eq('id', user.id)
      .single()

    if (!profile?.school_id) return { error: 'School not configured.' }

    const admin = createAdminClient()

    const adm = data.admissionNumber.trim()
    if (!/^[a-zA-Z0-9]+$/.test(adm)) {
      return { error: 'Admission number can only contain letters and numbers.' }
    }

    // Validate admission number is unique within this school
    const { data: existing } = await admin
      .from('students')
      .select('id')
      .eq('school_id', profile.school_id)
      .eq('admission_number', adm)
      .is('deleted_at', null)
      .single()

    if (existing) {
      return { error: `The admission number "${adm}" is already registered to a student in the system. Please try another.` }
    }

    const { data: student, error: studentError } = await admin
      .from('students')
      .insert({
        school_id: profile.school_id,
        class_id: data.classId || null,
        first_name: data.firstName.trim(),
        middle_name: data.middleName?.trim() || null,
        last_name: data.lastName.trim(),
        admission_number: data.admissionNumber.trim(),
        dob: data.dob || null,
      })
      .select('id')
      .single()

    if (studentError || !student) {
      return { error: studentError?.message || 'Failed to enroll student.' }
    }

    revalidatePath('/dashboard/students')
    revalidatePath('/dashboard/classes')
    return { success: true, studentId: student.id }
  } catch (err: any) {
    return { error: err.message || 'Unexpected error.' }
  }
}

export async function deleteStudent(studentId: string): Promise<{ success: true } | { error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated.' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('students')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', studentId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/students')
    revalidatePath('/dashboard/classes')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function permanentlyDeleteStudent(studentId: string): Promise<{ success: true } | { error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated.' }

    const admin = createAdminClient()

    // 1. Find all parents linked ONLY to this student (to cascade-delete orphaned parent accounts)
    const { data: parentLinks } = await admin
      .from('student_parents' as any)
      .select('parent_id')
      .eq('student_id', studentId)

    const parentIds: string[] = (parentLinks || []).map((pl: any) => pl.parent_id)

    // 2. Remove parent links for this student
    await admin
      .from('student_parents' as any)
      .delete()
      .eq('student_id', studentId)

    // 3. For each linked parent — check if they have other students; if not, purge their account
    for (const parentId of parentIds) {
      const { count } = await admin
        .from('student_parents' as any)
        .select('*', { count: 'exact', head: true })
        .eq('parent_id', parentId)

      if ((count ?? 0) === 0) {
        // No other students — purge the parent's invitation and auth account
        const { data: inv } = await admin
          .from('invitations')
          .select('id, token')
          .eq('role', 'parent')
          .eq('target_entity_id', studentId)
          .single()

        if (inv) {
          // Delete the user profile
          await admin.from('users').delete().eq('id', parentId)
          // Delete the auth account
          await admin.auth.admin.deleteUser(parentId)
          // Delete the invitation
          await admin.from('invitations').delete().eq('id', inv.id)
        }
      }
    }

    // 4. Hard delete the student record
    const { error } = await admin
      .from('students')
      .delete()
      .eq('id', studentId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/students')
    revalidatePath('/dashboard/classes')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function updateStudentClass(
  studentId: string,
  classId: string | null
): Promise<{ success: true } | { error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated.' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('students')
      .update({ class_id: classId })
      .eq('id', studentId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/students')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}
