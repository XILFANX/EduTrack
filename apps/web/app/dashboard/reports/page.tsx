import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText, Search, GraduationCap, UserCircle2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminReportsPage({ searchParams }: { searchParams: Promise<{ class?: string }> }) {
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

  const [{ data: classes }, { data: activeTerm }] = await Promise.all([
    supabase.from('classes').select('id, name').eq('school_id', schoolId).order('name'),
    supabase.from('academic_terms').select('id, name, academic_years(name)').eq('school_id', schoolId).eq('is_active', true).single(),
  ])

  const selectedClassId = params.class || classes?.[0]?.id || ''

  let students: any[] = []
  if (selectedClassId) {
    const { data } = await supabase
      .from('students')
      .select('id, first_name, last_name, admission_number, photo_url')
      .eq('class_id', selectedClassId)
      .eq('school_id', schoolId)
      .is('deleted_at', null)
      .order('first_name')
    students = data || []
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
          <FileText className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Report Cards</h1>
          <p className="text-sm text-muted-foreground">
            {activeTerm ? `Active session: ${(activeTerm as any).academic_years?.name} — ${activeTerm.name}` : 'No active term set.'}
          </p>
        </div>
      </div>

      {/* Class Selector */}
      <div className="flex gap-3 flex-wrap">
        {(classes || []).map(cls => (
          <Link
            key={cls.id}
            href={`/dashboard/reports?class=${cls.id}`}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
              selectedClassId === cls.id
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-card text-foreground border-border hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {cls.name}
          </Link>
        ))}
      </div>

      {/* Students Grid */}
      {students.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-3xl">
          <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Select a class to view students.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map(student => (
            <Link
              key={student.id}
              href={`/dashboard/reports/student/${student.id}`}
              className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl hover:border-indigo-400 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                {student.photo_url ? (
                  <img src={student.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg font-bold text-slate-400">
                    {student.first_name[0]}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate group-hover:text-indigo-600 transition-colors">
                  {student.first_name} {student.last_name}
                </p>
                <p className="text-xs text-muted-foreground">{student.admission_number}</p>
              </div>
              <FileText className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 shrink-0 transition-colors" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
