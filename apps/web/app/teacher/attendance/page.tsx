import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ClipboardList, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function TeacherAttendance() {
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
          <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {cls ? `Marking register for ${cls.name}` : 'No class assigned'}
          </p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
          Save Register
        </Button>
      </div>

      {!cls ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 mx-auto flex items-center justify-center mb-4">
            <ClipboardList className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">No Class Assigned</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
            You must be assigned as a Class Teacher to take morning attendance.
          </p>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-sm text-muted-foreground">No students enrolled in this class yet.</p>
        </div>
      ) : (
        <div className="space-y-3 pb-20">
          {students.map((student: any) => (
            <Card key={student.id} className="border-slate-200 dark:border-slate-800 flex items-center justify-between p-4 bg-white dark:bg-slate-900">
              <div>
                <h3 className="font-semibold text-foreground">{student.first_name} {student.last_name}</h3>
                <p className="text-xs text-muted-foreground font-mono">{student.admission_number}</p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="w-10 h-10 rounded-full text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:border-emerald-200 transition-colors">
                  <CheckCircle2 className="w-5 h-5" />
                </Button>
                <Button variant="outline" size="icon" className="w-10 h-10 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 hover:border-red-200 transition-colors">
                  <XCircle className="w-5 h-5" />
                </Button>
                <Button variant="outline" size="icon" className="w-10 h-10 rounded-full text-slate-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950 hover:border-orange-200 transition-colors">
                  <Clock className="w-5 h-5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
