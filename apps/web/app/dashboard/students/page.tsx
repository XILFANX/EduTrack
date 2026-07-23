import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StudentsPageClient } from '@/components/shared/students/students-client'
import { ClassDirectory } from '@/components/shared/class-directory'
import Link from 'next/link'
import { UserPlus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ class?: string; enroll?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return null

  // Fetch all classes in the school for the directory and modal
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', profile.school_id)
    .is('deleted_at', null)
    .order('name')

  const selectedClassId = params.class || ''

  if (!selectedClassId && params.enroll !== 'true') {
    return (
      <ClassDirectory
        title="Student Management"
        description="Select a class to view and manage its students, or enroll a new student."
        classes={(classes || []).map(c => ({ id: c.id, name: c.name, countLabel: 'View class list' }))}
        basePath="/dashboard/students?class"
        actionButton={
          <div className="flex gap-2">
            <Link href="/dashboard/students?enroll=true" className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
              <UserPlus className="w-4 h-4" />
              Enroll Student
            </Link>
          </div>
        }
      />
    )
  }

  // Fetch students based on selected class or all if global (like enroll true)
  let query = supabase
    .from('students')
    .select('*, classes(name)')
    .eq('school_id', profile.school_id)
    .is('deleted_at', null)
    .order('first_name')
  
  if (selectedClassId && selectedClassId !== 'unassigned' && selectedClassId !== 'all') {
    query = query.eq('class_id', selectedClassId)
  } else if (selectedClassId === 'unassigned') {
    query = query.is('class_id', null)
  }

  const { data: students } = await query

  return (
    <StudentsPageClient 
      key={selectedClassId || 'all'}
      initialStudents={students || []} 
      classes={classes || []} 
      autoEnroll={params.enroll === 'true'}
      initialClassId={selectedClassId}
    />
  )
}
