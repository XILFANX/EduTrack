import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PenTool, Save } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function TeacherGrades() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileResult } = await supabase
    .from('users')
    .select('school_id, full_name')
    .eq('id', user.id)
    .single()

  const profile = profileResult as any
  if (!profile?.school_id) return null

  // Fetch the first class where the user is the class teacher (simplification for demo)
  const { data: cls } = await supabase
    .from('classes')
    .select('*')
    .eq('class_teacher_id', user.id)
    .eq('school_id', profile.school_id)
    .single()

  let students: any[] = []
  if (cls) {
    const { data } = await supabase
      .from('students')
      .select('*')
      .eq('class_id', cls.id)
      .eq('school_id', profile.school_id)
      .order('first_name')
    if (data) students = data as any[]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Exam Grades</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {cls ? `Entering scores for ${cls.name}` : 'No class assigned'}
          </p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
          <Save className="w-4 h-4" />
          Save Draft
        </Button>
      </div>

      {!cls ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 mx-auto flex items-center justify-center mb-4">
            <PenTool className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">No Class Assigned</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
            You must be assigned to a class to enter grades.
          </p>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-sm text-muted-foreground">No students enrolled in this class yet.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden pb-20">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-muted-foreground uppercase tracking-wider text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Score (100)</th>
                  <th className="px-6 py-4 text-right">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {students.map((student: any) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">{student.first_name} {student.last_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{student.admission_number}</p>
                    </td>
                    <td className="px-6 py-4">
                      <select className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none">
                        <option>Mathematics</option>
                        <option>English</option>
                        <option>Science</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <input 
                        type="number" 
                        placeholder="0"
                        className="w-20 h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-slate-400">--</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
