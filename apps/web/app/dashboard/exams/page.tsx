import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { AdminExamsTabs } from './admin-exams-tabs'
import { ClipboardList } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ exam?: string }>
}

export default async function AdminExamsPage({ searchParams }: Props) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id || !['admin', 'principal', 'headteacher'].includes((profile as any).role)) redirect('/dashboard')

  const schoolId = (profile as any).school_id
  const adminClient = createAdminClient()

  const [
    { data: years },
    { data: terms },
    { data: classes },
    { data: exams },
    { data: gradeScales },
    { data: subjects },
  ] = await Promise.all([
    supabase.from('academic_years').select('id, name, is_active').eq('school_id', schoolId).order('start_date', { ascending: false }),
    supabase.from('academic_terms').select('id, name, year_id, is_active').eq('school_id', schoolId).order('start_date'),
    supabase.from('classes').select('id, name').eq('school_id', schoolId).order('name'),
    supabase.from('exams').select('id, name, max_score, term_id, year_id, class_id, created_at').eq('school_id', schoolId).order('created_at', { ascending: false }),
    supabase.from('grade_scales').select('*').eq('school_id', schoolId).order('min_score', { ascending: false }),
    supabase.from('subjects').select('id, name').eq('school_id', schoolId).order('name'),
  ])

  // If an exam is selected, fetch its timetable slots
  const selectedExamId = params.exam || (exams as any[])?.[0]?.id || ''
  const selectedExam = (exams as any[] || []).find((e: any) => e.id === selectedExamId) || null

  const { data: examSlots } = selectedExamId
    ? await adminClient
        .from('exam_timetables')
        .select('*')
        .eq('exam_id', selectedExamId)
        .eq('school_id', schoolId)
    : { data: [] }

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Examination Management</h1>
          <p className="text-sm text-muted-foreground">Create, schedule, and publish exams per academic session.</p>
        </div>
      </div>

      <AdminExamsTabs
        years={(years as any[]) || []}
        terms={(terms as any[]) || []}
        classes={(classes as any[]) || []}
        initialExams={(exams as any[]) || []}
        initialGradeScales={(gradeScales as any[]) || []}
        schoolId={schoolId}
        subjects={(subjects as any[]) || []}
        selectedExamId={selectedExamId}
        selectedExam={selectedExam}
        initialExamSlots={(examSlots as any[]) || []}
      />
    </div>
  )
}
