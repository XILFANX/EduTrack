import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BookOpen, Users, ChevronRight, GraduationCap } from 'lucide-react'
import Link from 'next/link'

export default async function SubjectTeacherSubjects() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileResult } = await supabase
    .from('users')
    .select('school_id, role')
    .eq('id', user.id)
    .single()

  const profile = profileResult as any
  if (!profile?.school_id) return null

  // Only subject teachers should land here; class teachers are redirected
  if (profile.role !== 'subject_teacher') redirect('/teacher/dashboard')

  // Fetch all class-subject assignments for this teacher
  const { data: assignmentsData } = await supabase
    .from('class_subjects')
    .select('id, class_id, subject_id, classes(id, name, level), subjects(id, name, code)')
    .eq('teacher_id', user.id)
    .eq('school_id', profile.school_id)

  const assignments = (assignmentsData || []) as any[]

  // For each assignment, count enrolled students + grades recorded
  const enriched = await Promise.all(
    assignments.map(async (a) => {
      const { count: studentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', a.class_id)
        .is('deleted_at', null)

      const { count: gradesCount } = await supabase
        .from('exam_results')
        .select('*', { count: 'exact', head: true })
        .eq('subject_id', a.subject_id)
        .eq('school_id', profile.school_id)

      return { ...a, studentCount: studentCount ?? 0, gradesCount: gradesCount ?? 0 }
    })
  )

  // Group by subject
  const bySubject = new Map<string, { subject: any; classes: typeof enriched }>()
  enriched.forEach((a) => {
    const sid = a.subject_id
    if (!bySubject.has(sid)) bySubject.set(sid, { subject: a.subjects, classes: [] })
    bySubject.get(sid)!.classes.push(a)
  })

  const groups = Array.from(bySubject.values())

  return (
    <div className="space-y-6 pb-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Subjects</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{groups.length} subject{groups.length !== 1 ? 's' : ''} assigned to you</p>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/40 mx-auto flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">No Subjects Yet</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
            Your school administrator will assign you to subjects and classes.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map(({ subject, classes }) => (
            <div key={subject.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              {/* Subject header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">{subject.name}</p>
                  {subject.code && <p className="text-xs text-muted-foreground font-mono">{subject.code}</p>}
                </div>
                <span className="ml-auto text-xs font-semibold text-muted-foreground bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                  {classes.length} class{classes.length !== 1 ? 'es' : ''}
                </span>
              </div>

              {/* Classes list */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {classes.map((a) => (
                  <Link
                    key={a.id}
                    href={`/teacher/grades?class=${a.class_id}&subject=${a.subject_id}`}
                    className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{a.classes?.name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="w-3 h-3" /> {a.studentCount} students
                          </span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">{a.gradesCount} grades recorded</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
