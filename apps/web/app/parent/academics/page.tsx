import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, CheckCircle2, XCircle, Clock, GraduationCap, FileText } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ParentAcademics() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileResult } = await supabase
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  const profile = profileResult as any
  if (!profile?.school_id) return null

  // Get all students linked to this parent
  const { data: studentLinks } = await supabase
    .from('student_parents')
    .select('students(id, first_name, last_name, admission_number, class_id, classes(name))')
    .eq('parent_id', user.id)

  const students = ((studentLinks as any[]) || []).map((l: any) => l.students).filter(Boolean)

  // Get active term
  const { data: activeTerm } = await supabase
    .from('academic_terms')
    .select('id, name')
    .eq('school_id', profile.school_id)
    .eq('is_active', true)
    .single()

  // For each student, fetch attendance and exam results
  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const studentData = await Promise.all(
    students.map(async (student: any) => {
      // Attendance for the last 30 days
      const { data: attendance } = await supabase
        .from('attendance')
        .select('date, status')
        .eq('student_id', student.id)
        .gte('date', thirtyDaysAgo)
        .lte('date', today)
        .order('date', { ascending: false })

      // Exam results — only for the active term
      let results: any[] = []
      if (activeTerm) {
        const { data: examResults } = await supabase
          .from('exam_results')
          .select('score, grade, subjects(name), exams(name, term_id)')
          .eq('student_id', student.id)

        // Filter to active term only
        results = ((examResults as any[]) || []).filter(
          (r: any) => r.exams?.term_id === activeTerm.id
        )
      }

      const att = (attendance as any[]) || []
      const presentDays = att.filter((a: any) => a.status === 'Present').length
      const absentDays = att.filter((a: any) => a.status === 'Absent').length
      const lateDays = att.filter((a: any) => a.status === 'Late').length

      return { student, attendance: att, results, presentDays, absentDays, lateDays }
    })
  )

  const gradeColor = (grade: string) => {
    if (!grade || grade === '--') return 'text-slate-400'
    if (grade.startsWith('A')) return 'text-emerald-600 dark:text-emerald-400'
    if (grade.startsWith('B')) return 'text-blue-600 dark:text-blue-400'
    if (grade.startsWith('C')) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-500 dark:text-red-400'
  }

  const statusIcon = (status: string) => {
    if (status === 'Present') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
    if (status === 'Absent') return <XCircle className="w-4 h-4 text-red-500" />
    return <Clock className="w-4 h-4 text-orange-500" />
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Academics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {activeTerm ? activeTerm.name : 'No active term'} · Attendance & Grades
        </p>
      </div>

      {students.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No students linked to your account yet.</p>
        </div>
      )}

      {studentData.map(({ student, attendance, results, presentDays, absentDays, lateDays }) => (
        <div key={student.id} className="space-y-4">
          {/* Student header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-4 text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
              {student.first_name[0]}
            </div>
            <div className="flex-1">
              <p className="font-bold">{student.first_name} {student.last_name}</p>
              <p className="text-xs text-blue-100">{student.classes?.name ?? '—'} · {student.admission_number}</p>
            </div>
            <Link
              href={`/parent/results/${student.id}`}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
            >
              <FileText className="w-3.5 h-3.5" /> Report Card
            </Link>
          </div>

          {/* Attendance summary */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-4 pt-4 pb-2">
              <h2 className="text-sm font-semibold text-foreground">Attendance (Last 30 Days)</h2>
            </div>
            <div className="grid grid-cols-3 gap-px bg-slate-100 dark:bg-slate-800">
              <div className="bg-white dark:bg-slate-900 p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600">{presentDays}</p>
                <p className="text-xs text-muted-foreground mt-1">Present</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 text-center">
                <p className="text-2xl font-bold text-red-500">{absentDays}</p>
                <p className="text-xs text-muted-foreground mt-1">Absent</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 text-center">
                <p className="text-2xl font-bold text-orange-500">{lateDays}</p>
                <p className="text-xs text-muted-foreground mt-1">Late</p>
              </div>
            </div>

            {/* Recent attendance log */}
            {attendance.length > 0 && (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {attendance.slice(0, 7).map((a: any, i: number) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5">
                    <p className="text-sm text-muted-foreground">
                      {new Date(a.date).toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <div className="flex items-center gap-1.5">
                      {statusIcon(a.status)}
                      <span className="text-sm font-medium text-foreground">{a.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {attendance.length === 0 && (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground">No attendance records in the last 30 days.</p>
              </div>
            )}
          </div>

          {/* Exam results */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-4 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">
                Exam Results {activeTerm ? `· ${activeTerm.name}` : ''}
              </h2>
            </div>

            {results.length === 0 ? (
              <div className="px-4 pb-6 text-center">
                <p className="text-sm text-muted-foreground">No results published yet for this term.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {results.map((r: any, i: number) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{r.subjects?.name ?? 'Subject'}</p>
                      <p className="text-xs text-muted-foreground">{r.exams?.name ?? 'Exam'}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${gradeColor(r.grade)}`}>{r.grade ?? '--'}</p>
                      <p className="text-xs text-muted-foreground">{r.score}/100</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
