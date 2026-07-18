import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import { ReportCardClient } from './report-card-client'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ studentId: string }>
  searchParams: Promise<{ termId?: string; yearId?: string }>
}

export default async function ReportCardPage({ params, searchParams }: Props) {
  const { studentId } = await params
  const { termId, yearId } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) redirect('/dashboard')

  const adminClient = createAdminClient()

  // Fetch the school data
  const { data: school } = await supabase
    .from('schools')
    .select('id, name, logo_url')
    .eq('id', (profile as any).school_id)
    .single()

  // Fetch the student with their class
  const { data: student } = await adminClient
    .from('students')
    .select('id, first_name, last_name, admission_number, photo_url, dob, class_id, classes(name)')
    .eq('id', studentId)
    .eq('school_id', (profile as any).school_id)
    .single()

  if (!student) notFound()

  // Determine active or selected term
  let activeTerm: any = null
  let activeYear: any = null

  if (termId) {
    const { data: term } = await supabase.from('academic_terms').select('id, name, year_id, academic_years(name)').eq('id', termId).single()
    activeTerm = term
    activeYear = (term as any)?.academic_years
  } else {
    const { data: term } = await supabase.from('academic_terms').select('id, name, year_id, academic_years(name)').eq('school_id', (profile as any).school_id).eq('is_active', true).single()
    activeTerm = term
    activeYear = (term as any)?.academic_years
  }

  // Fetch all terms for the selector
  const { data: allTerms } = await supabase
    .from('academic_terms')
    .select('id, name, year_id, academic_years(name)')
    .eq('school_id', (profile as any).school_id)
    .order('start_date', { ascending: false })

  // Fetch exam results for this student and term
  let results: any[] = []
  if (activeTerm) {
    const { data: exams } = await adminClient
      .from('exams')
      .select('id, name, max_score, class_id')
      .eq('school_id', (profile as any).school_id)
      .eq('term_id', activeTerm.id)

    if (exams && exams.length > 0) {
      const examIds = exams.map((e: any) => e.id)
      const { data: rawResults } = await adminClient
        .from('exam_results')
        .select('exam_id, subject_id, score, grade, remarks, subjects(name, code)')
        .eq('student_id', studentId)
        .in('exam_id', examIds)

      if (rawResults) {
        results = (rawResults as any[]).map(r => ({
          ...r,
          exam: exams.find((e: any) => e.id === r.exam_id),
        }))
      }
    }
  }

  // Attendance summary for the term period
  let attendanceSummary = { present: 0, absent: 0, late: 0, total: 0 }
  if (activeTerm) {
    const { data: att } = await adminClient
      .from('attendance')
      .select('status')
      .eq('student_id', studentId)

    if (att) {
      const attArr = att as any[]
      attendanceSummary = {
        present: attArr.filter(a => a.status === 'Present').length,
        absent: attArr.filter(a => a.status === 'Absent').length,
        late: attArr.filter(a => a.status === 'Late').length,
        total: attArr.length,
      }
    }
  }

  return (
    <ReportCardClient
      school={school as any}
      student={student as any}
      activeTerm={activeTerm}
      activeYear={activeYear}
      allTerms={(allTerms as any[]) || []}
      results={results}
      attendanceSummary={attendanceSummary}
      currentStudentId={studentId}
    />
  )
}
