import { getBursarOverview } from '../actions'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Coins, Receipt, ArrowUpRight, ArrowDownRight, Wallet, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function BursarDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return null

  const stats = await getBursarOverview(profile.school_id)

  const formatKES = (amount: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(amount)
  }

  const collectionRate = stats.expected > 0 ? Math.round((stats.collected / stats.expected) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Financial Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Track fee collections and arrears across the school.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-emerald-600 border-none text-white shadow-lg">
          <CardHeader className="pb-2 p-4">
            <CardTitle className="text-xs font-medium text-emerald-100 flex items-center gap-2 uppercase tracking-wider">
              <Wallet className="w-4 h-4" /> Collected
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold">{formatKES(stats.collected)}</p>
            <p className="text-xs text-emerald-200 mt-1">{collectionRate}% collection rate</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2 p-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2 uppercase tracking-wider">
              <ArrowDownRight className="w-4 h-4 text-red-500" /> Arrears
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold text-foreground">{formatKES(stats.arrears)}</p>
            <p className="text-xs text-muted-foreground mt-1">Pending payments</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2 p-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2 uppercase tracking-wider">
              <Coins className="w-4 h-4 text-blue-500" /> Expected
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold text-foreground">{formatKES(stats.expected)}</p>
            <p className="text-xs text-muted-foreground mt-1">Total billed</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2 p-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2 uppercase tracking-wider">
              <Receipt className="w-4 h-4 text-purple-500" /> Invoices
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold text-foreground">{stats.count}</p>
            <p className="text-xs text-muted-foreground mt-1">Active invoices</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/bursar/fee-structures" className="group">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors h-full">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Fee Structures</h3>
            <p className="text-sm text-muted-foreground">Define fees per class or term, set up itemized billing like tuition and transport.</p>
          </div>
        </Link>
        <Link href="/bursar/invoices" className="group">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors h-full">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Manage Invoices</h3>
            <p className="text-sm text-muted-foreground">Bill students in bulk, track M-Pesa payments, and send reminders for arrears.</p>
          </div>
        </Link>
      </div>

    </div>
  )
}
