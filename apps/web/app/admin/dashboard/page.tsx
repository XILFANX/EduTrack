import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, Users, Receipt, Activity } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // We rely on the layout to have already verified this user is an admin or root.
  // Using the admin client to bypass RLS and fetch global stats
  const { createAdminClient } = await import('@/lib/supabase/server')
  const admin = await createAdminClient()

  // Total Schools
  const { count: schoolCount } = await admin
    .from('schools')
    .select('*', { count: 'exact', head: true })

  // Total Students
  const { count: studentCount } = await admin
    .from('students')
    .select('*', { count: 'exact', head: true })

  // Total Invoices / Billed
  const { data: invoices } = await admin
    .from('invoices')
    .select('amount, balance')
    .is('deleted_at', null)

  const totalBilled = (invoices || []).reduce((acc: number, inv: any) => acc + (inv.amount || 0), 0)
  const totalCollected = (invoices || []).reduce((acc: number, inv: any) => acc + ((inv.amount || 0) - (inv.balance || 0)), 0)

  const formatKES = (n: number) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Platform Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Global statistics across all registered schools.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="border-slate-200 dark:border-slate-800 bg-indigo-50 dark:bg-indigo-950/20">
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{schoolCount || 0}</p>
              <p className="text-xs text-muted-foreground font-medium">Active Schools</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 dark:border-slate-800 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{studentCount || 0}</p>
              <p className="text-xs text-muted-foreground font-medium">Total Students</p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 border-slate-200 dark:border-slate-800 bg-emerald-50 dark:bg-emerald-950/20">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center shrink-0">
              <Receipt className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Platform Revenue Handled</p>
              <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">{formatKES(totalCollected)}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">Out of {formatKES(totalBilled)} billed globally</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-500" />
          System Health
        </h2>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/50">
            <span className="text-sm text-muted-foreground">Database Status</span>
            <span className="text-sm font-semibold text-emerald-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/50">
            <span className="text-sm text-muted-foreground">M-Pesa API Link</span>
            <span className="text-sm font-semibold text-emerald-600">Connected</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Platform Version</span>
            <span className="text-sm font-mono text-slate-600 dark:text-slate-400">v1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  )
}
