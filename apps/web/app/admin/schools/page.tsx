import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { GraduationCap } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminSchoolsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== process.env.PRODUCT_ADMINISTRATOR_EMAIL) redirect('/login')

  const supabaseAdmin = await createAdminClient()

  const { data: schools } = await supabaseAdmin
    .from('schools')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Schools</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Manage all registered schools on the platform.
          </p>
        </div>
      </header>

      <div className="bg-white dark:bg-slate-900/50 border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-500" />
            All Schools ({schools?.length || 0})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-bold">Name</th>
                <th className="px-6 py-4 font-bold">Domain</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {schools?.map(school => (
                <tr key={school.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-foreground">{school.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{school.domain || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                      school.subscription_plan !== 'Trial' 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/50' 
                        : 'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/50'
                    }`}>
                      {school.subscription_plan || 'Trial'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(school.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
