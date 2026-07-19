import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { GradingClient } from './grading-client'
import { Sliders } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ class?: string; subject?: string }>
}

export default async function GradingPage({ searchParams }: Props) {
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

  const schoolId = (profile as any).school_id

  const [
    { data: allScales },
    { data: classes },
    { data: subjects },
  ] = await Promise.all([
    supabase
      .from('grade_scales')
      .select('*')
      .eq('school_id', schoolId)
      .order('min_score', { ascending: false }),
    supabase
      .from('classes')
      .select('id, name')
      .eq('school_id', schoolId)
      .order('name'),
    supabase
      .from('subjects')
      .select('id, name')
      .eq('school_id', schoolId)
      .order('name'),
  ])

  const selectedClassId = params.class || null
  const selectedSubjectId = params.subject || null

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-24">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
          <Sliders className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Intelligent Grading Engine</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            School-wide commander for all grading. Define global scales, then override per-class or per-subject.
          </p>
        </div>
      </div>

      <GradingClient
        allScales={(allScales as any[]) || []}
        classes={(classes as any[]) || []}
        subjects={(subjects as any[]) || []}
        schoolId={schoolId}
        initialClassId={selectedClassId}
        initialSubjectId={selectedSubjectId}
      />
    </div>
  )
}
