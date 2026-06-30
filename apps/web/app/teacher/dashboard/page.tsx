import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { GraduationCap, BookOpen, Clock, Users } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function TeacherDashboard() {
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

  // Fetch classes where the user is the class teacher
  const { data: classTeacherOf } = await supabase
    .from('classes')
    .select('*')
    .eq('class_teacher_id', user.id)
    .eq('school_id', profile.school_id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Welcome back, {profile.full_name.split(' ')[0]}!</h1>
        <p className="text-sm text-muted-foreground mt-1">Here's your academic overview for today.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="border-slate-200 dark:border-slate-800 bg-indigo-50 dark:bg-indigo-950/20">
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{classTeacherOf?.length || 0}</p>
              <p className="text-xs text-muted-foreground font-medium">My Classes</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">8:00 AM</p>
              <p className="text-xs text-muted-foreground font-medium">Next Class</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Assigned Classes</h2>
        {!classTeacherOf || classTeacherOf.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <GraduationCap className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No classes assigned yet.</p>
          </div>
        ) : (
          classTeacherOf.map(cls => (
            <Card key={cls.id} className="border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="p-4 flex items-center justify-between bg-white dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center font-bold">
                    {cls.name.substring(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{cls.name}</h3>
                    <p className="text-xs text-muted-foreground">Class Teacher</p>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
