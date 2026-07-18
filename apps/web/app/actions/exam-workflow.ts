'use server'

import { createClient } from '@/lib/supabase/server'
import { broadcastAnnouncement } from './chat'

const ADMIN_ROLES = ['admin', 'principal', 'headteacher']

// ─── ADMIN: SCHEDULE EXAM SUBJECTS ─────────────────────────────

export async function scheduleExamSubject(data: {
  examId: string
  subjectId: string
  classId: string
  examDate: string
  startTime: string
  endTime: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id || !ADMIN_ROLES.includes(profile.role)) throw new Error('Unauthorized')

  const { data: slot, error } = await supabase
    .from('exam_timetables')
    .upsert({
      school_id: profile.school_id,
      exam_id: data.examId,
      subject_id: data.subjectId,
      class_id: data.classId,
      exam_date: data.examDate,
      start_time: data.startTime,
      end_time: data.endTime,
    }, { onConflict: 'exam_id, subject_id, class_id' })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return slot
}

export async function removeExamScheduleSlot(slotId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id || !ADMIN_ROLES.includes(profile.role)) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('exam_timetables')
    .delete()
    .eq('id', slotId)
    .eq('school_id', profile.school_id)

  if (error) throw new Error(error.message)
}

export async function publishExamSchedule(examId: string, examName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id || !ADMIN_ROLES.includes(profile.role)) throw new Error('Unauthorized')

  await broadcastAnnouncement(
    `Exam Schedule Published: ${examName}`,
    `The examination schedule for "${examName}" has been officially published. Please log in to your portal to view when your subjects are scheduled. Begin preparing your students accordingly.`,
    'all_staff'
  )

  return { success: true }
}

// ─── SUBJECT TEACHER: SUBMIT GRADES FOR CLASS TEACHER REVIEW ───

export async function submitGradesForReview(examId: string, classId: string, subjectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) throw new Error('No school attached')
  if (!['class_teacher', 'subject_teacher'].includes(profile.role)) throw new Error('Only teachers can submit grades')

  const { error } = await supabase
    .from('exam_grading_status')
    .upsert({
      school_id: profile.school_id,
      exam_id: examId,
      class_id: classId,
      subject_id: subjectId,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      submitted_by: user.id
    }, { onConflict: 'exam_id, subject_id, class_id' })

  if (error) throw new Error(error.message)
  return { success: true }
}

// ─── CLASS TEACHER: FINALIZE GRADES ─────────────────────────────

export async function finalizeGrades(examId: string, classId: string, subjectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) throw new Error('No school attached')
  if (!['class_teacher', 'admin', 'principal', 'headteacher'].includes(profile.role)) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('exam_grading_status')
    .update({
      status: 'finalized',
      finalized_at: new Date().toISOString(),
      finalized_by: user.id
    })
    .eq('school_id', profile.school_id)
    .eq('exam_id', examId)
    .eq('class_id', classId)
    .eq('subject_id', subjectId)

  if (error) throw new Error(error.message)
  return { success: true }
}
