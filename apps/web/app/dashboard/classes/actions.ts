'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createClass(schoolId: string, name: string, classTeacherId?: string) {
  const admin = createAdminClient()

  // Validate class doesn't already exist for this school
  const { data: existing } = await admin
    .from('classes')
    .select('id')
    .eq('school_id', schoolId)
    .ilike('name', name.trim())
    .single()

  if (existing) {
    return { error: 'A class with this name already exists.' }
  }

  const { data, error } = await admin
    .from('classes')
    .insert({
      school_id: schoolId,
      name: name.trim(),
      class_teacher_id: classTeacherId || null,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/classes')
  return { success: true, data }
}

export async function createBulkClasses(schoolId: string, names: string[]) {
  const admin = createAdminClient()

  // Fetch existing classes to prevent duplicates
  const { data: existing } = await admin
    .from('classes')
    .select('name')
    .eq('school_id', schoolId)

  const existingNames = new Set(existing?.map(c => c.name.toLowerCase()) || [])

  const newClasses = names
    .filter(name => !existingNames.has(name.toLowerCase()))
    .map(name => ({
      school_id: schoolId,
      name: name.trim(),
    }))

  if (newClasses.length === 0) {
    return { error: 'All selected classes already exist.' }
  }

  const { error } = await admin
    .from('classes')
    .insert(newClasses)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/classes')
  return { success: true, count: newClasses.length }
}

export async function getTeachers(schoolId: string) {
  const admin = createAdminClient()
  
  const { data, error } = await admin
    .from('users')
    .select('id, full_name, role')
    .eq('school_id', schoolId)
    .in('role', ['class_teacher', 'subject_teacher'])
    .is('deleted_at', null)
    .order('full_name')

  if (error) {
    console.error('Error fetching teachers:', error)
    return []
  }

  return data || []
}

// Keep the enrollStudent here as it was, but fix revalidatePath
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

  revalidatePath(`/dashboard/classes/${classId}`)
  revalidatePath('/dashboard/students')
  return { success: true, data }
}
