import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Shield, ShieldCheck, Crown, UserPlus } from 'lucide-react'
import { CreateAdminButton } from './create-admin-button'
import { RemoveAdminById } from './remove-admin-form'

export const dynamic = 'force-dynamic'

const SUPA_ADMIN_EMAIL = 'plancknetworks@gmail.com'

export default async function AdminAdminsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const isRoot = user.email === SUPA_ADMIN_EMAIL

  if (!isRoot) redirect('/admin/dashboard')

  const { createAdminClient } = await import('@/lib/supabase/server')
  const admin = await createAdminClient()

  const { data: admins } = await admin
    .from('users')
    .select('id, email, full_name, role, created_at')
    .eq('role', 'admin')
    .order('created_at', { ascending: true })
    
  const filteredAdmins = admins?.filter(a => a.email !== SUPA_ADMIN_EMAIL) || []

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Platform Admins</h1>
        <p className="text-base text-muted-foreground">
          Grant or revoke admin access to the EduTrack platform.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form & Info */}
        <div className="flex flex-col gap-6">
          {/* Add admin */}
          <div className="bg-white dark:bg-slate-900/50 border border-border rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <h2 className="text-lg font-extrabold text-foreground tracking-tight">Add Admin</h2>
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-6">
              Enter the details of a new user to grant them sub-admin access to EduTrack.
            </p>
            <CreateAdminButton />
          </div>

          {/* Root admin notice */}
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-16 bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.1)_0%,_transparent_70%)] pointer-events-none opacity-50" />
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center shrink-0">
                <Crown className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <p className="font-extrabold text-foreground mb-1">Root Privileges</p>
                <p className="text-sm font-medium text-slate-500 leading-relaxed">
                  Sub-admins can view all portal data but cannot add, remove, or manage other admins. Only you can do this.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Admins list */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900/50 border border-border rounded-3xl overflow-hidden shadow-sm flex flex-col h-full">
            <div className="px-6 py-5 border-b border-border bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between">
              <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-500" />
                Active Administrators ({filteredAdmins.length + 1})
              </h2>
            </div>

            <div className="divide-y divide-border/50">
              {/* Root Admin Hardcoded (You) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner shrink-0 bg-cyan-100 dark:bg-cyan-900/40">
                    <Crown className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-foreground truncate">{SUPA_ADMIN_EMAIL}</p>
                    <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                      Root Administrator
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto pl-16 sm:pl-0">
                  <span className="text-xs bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400 px-3 py-1.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Crown className="h-3.5 w-3.5" /> Root Access
                  </span>
                </div>
              </div>

              {/* Sub-admins */}
              {filteredAdmins.map((adminObj) => (
                <div key={adminObj.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner shrink-0 bg-slate-100 dark:bg-slate-800">
                      <Shield className="h-6 w-6 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-foreground truncate">{adminObj.email}</p>
                      <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                        Platform Sub-Admin · Added{' '}
                        {new Date(adminObj.created_at!).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto pl-16 sm:pl-0">
                    <span className="text-xs bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-3 py-1.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5" /> Sub-Admin
                    </span>
                    <RemoveAdminById id={adminObj.id} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
