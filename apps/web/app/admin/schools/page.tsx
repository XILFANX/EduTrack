import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SchoolsTable } from './schools-table'

export const dynamic = 'force-dynamic'

export default async function AdminSchoolsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ROOT_EMAIL = process.env.PRODUCT_ADMINISTRATOR_EMAIL
  const isRoot = user.email === ROOT_EMAIL

  if (!isRoot) {
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') redirect('/dashboard')
  }

  const { createAdminClient } = await import('@/lib/supabase/server')
  const admin = await createAdminClient()

  const { data: schoolsData } = await admin
    .from('schools')
    .select('*')
    .order('created_at', { ascending: false })
  
  const schools = schoolsData as any[]

  const { data: studentsData } = await admin
    .from('students')
    .select('school_id')
    .is('deleted_at', null)

  const studentsBySchool: Record<string, number> = {}
  for (const s of studentsData ?? []) {
    studentsBySchool[s.school_id] = (studentsBySchool[s.school_id] ?? 0) + 1
  }

  const initialData = (schools ?? []).map(s => ({
    ...s,
    subscription_tier: s.subscription_tier ?? 'basic',
    curriculum_type: s.curriculum_type ?? '8-4-4',
    studentCount: studentsBySchool[s.id] ?? 0
  }))

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Schools</h1>
        <p className="text-base text-muted-foreground flex items-center gap-2">
          {schools?.length ?? 0} registered schools across the platform
        </p>
      </header>

      <SchoolsTable initialData={initialData} />
    </div>
  )
}
