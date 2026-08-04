import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { FeeTemplateBuilder } from './fee-template-builder'

export const dynamic = 'force-dynamic'

export default async function FeeStructuresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase.from('users').select('school_id, role').eq('id', user.id).single()
  const profile = profileRaw as any
  if (!profile?.school_id) redirect('/login')

  const allowed = ['admin', 'principal', 'headteacher', 'bursar']
  if (!allowed.some(r => profile.role?.includes(r))) redirect('/bursar/dashboard')

  const schoolId = profile.school_id
  const adminClient = createAdminClient()

  const [
    { data: templatesRaw },
    { data: termsRaw },
    { data: yearsRaw },
    { data: classesRaw },
  ] = await Promise.all([
    adminClient
      .from('fee_templates' as any)
      .select('id, name, class_id, term_id, year_id, created_at, fee_items(id, description, amount, sort_order), classes(name), academic_terms(name)')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false }),
    supabase.from('academic_terms').select('id, name, year_id, is_active').eq('school_id', schoolId).order('start_date'),
    supabase.from('academic_years').select('id, name, is_active').eq('school_id', schoolId).order('start_date', { ascending: false }),
    supabase.from('classes').select('id, name').eq('school_id', schoolId).is('deleted_at', null).order('name'),
  ])

  return (
    <FeeTemplateBuilder
      schoolId={schoolId}
      initialTemplates={(templatesRaw || []) as any[]}
      terms={(termsRaw || []) as any[]}
      years={(yearsRaw || []) as any[]}
      classes={(classesRaw || []) as any[]}
    />
  )
}
