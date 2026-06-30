import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Building2, Settings2 } from 'lucide-react'
import { CreateSchoolButton } from './create-school-button'

export default async function AdminSchoolsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { createAdminClient } = await import('@/lib/supabase/server')
  const admin = await createAdminClient()

  // Fetch all schools
  const { data: schools } = await admin
    .from('schools')
    .select('*, students(count)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Schools Directory</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all registered institutions.</p>
        </div>
        <CreateSchoolButton />
      </div>

      {!schools || schools.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 mx-auto flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">No schools registered</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
            Click "New School" to add the first institution to the platform.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-muted-foreground uppercase tracking-wider text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">School</th>
                  <th className="px-6 py-4">Students</th>
                  <th className="px-6 py-4">Tier</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {schools.map((school: any) => {
                  const studentCount = school.students?.[0]?.count || 0
                  return (
                    <tr key={school.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-foreground">{school.name}</p>
                        <p className="text-xs text-muted-foreground">{school.domain || 'No domain'}</p>
                      </td>
                      <td className="px-6 py-4 font-medium">{studentCount}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-semibold">
                          {school.subscription_tier}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                          <Settings2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
