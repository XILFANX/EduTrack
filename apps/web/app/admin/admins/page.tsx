import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ShieldCheck, MoreVertical } from 'lucide-react'
import { CreateAdminButton } from './create-admin-button'

export default async function AdminManagementPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ROOT_EMAIL = process.env.PRODUCT_ADMINISTRATOR_EMAIL
  if (user.email !== ROOT_EMAIL) {
    // Only root admin can see this page
    redirect('/admin/dashboard')
  }

  const { createAdminClient } = await import('@/lib/supabase/server')
  const admin = await createAdminClient()

  // Fetch all sub-admins
  const { data: admins } = await admin
    .from('users')
    .select('*')
    .eq('role', 'admin')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Platform Admins</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage secondary administrators for EduTrack.</p>
        </div>
        <CreateAdminButton />
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-muted-foreground uppercase tracking-wider text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {/* Root Admin Row */}
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-semibold text-foreground">Planck Networks</p>
                  <p className="text-xs text-muted-foreground">{ROOT_EMAIL}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 text-xs font-semibold">
                    Root Admin
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button disabled className="text-slate-300 dark:text-slate-700 cursor-not-allowed">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </td>
              </tr>

              {/* Sub Admins */}
              {(admins || []).map((adminUser: any) => (
                <tr key={adminUser.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-foreground">{adminUser.full_name}</p>
                    <p className="text-xs text-muted-foreground">{adminUser.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-semibold">
                      Platform Admin
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
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
