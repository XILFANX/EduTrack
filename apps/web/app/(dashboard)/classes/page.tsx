import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function ClassesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return null

  // Fetch classes and aggregate student counts manually for demo purposes
  const { data: classes } = await supabase
    .from('classes')
    .select('*, users!classes_class_teacher_id_fkey(full_name)')
    .eq('school_id', profile.school_id)
    .order('name')

  const { data: students } = await supabase
    .from('students')
    .select('class_id')
    .eq('school_id', profile.school_id)

  const studentCountMap = (students || []).reduce((acc: any, student) => {
    if (student.class_id) {
      acc[student.class_id] = (acc[student.class_id] || 0) + 1
    }
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Classes</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage class rosters and assign teachers.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
          <Plus className="w-4 h-4" />
          Add Class
        </Button>
      </div>

      {!classes || classes.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/40 mx-auto flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">No classes created</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
            Add your first class to start enrolling students and assigning teachers.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => {
             // We cast cls.users because Supabase returns an array for joins, or an object if properly defined. 
             // We used the ! to hint the relationship, but let's handle both.
             const teacherName = Array.isArray(cls.users) ? cls.users[0]?.full_name : (cls.users as any)?.full_name

             return (
               <Link key={cls.id} href={`/classes/${cls.id}`}>
                 <Card className="border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition-colors cursor-pointer group h-full">
                   <CardContent className="p-5 flex flex-col h-full">
                     <div className="flex justify-between items-start mb-4">
                       <h3 className="font-bold text-lg text-foreground group-hover:text-blue-600 transition-colors">{cls.name}</h3>
                       <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                         <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-600 transition-colors" />
                       </div>
                     </div>
                     <div className="space-y-1 text-sm text-muted-foreground mt-auto">
                       <p>Teacher: <span className="text-foreground font-medium">{teacherName || 'Unassigned'}</span></p>
                       <p>Students: <span className="text-foreground font-medium">{studentCountMap[cls.id] || 0}</span></p>
                     </div>
                   </CardContent>
                 </Card>
               </Link>
             )
          })}
        </div>
      )}
    </div>
  )
}
