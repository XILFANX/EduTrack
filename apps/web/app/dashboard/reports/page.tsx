import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FileText, GraduationCap, UserCircle2, ChevronLeft } from 'lucide-react'
import { ClassDirectory } from '@/components/shared/class-directory'

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
  const role = ((profile as any).role || '').toLowerCase()
  const isAdmin = role.includes('admin') || role.includes('principal') || role.includes('headteacher')
  if (!profile?.school_id || !isAdmin) redirect('/dashboard')

  const schoolId = (profile as any).school_id

  const [{ data: classes }, { data: activeTerm }] = await Promise.all([
    supabase.from('classes').select('id, name').eq('school_id', schoolId).order('name'),
    supabase.from('academic_terms').select('id, name, academic_years(name)').eq('school_id', schoolId).eq('is_active', true).single(),
  ])
  const classList = classes || []
  const selectedClassId = params.class || ''

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

  if (!selectedClassId) {
    return (
      <ClassDirectory
        title="Report Cards"
        description={activeTerm ? `Active session: ${(activeTerm as any).academic_years?.name} — ${activeTerm.name}` : 'No active term set.'}
        classes={classList.map(c => ({ id: c.id, name: c.name, countLabel: 'View students' }))}
        basePath="/dashboard/reports?class"
      />
    )
  }

  const selectedClass = classList.find(c => c.id === selectedClassId)

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      <div className="flex items-center gap-4">
        <a href="/dashboard/reports" className="p-2 rounded-xl bg-[#121827] border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </a>
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            Reports <span className="text-slate-600">/</span> <span className="text-blue-400">{selectedClass?.name}</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {activeTerm ? `Active session: ${(activeTerm as any).academic_years?.name} — ${activeTerm.name}` : 'No active term set.'}
          </p>
        </div>
      </div>

      {/* Students Grid */}
      {students.length === 0 ? (
        <div className="text-center py-20 bg-[#121827] border border-slate-800 rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/50 mx-auto flex items-center justify-center mb-4">
            <GraduationCap className="w-8 h-8 text-slate-500" />
          </div>
          <h2 className="text-lg font-semibold text-slate-200">No students enrolled</h2>
          <p className="text-sm text-slate-400 mt-2 mb-6 max-w-xs mx-auto">Enroll students in this class to generate report cards.</p>
          <a href="/dashboard/students" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
            Enroll Students
          </a>
        </div>
      ) : (
          <div className="bg-[#121827] border border-slate-800 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-800/50">
            {students.map(student => (
              <a 
                key={student.id} 
                href={`/dashboard/reports/student/${student.id}`}
                className="flex items-center justify-between p-4 hover:bg-[#1a2133] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center overflow-hidden shrink-0 border border-slate-700">
                    {student.photo_url ? (
                      <img src={student.photo_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle2 className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200 text-sm">{student.first_name} {student.last_name}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{student.admission_number}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-block text-xs font-semibold px-2 py-1 bg-slate-800 text-slate-300 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    View Report
                  </span>
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
              </a>
            ))}
          </div>
      )}
    </div>
  )
}
