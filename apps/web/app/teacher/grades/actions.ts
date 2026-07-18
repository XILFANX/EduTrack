'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
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

// Single-row save used by the new ResultsEntryTable for per-row auto-save
export async function saveExamResult(data: {
  studentId: string
  examId: string
  subjectId: string
  score: number
  grade: string | null
  remarks: string | null
  schoolId: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) throw new Error('No school')

  const admin = await createAdminClient()
  const { error } = await admin
    .from('exam_results')
    .upsert({
      school_id: profile.school_id,
      exam_id: data.examId,
      subject_id: data.subjectId,
      student_id: data.studentId,
      score: data.score,
      grade: data.grade,
      remarks: data.remarks,
      recorded_by: user.id,
    }, { onConflict: 'exam_id, student_id, subject_id' })

  if (error) throw new Error(error.message)
  return { success: true }
}
