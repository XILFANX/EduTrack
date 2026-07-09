'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface EnrollStudentData {
  firstName: string
  lastName: string
  dob: string
  gender: string
  classId: string | null
  parentName: string
  parentPhone: string
}

/**
 * Auto-generates an admission number like ETC-2026-0042
 */
async function generateAdmissionNumber(schoolId: string, admin: ReturnType<typeof createAdminClient>): Promise<string> {
  const year = new Date().getFullYear()
  const { count } = await admin
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', schoolId)

  const seq = String((count || 0) + 1).padStart(4, '0')
  return `ETC-${year}-${seq}`
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
    const admissionNumber = await generateAdmissionNumber(profile.school_id, admin)

    const { data: student, error: studentError } = await admin
      .from('students')
      .insert({
        school_id: profile.school_id,
        class_id: data.classId || null,
        first_name: data.firstName.trim(),
        last_name: data.lastName.trim(),
        admission_number: admissionNumber,
        dob: data.dob || null,
      })
      .select('id')
      .single()

    if (studentError || !student) {
      return { error: studentError?.message || 'Failed to enroll student.' }
    }

    revalidatePath('/students')
    revalidatePath('/dashboard')
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

    revalidatePath('/students')
    revalidatePath('/dashboard')
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

    revalidatePath('/students')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}
