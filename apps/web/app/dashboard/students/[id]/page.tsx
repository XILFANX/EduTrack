import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GraduationCap, ArrowLeft, Calendar, FileText, User } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { StudentProfileClient } from './student-profile-client'

export default async function StudentProfilePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return null

  // Fetch student details
  const { data: student } = await supabase
    .from('students')
    .select('*, classes(id, name)')
    .eq('id', params.id)
    .eq('school_id', profile.school_id)
    .single()

  if (!student) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold">Student not found</h1>
        <p className="text-muted-foreground mt-2">This student may have been deleted or does not exist.</p>
        <Link href="/students">
          <Button variant="outline" className="mt-4">Back to Directory</Button>
        </Link>
      </div>
    )
  }

  // Fetch all classes for the class assignment dropdown
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', profile.school_id)
    .is('deleted_at', null)
    .order('name')

  return (
    <div className="space-y-6">
      <Link href="/students" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Directory
      </Link>

      <StudentProfileClient student={student} classes={classes || []} />
    </div>
  )
}
