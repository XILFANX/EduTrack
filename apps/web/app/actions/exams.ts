'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

const ADMIN_ROLES = ['admin', 'principal', 'headteacher']

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', user: null, profile: null, supabase }
  const { data: profile } = await supabase.from('users').select('school_id, role').eq('id', user.id).single()
  const p = profile as any
  if (!p?.school_id || !ADMIN_ROLES.some(r => p.role?.includes(r))) return { error: 'Unauthorized', user: null, profile: null, supabase }
  return { error: null, user, profile: p, supabase }
}

// ─── EXAM EVENTS (Admin) ──────────────────────────────────────────────────────

export async function createExamEvent(data: {
  name: string
  termId: string
  yearId: string
  classIds: string[]
}) {
  const { error: authError, supabase, profile } = await requireAdmin()
  if (authError || !profile) return { error: authError }

  const { data: event, error } = await supabase
    .from('exam_events' as any)
    .insert({
      school_id: profile.school_id,
      name: data.name,
      term_id: data.termId,
      year_id: data.yearId,
      status: 'draft',
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // Link participating classes
  if (data.classIds.length > 0) {
    const admin = createAdminClient()
    await admin.from('exam_event_classes' as any).insert(
      data.classIds.map(cid => ({ exam_event_id: (event as any).id, class_id: cid }))
    )
  }

  revalidatePath('/dashboard/exams')
  return { success: true, event }
}

export async function updateExamEvent(id: string, data: { name?: string; status?: string }) {
  const { error: authError, supabase } = await requireAdmin()
  if (authError) return { error: authError }

  const { error } = await supabase.from('exam_events' as any).update({ ...data, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/exams')
  return { success: true }
}

export async function deleteExamEvent(id: string) {
  const { error: authError, supabase, profile } = await requireAdmin()
  if (authError || !profile) return { error: authError }

  const { error } = await supabase.from('exam_events' as any).delete().eq('id', id).eq('school_id', profile.school_id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/exams')
  return { success: true }
}

export async function publishExamEvent(id: string) {
  return updateExamEvent(id, { status: 'published' })
}

export async function closeExamEvent(id: string) {
  return updateExamEvent(id, { status: 'closed' })
}

// ─── EXAM TIMETABLE SLOTS (Admin) ────────────────────────────────────────────

export async function scheduleExamSubject(data: {
  examEventId: string
  subjectId: string
  classId: string
  examDate: string
  startTime: string
  endTime: string
}) {
  const { error: authError, supabase, profile } = await requireAdmin()
  if (authError || !profile) return { error: authError }

  const { data: slot, error } = await supabase
    .from('exam_timetables')
    .upsert({
      school_id: profile.school_id,
      exam_id: data.examEventId,
      subject_id: data.subjectId,
      class_id: data.classId,
      exam_date: data.examDate,
      start_time: data.startTime,
      end_time: data.endTime,
    }, { onConflict: 'exam_id, subject_id, class_id' })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/exams')
  return { success: true, slot }
}

export async function removeExamScheduleSlot(slotId: string) {
  const { error: authError, supabase, profile } = await requireAdmin()
  if (authError || !profile) return { error: authError }

  const { error } = await supabase
    .from('exam_timetables')
    .delete()
    .eq('id', slotId)
    .eq('school_id', profile.school_id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/exams')
  return { success: true }
}

// ─── RESULTS ENTRY (Subject Teacher) ─────────────────────────────────────────

export async function saveExamResult(data: {
  studentId: string
  examEventId: string
  examId: string
  subjectId: string
  score: number
  grade: string | null
  remarks: string | null
  schoolId: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase.from('users').select('school_id, role').eq('id', user.id).single()
  const p = profile as any
  if (!p?.school_id) return { error: 'No school attached' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('exam_results' as any)
    .upsert({
      school_id: p.school_id,
      exam_id: data.examId,
      exam_event_id: data.examEventId,
      subject_id: data.subjectId,
      student_id: data.studentId,
      score: data.score,
      grade: data.grade,
      remarks: data.remarks,
      recorded_by: user.id,
      status: 'draft',
    }, { onConflict: 'exam_id, student_id, subject_id' })

  if (error) return { error: error.message }
  revalidatePath('/teacher/grades')
  return { success: true }
}

// ─── SUBMIT FOR REVIEW (Subject Teacher) ─────────────────────────────────────

export async function submitResultsForReview(examEventId: string, examId: string, classId: string, subjectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase.from('users').select('school_id, role').eq('id', user.id).single()
  const p = profile as any
  if (!['subject_teacher', 'class_teacher'].includes(p?.role)) return { error: 'Only teachers can submit results' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('exam_results' as any)
    .update({ status: 'submitted', submitted_at: new Date().toISOString() })
    .eq('school_id', p.school_id)
    .eq('exam_id', examId)
    .eq('subject_id', subjectId)
    .eq('status', 'draft')

  if (error) return { error: error.message }

  // Update grading status record
  await admin.from('exam_grading_status' as any).upsert({
    school_id: p.school_id,
    exam_id: examId,
    class_id: classId,
    subject_id: subjectId,
    status: 'submitted',
    submitted_at: new Date().toISOString(),
    submitted_by: user.id,
  }, { onConflict: 'exam_id, subject_id, class_id' })

  revalidatePath('/teacher/grades')
  return { success: true }
}

// ─── APPROVE / REJECT (Class Teacher) ────────────────────────────────────────

export async function approveResults(examId: string, classId: string, subjectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase.from('users').select('school_id, role').eq('id', user.id).single()
  const p = profile as any
  if (p?.role !== 'class_teacher') return { error: 'Only class teachers can approve results' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('exam_grading_status' as any)
    .update({ status: 'approved', finalized_at: new Date().toISOString(), finalized_by: user.id })
    .eq('school_id', p.school_id)
    .eq('exam_id', examId)
    .eq('class_id', classId)
    .eq('subject_id', subjectId)

  if (error) return { error: error.message }
  revalidatePath('/teacher/grades')
  return { success: true }
}

export async function rejectResults(examId: string, classId: string, subjectId: string, comment: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase.from('users').select('school_id, role').eq('id', user.id).single()
  const p = profile as any
  if (p?.role !== 'class_teacher') return { error: 'Only class teachers can reject results' }

  const admin = createAdminClient()
  // Reset exam_results status to draft with rejection comment
  await admin
    .from('exam_results' as any)
    .update({ status: 'draft', rejection_comment: comment, approved_at: null, submitted_at: null })
    .eq('school_id', p.school_id)
    .eq('exam_id', examId)
    .eq('subject_id', subjectId)

  await admin.from('exam_grading_status' as any)
    .update({ status: 'rejected', rejection_comment: comment })
    .eq('school_id', p.school_id)
    .eq('exam_id', examId)
    .eq('class_id', classId)
    .eq('subject_id', subjectId)

  revalidatePath('/teacher/grades')
  return { success: true }
}

// ─── PUBLISH REPORT CARDS (Admin) ─────────────────────────────────────────────

export async function publishReportCards(examEventId: string) {
  const { error: authError, supabase, profile } = await requireAdmin()
  if (authError || !profile) return { error: authError }

  const admin = createAdminClient()

  // Get all approved results for this exam event grouped by student
  const { data: results } = await admin
    .from('exam_results' as any)
    .select('student_id, score, subject_id, exam_id, grade')
    .eq('exam_event_id', examEventId)
    .eq('school_id', profile.school_id)
    .eq('status', 'submitted') // approved → published

  if (!results || results.length === 0) return { error: 'No submitted results found for this exam event.' }

  // Group by student
  const byStudent: Record<string, any[]> = {}
  for (const r of results as any[]) {
    if (!byStudent[r.student_id]) byStudent[r.student_id] = []
    byStudent[r.student_id].push(r)
  }

  // Get student class sizes
  const studentIds = Object.keys(byStudent)
  const { data: students } = await admin.from('students').select('id, class_id').in('id', studentIds)
  const classSizeMap: Record<string, number> = {}
  const { data: classes } = await admin.from('classes').select('id').eq('school_id', profile.school_id)
  for (const c of (classes || []) as any[]) {
    const { count } = await admin.from('students').select('id', { count: 'exact', head: true }).eq('class_id', c.id)
    classSizeMap[c.id] = count || 0
  }

  // Build report card records
  const reportCards = studentIds.map(studentId => {
    const studentResults = byStudent[studentId]
    const totalScore = studentResults.reduce((s: number, r: any) => s + Number(r.score), 0)
    const avgScore = totalScore / studentResults.length
    const student = (students || []).find((s: any) => s.id === studentId) as any
    const classSize = student?.class_id ? classSizeMap[student.class_id] || 0 : 0

    return {
      school_id: profile.school_id,
      student_id: studentId,
      exam_event_id: examEventId,
      total_score: Math.round(totalScore * 100) / 100,
      average_score: Math.round(avgScore * 100) / 100,
      class_size: classSize,
      published_at: new Date().toISOString(),
    }
  })

  // Upsert report cards
  const { error: rcError } = await admin
    .from('report_cards' as any)
    .upsert(reportCards, { onConflict: 'student_id, exam_event_id' })

  if (rcError) return { error: `Failed to generate report cards: ${rcError.message}` }

  // Mark event as closed/published
  await supabase.from('exam_events' as any).update({ status: 'closed', updated_at: new Date().toISOString() }).eq('id', examEventId)

  revalidatePath('/dashboard/exams')
  revalidatePath('/parent/results')
  return { success: true, count: reportCards.length }
}
