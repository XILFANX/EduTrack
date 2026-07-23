import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { Shield } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== process.env.PRODUCT_ADMINISTRATOR_EMAIL) redirect('/login')

  const supabaseAdmin = await createAdminClient()

  // For EduTrack, platform admins could be mapped or just the root admin for now
  const { data } = await supabaseAdmin
    .from('users')
    .select('*, schools(name)')
    .eq('role', 'admin')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const admins = data as any[] | null

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Platform Admins</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Manage system administrators and their access levels.
          </p>
        </div>
      </header>

      <div className="bg-white dark:bg-slate-900/50 border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-500" />
            Admins ({admins?.length || 0})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-bold">Name</th>
                <th className="px-6 py-4 font-bold">Email / Phone</th>
                <th className="px-6 py-4 font-bold">School</th>
                <th className="px-6 py-4 font-bold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {admins?.map(admin => (
                <tr key={admin.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-foreground">{admin.full_name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{admin.email || admin.phone_number}</td>
                  <td className="px-6 py-4 text-muted-foreground">{admin.schools?.name || 'Platform Level'}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(admin.created_at).toLocaleDateString()}
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
