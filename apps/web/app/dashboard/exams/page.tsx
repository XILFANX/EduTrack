import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { ClipboardList, ChevronLeft } from 'lucide-react'
import { ClassDirectory } from '@/components/shared/class-directory'
import { AdminExamsTabs } from './admin-exams-tabs'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ exam?: string; class?: string; mode?: string }>
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

  const role = ((profile as any).role || '').toLowerCase()
  const isAdmin = role.includes('admin') || role.includes('principal') || role.includes('headteacher')
  if (!profile?.school_id || !isAdmin) redirect('/dashboard')

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

  const selectedClassId = params.class || ''
  const isBulkMode = params.mode === 'bulk'
  const isGradingMode = params.mode === 'grading'

  if (!selectedClassId && !isBulkMode && !isGradingMode) {
    return (
      <ClassDirectory
        title="Examination Management"
        description="Select a class to manage its exams, or use bulk tools."
        classes={(classes as any[]).map(c => ({ id: c.id, name: c.name, countLabel: 'Manage exams' }))}
        basePath="/dashboard/exams?class"
        actionButton={
          <div className="flex gap-2">
            <Link href="/dashboard/exams?mode=bulk" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
              Bulk Create Exams
            </Link>
            <Link href="/dashboard/exams?mode=grading" className="px-4 py-2 bg-[#1a2133] border border-slate-700 hover:border-slate-600 text-slate-300 text-sm font-semibold rounded-xl transition-colors">
              Global Grading System
            </Link>
          </div>
        }
      />
    )
  }

  const selectedClass = (classes as any[]).find(c => c.id === selectedClassId)
  
  // Filter exams based on mode
  const filteredExams = isBulkMode 
    ? (exams as any[]) 
    : (exams as any[]).filter(e => e.class_id === selectedClassId)

  // If an exam is selected, fetch its timetable slots
  const selectedExamId = params.exam || (filteredExams as any[])?.[0]?.id || ''
  const selectedExam = (filteredExams as any[] || []).find((e: any) => e.id === selectedExamId) || null

  const { data: examSlots } = selectedExamId
    ? await adminClient
        .from('exam_timetables')
        .select('*')
        .eq('exam_id', selectedExamId)
        .eq('school_id', schoolId)
    : { data: [] }

  const viewTitle = isBulkMode ? 'Bulk Exam Creation' : isGradingMode ? 'Grading System' : `${selectedClass?.name} Exams`

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/exams" className="p-2 rounded-xl bg-[#121827] border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            Exams <span className="text-slate-600">/</span> <span className="text-blue-400">{viewTitle}</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {isBulkMode ? 'Create exams that apply across multiple classes.' : isGradingMode ? 'Configure school-wide grading scales.' : 'Create, schedule, and manage exams for this class.'}
          </p>
        </div>
      </div>

      <AdminExamsTabs
        key={selectedClassId || selectedExamId || params.mode || 'default'}
        years={(years as any[]) || []}
        terms={(terms as any[]) || []}
        classes={(classes as any[]) || []}
        initialExams={filteredExams}
        initialGradeScales={(gradeScales as any[]) || []}
        schoolId={schoolId}
        subjects={(subjects as any[]) || []}
        selectedExamId={selectedExamId}
        selectedExam={selectedExam}
        initialExamSlots={(examSlots as any[]) || []}
        forceActiveTab={isGradingMode ? 'grading' : isBulkMode ? 'exams' : undefined}
        selectedClassId={selectedClassId}
      />
    </div>
  )
}
