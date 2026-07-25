import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOptimizationStats } from '@/app/actions/optimization'
import { OptimizationClient } from '@/components/admin/optimization-client'

export const dynamic = 'force-dynamic'

export default async function AdminOptimizationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const SUPA_ADMIN_EMAIL = 'plancknetworks@gmail.com'
  const isRoot = user.email === SUPA_ADMIN_EMAIL

  if (!isRoot) {
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') redirect('/admin/dashboard')
  }

  const result = await getOptimizationStats()

  const fallbackStats = {
    communications: 0,
    notifications: 0,
    audit_logs: 0,
    search_queries_log: 0,
    invitations: 0,
    policies: { communications: 180, notifications: 30, audit_logs: 90, search_queries_log: 30, invitations: 30 },
    dormant: { warning_phase: 0, final_phase: 0, deletion_phase: 0 }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Server Optimization</h1>
        <p className="text-base text-muted-foreground flex items-center gap-2">
          Manage dormant records to maintain optimal database and server performance for EduTrack.
        </p>
      </header>

      <OptimizationClient
        initialStats={(result.success && result.stats ? result.stats : fallbackStats) as any}
      />
    </div>
  )
}
