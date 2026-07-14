import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { StudentProfileClient } from '@/components/shared/students/student-profile-client'

export const dynamic = 'force-dynamic'

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params   // Next.js 15+: params is a Promise

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
    .eq('id', id)
    .eq('school_id', profile.school_id)
    .single()

  if (!student) notFound()

  // Fetch all classes for the class assignment dropdown
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', profile.school_id)
    .is('deleted_at', null)
    .order('name')

  return (
    <div className="space-y-6">
      <Link href="/dashboard/students" className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Directory
      </Link>

      <StudentProfileClient student={student} classes={classes || []} />
    </div>
  )
}
