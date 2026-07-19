import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SubjectClient } from './subject-client'
import { ClassDirectory } from '@/components/shared/class-directory'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function SubjectsPage({ searchParams }: { searchParams: Promise<{ class?: string; mode?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id, role')
    .eq('id', user.id)
    .single()

  const role = ((profile as any).role || '').toLowerCase()
  const isAdmin = role.includes('admin') || role.includes('principal') || role.includes('headteacher')
  if (!profile?.school_id || !isAdmin) redirect('/dashboard')

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', profile.school_id)
    .order('name')

  // Fetch all global subjects
  const { data: globalSubjects } = await supabase
    .from('subjects')
    .select('*')
    .eq('school_id', profile.school_id)
    .order('name')

  // Fetch all mappings
  const { data: classSubjects } = await supabase
    .from('class_subjects')
    .select('id, class_id, subject_id, teacher_id, users(id, full_name)')
    .eq('school_id', profile.school_id)

  const selectedClassId = params.class || ''
  const isBulkMode = params.mode === 'bulk'

  if (!selectedClassId && !isBulkMode) {
    return (
      <ClassDirectory
        title="Subject Management"
        description="Select a class to manage its subjects or assign global subjects in bulk."
        classes={(classes || []).map(c => ({ id: c.id, name: c.name, countLabel: 'Manage subjects' }))}
        basePath="/dashboard/subjects?class"
        actionButton={
          <div className="flex gap-2">
            <Link href="/dashboard/subjects?mode=bulk" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
              Global Subject Engine
            </Link>
          </div>
        }
      />
    )
  }

  return (
    <SubjectClient
      globalSubjects={globalSubjects || []}
      classSubjects={classSubjects || []}
      classes={classes || []}
      schoolId={profile.school_id}
      initialClassId={selectedClassId}
      isBulkMode={isBulkMode}
    />
  )
}
