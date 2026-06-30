'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveAttendance(data: {
  schoolId: string
  classId: string
  teacherId: string
  date: string
  records: { studentId: string; status: 'Present' | 'Absent' | 'Late' }[]
}) {
  const admin = await createAdminClient()

  // Prepare upsert payload
  const payload = data.records.map((r) => ({
    school_id: data.schoolId,
    class_id: data.classId,
    student_id: r.studentId,
    date: data.date,
    status: r.status,
    recorded_by: data.teacherId,
  }))

  if (payload.length === 0) {
    return { error: 'No attendance records provided.' }
  }

  // We use upsert on (student_id, date) to allow teachers to change attendance later in the day
  const { error } = await admin
    .from('attendance')
    .upsert(payload, { onConflict: 'student_id, date' })

  if (error) {
    console.error('Attendance Save Error:', error)
    return { error: error.message }
  }

  revalidatePath('/teacher/attendance')
  return { success: true }
}
