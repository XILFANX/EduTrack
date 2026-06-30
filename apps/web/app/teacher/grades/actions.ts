'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveExamResults(data: {
  schoolId: string
  examId: string
  subjectId: string
  teacherId: string
  results: { studentId: string; score: number; grade: string }[]
}) {
  const admin = await createAdminClient()

  const payload = data.results.map((r) => ({
    school_id: data.schoolId,
    exam_id: data.examId,
    subject_id: data.subjectId,
    student_id: r.studentId,
    score: r.score,
    grade: r.grade,
    recorded_by: data.teacherId,
  }))

  if (payload.length === 0) {
    return { error: 'No results to save.' }
  }

  // Upsert using the unique constraint (exam_id, student_id, subject_id)
  const { error } = await admin
    .from('exam_results')
    .upsert(payload, { onConflict: 'exam_id, student_id, subject_id' })

  if (error) {
    console.error('Failed to save exam results:', error)
    return { error: error.message }
  }

  revalidatePath('/teacher/grades')
  return { success: true }
}
