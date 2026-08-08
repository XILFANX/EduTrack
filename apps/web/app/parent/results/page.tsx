import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { FileText, Trophy, BookOpen, TrendingUp, AlertCircle, Award } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ childId?: string; eventId?: string }>
}

function medalIcon(position: number) {
  if (position === 1) return '🥇'
  if (position === 2) return '🥈'
  if (position === 3) return '🥉'
  return `#${position}`
}

export default async function ParentResultsPage({ searchParams }: Props) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase.from('users').select('school_id, role').eq('id', user.id).single()
  const profile = profileRaw as any
  if (!profile?.school_id || profile.role !== 'parent') redirect('/parent/dashboard')

  const adminClient = createAdminClient()

  // Find children
  const { data: linksRaw } = await adminClient.from('student_parents' as any).select('student_id').eq('parent_id', user.id)
  const studentIds = ((linksRaw as any[]) || []).map((l: any) => l.student_id)

  let children: any[] = []
  if (studentIds.length > 0) {
    const { data: studentsRaw } = await adminClient
      .from('students')
      .select('id, first_name, last_name, admission_number, class_id, classes(name)')
      .in('id', studentIds)
    children = (studentsRaw || []) as any[]
  }

  const selectedChildId = params.childId || children[0]?.id || ''
  const selectedChild = children.find(c => c.id === selectedChildId) || null

  // Fetch report cards for selected child
  let reportCards: any[] = []
  if (selectedChildId) {
    const { data: rcRaw } = await adminClient
      .from('report_cards' as any)
      .select('id, total_score, average_score, overall_grade, position_in_class, class_size, published_at, exam_event_id, exam_events(id, name, term_id, academic_terms(name))')
      .eq('student_id', selectedChildId)
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
    reportCards = (rcRaw || []) as any[]
  }

  const selectedEventId = params.eventId || reportCards[0]?.exam_event_id || ''
  const selectedCard = reportCards.find(rc => rc.exam_event_id === selectedEventId) || null

  // Fetch detailed results for selected report card
  let subjectResults: any[] = []
  if (selectedCard && selectedChildId) {
    // We need exam results for this student in the event
    // Get all exams under this event
    const { data: eventClassesRaw } = await adminClient
      .from('exam_event_classes' as any)
      .select('exam_event_id')
      .eq('exam_event_id', selectedEventId)

    const { data: resultsRaw } = await adminClient
      .from('exam_results' as any)
      .select('score, grade, remarks, subject_id, subjects(name)')
      .eq('student_id', selectedChildId)
      .eq('exam_event_id', selectedEventId)
      .eq('school_id', profile.school_id)
    subjectResults = (resultsRaw || []) as any[]
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 via-blue-500 to-blue-600 p-6 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[50px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Report Cards</h1>
            <p className="text-blue-100 text-sm mt-0.5">Published academic results for your child</p>
          </div>
        </div>
      </div>

      {children.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-3xl">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No children linked to your account.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: child + event selector */}
          <div className="lg:col-span-1 space-y-4">
            {/* Child selector */}
            {children.length > 1 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Child</p>
                {children.map(child => (
                  <a
                    key={child.id}
                    href={`/parent/results?childId=${child.id}`}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all ${
                      selectedChildId === child.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                        : 'border-border bg-card hover:border-cyan-300'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                      <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                        {child.first_name?.[0]}{child.last_name?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">{child.first_name} {child.last_name}</p>
                      <p className="text-xs text-muted-foreground">{child.classes?.name}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}

            {/* Report card list */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Exam Results</p>
              {reportCards.length === 0 ? (
                <div className="text-center py-10 bg-card border border-border rounded-2xl">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No published results yet.</p>
                </div>
              ) : reportCards.map(rc => (
                <a
                  key={rc.id}
                  href={`/parent/results?childId=${selectedChildId}&eventId=${rc.exam_event_id}`}
                  className={`block px-4 py-3 rounded-2xl border-2 transition-all ${
                    selectedEventId === rc.exam_event_id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                      : 'border-border bg-card hover:border-cyan-300'
                  }`}
                >
                  <p className={`text-sm font-bold ${selectedEventId === rc.exam_event_id ? 'text-blue-700 dark:text-blue-100' : 'text-foreground'}`}>
                    {rc.exam_events?.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {rc.exam_events?.academic_terms?.name} · Avg: {rc.average_score?.toFixed(1)}%
                  </p>
                </a>
              ))}
            </div>
          </div>

          {/* Right: report card detail */}
          <div className="lg:col-span-2">
            {!selectedCard ? (
              <div className="text-center py-16 bg-card border border-border rounded-3xl h-full flex flex-col items-center justify-center">
                <Award className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-sm text-muted-foreground">Select an exam result to view the report card.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Report card header */}
                <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                        {selectedCard.exam_events?.name}
                      </p>
                      <h2 className="text-xl font-black text-foreground">
                        {selectedChild?.first_name} {selectedChild?.last_name}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {selectedChild?.classes?.name} · Adm. {selectedChild?.admission_number || '—'}
                      </p>
                    </div>
                    {selectedCard.position_in_class && (
                      <div className="text-center bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 rounded-2xl px-5 py-3">
                        <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{medalIcon(selectedCard.position_in_class)}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mt-0.5">
                          of {selectedCard.class_size}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Summary stats */}
                  <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
                    <div className="text-center">
                      <p className="text-2xl font-black text-foreground">{selectedCard.total_score?.toFixed(0)}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Total</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{selectedCard.average_score?.toFixed(1)}%</p>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Average</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{selectedCard.overall_grade || '—'}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Overall</p>
                    </div>
                  </div>
                </div>

                {/* Subject breakdown */}
                {subjectResults.length > 0 && (
                  <div className="bg-card border border-border rounded-3xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-border bg-slate-50/60 dark:bg-[#060d1a]/40">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Subject Results</p>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="px-5 py-2.5 text-left text-xs font-bold text-muted-foreground">Subject</th>
                          <th className="px-5 py-2.5 text-center text-xs font-bold text-muted-foreground">Score</th>
                          <th className="px-5 py-2.5 text-center text-xs font-bold text-muted-foreground">Grade</th>
                          <th className="px-5 py-2.5 text-left text-xs font-bold text-muted-foreground">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {subjectResults
                          .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
                          .map((result: any, idx: number) => (
                            <tr key={idx} className={idx % 2 !== 0 ? 'bg-slate-50/40 dark:bg-[#060d1a]/20' : ''}>
                              <td className="px-5 py-3 font-semibold text-foreground">{result.subjects?.name}</td>
                              <td className="px-5 py-3 text-center font-bold text-foreground">{result.score ?? '—'}</td>
                              <td className="px-5 py-3 text-center">
                                {result.grade ? (
                                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                                    {result.grade}
                                  </span>
                                ) : <span className="text-slate-300 text-xs">—</span>}
                              </td>
                              <td className="px-5 py-3 text-xs text-muted-foreground">{result.remarks || '—'}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <p className="text-xs text-muted-foreground text-center">
                  Published {selectedCard.published_at ? new Date(selectedCard.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
