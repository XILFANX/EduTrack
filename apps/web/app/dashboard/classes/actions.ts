'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createClass(schoolId: string, name: string, classTeacherId?: string) {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('classes')
    .insert({
      school_id: schoolId,
      name,
      class_teacher_id: classTeacherId || null,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/classes')
  return { success: true, data }
}

export async function enrollStudent(schoolId: string, classId: string, firstName: string, lastName: string, admissionNumber: string, dob?: string) {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('students')
    .insert({
      school_id: schoolId,
      class_id: classId,
      first_name: firstName,
      last_name: lastName,
      admission_number: admissionNumber,
      dob: dob || null,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/classes/${classId}`)
  revalidatePath('/students')
  return { success: true, data }
}
