import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GraduationCap, BookOpen, ClipboardList, Users, TrendingUp, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function TeacherDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileResult } = await supabase
    .from('users')
    .select('school_id, full_name, role')
    .eq('id', user.id)
    .single()

  const profile = profileResult as any
  if (!profile?.school_id) return null

  const today = new Date().toISOString().split('T')[0]

  // ─── CLASS TEACHER BRANCH ───
  if (profile.role === 'class_teacher') {
    const { data: cls } = await supabase
      .from('classes')
      .select('id, name, level, stream')
      .eq('class_teacher_id', user.id)
      .eq('school_id', profile.school_id)
      .single()

    const classData = cls as any

    let totalStudents = 0
    let presentToday = 0
    let absentToday = 0
    let lateToday = 0
    let weekHistory: { date: string; present: number; total: number }[] = []

    if (classData) {
      const { count } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', classData.id)
        .is('deleted_at', null)
      totalStudents = count ?? 0

      // Today's attendance breakdown
      const { data: todayAtt } = await supabase
        .from('attendance')
        .select('status')
        .eq('class_id', classData.id)
        .eq('date', today)

      if (todayAtt) {
        presentToday = todayAtt.filter((a: any) => a.status === 'Present').length
        absentToday = todayAtt.filter((a: any) => a.status === 'Absent').length
        lateToday = todayAtt.filter((a: any) => a.status === 'Late').length
      }

      // Last 7 days attendance summary
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
      const startDate = sevenDaysAgo.toISOString().split('T')[0]

      const { data: weekAtt } = await supabase
        .from('attendance')
        .select('date, status')
        .eq('class_id', classData.id)
        .gte('date', startDate)
        .lte('date', today)

      // Group by date
      const grouped: Record<string, { present: number; total: number }> = {}
      if (weekAtt) {
        weekAtt.forEach((a: any) => {
          if (!grouped[a.date]) grouped[a.date] = { present: 0, total: 0 }
          grouped[a.date].total++
          if (a.status === 'Present') grouped[a.date].present++
        })
      }
      weekHistory = Object.entries(grouped)
        .map(([date, v]) => ({ date, ...v }))
        .sort((a, b) => a.date.localeCompare(b.date))
    }

    const attendanceRate = totalStudents > 0 && (presentToday + absentToday + lateToday) > 0
      ? Math.round((presentToday / (presentToday + absentToday + lateToday)) * 100)
      : null

    return (
      <div className="space-y-6 pb-4">
        {/* Class Hero */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-[40px] rounded-full pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white font-black text-lg">
                {classData?.name?.substring(0, 2) || 'CL'}
              </div>
              <div>
                <h1 className="text-xl font-black">{classData?.name || 'No Class Assigned'}</h1>
                <p className="text-sm text-blue-100">{totalStudents} students enrolled</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/10 border border-white/20 rounded-2xl p-3 text-center">
                <p className="text-2xl font-bold">{presentToday}</p>
                <p className="text-xs text-blue-100 mt-0.5">Present</p>
              </div>
              <div className="bg-white/10 border border-white/20 rounded-2xl p-3 text-center">
                <p className="text-2xl font-bold">{absentToday}</p>
                <p className="text-xs text-blue-100 mt-0.5">Absent</p>
              </div>
              <div className="bg-white/10 border border-white/20 rounded-2xl p-3 text-center">
                <p className="text-2xl font-bold">{lateToday}</p>
                <p className="text-xs text-blue-100 mt-0.5">Late</p>
              </div>
            </div>
            {attendanceRate !== null && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-1.5">
                  <p className="text-xs font-semibold text-blue-100">Today's Rate</p>
                  <p className="text-xs font-bold text-white">{attendanceRate}%</p>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all" style={{ width: `${attendanceRate}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 7-day attendance history */}
        {weekHistory.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              7-Day Attendance
            </h2>
            <div className="flex items-end gap-1.5 h-16">
              {weekHistory.map((day) => {
                const pct = day.total > 0 ? (day.present / day.total) * 100 : 0
                const color = pct >= 90 ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-400' : 'bg-red-400'
                const label = new Date(day.date).toLocaleDateString('en', { weekday: 'short' }).slice(0, 2)
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col justify-end" style={{ height: 48 }}>
                      <div className={`${color} rounded-sm w-full`} style={{ height: `${Math.max(pct, 8)}%` }} />
                    </div>
                    <span className="text-[9px] text-muted-foreground font-medium">{label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: '/teacher/attendance', label: 'Take Attendance', icon: ClipboardList, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { href: '/teacher/grades', label: 'Enter Grades', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
            { href: '/teacher/students', label: 'My Students', icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
            { href: '/teacher/discipline', label: 'Discipline Log', icon: GraduationCap, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          ].map(({ href, label, icon: Icon, color, bg }) => (
            <Link key={href} href={href} className={`flex items-center gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors shadow-sm`}>
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <span className="font-semibold text-sm text-foreground">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  // ─── SUBJECT TEACHER BRANCH ───
  const { data: assignmentsData } = await supabase
    .from('class_subjects')
    .select('id, class_id, subject_id, classes(id, name), subjects(id, name)')
    .eq('teacher_id', user.id)
    .eq('school_id', profile.school_id)

  const assignments = (assignmentsData || []) as any[]

  // Count grades entered per assignment (class+subject)
  const assignmentStats = await Promise.all(
    assignments.map(async (a) => {
      const { count } = await supabase
        .from('exam_results')
        .select('*', { count: 'exact', head: true })
        .eq('subject_id', a.subject_id)
        .eq('school_id', profile.school_id)
      return { ...a, gradesCount: count ?? 0 }
    })
  )

  const uniqueSubjects = [...new Set(assignments.map((a) => a.subjects?.name).filter(Boolean))]
  const uniqueClasses = [...new Set(assignments.map((a) => a.classes?.name).filter(Boolean))]

  return (
    <div className="space-y-6 pb-4">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-[40px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black">Subject Teacher</h1>
              <p className="text-sm text-blue-100">{uniqueSubjects.join(', ') || 'No subjects yet'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 border border-white/20 rounded-2xl p-3 text-center">
              <p className="text-2xl font-bold">{uniqueSubjects.length}</p>
              <p className="text-xs text-blue-100 mt-0.5">Subjects</p>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-2xl p-3 text-center">
              <p className="text-2xl font-bold">{uniqueClasses.length}</p>
              <p className="text-xs text-blue-100 mt-0.5">Classes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Assignments list */}
      <div>
        <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">My Assignments</h2>
        {assignmentStats.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No class-subject assignments yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Your school administrator will assign subjects to you.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignmentStats.map((a) => (
              <Link
                key={a.id}
                href={`/teacher/grades?class=${a.class_id}&subject=${a.subject_id}`}
                className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{a.subjects?.name}</p>
                    <p className="text-xs text-muted-foreground">{a.classes?.name} · {a.gradesCount} grades recorded</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
