import { getBursarOverview } from '../actions'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Coins, Receipt, Wallet, BookOpen, Smartphone, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function BursarDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id, full_name, schools(name)')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return null

  const schoolId = profile.school_id
  const school = (profile as any).schools

  const [stats, { data: activeTerm }, { data: recentPayments }] = await Promise.all([
    getBursarOverview(schoolId),
    supabase
      .from('academic_terms')
      .select('id, name, start_date, end_date')
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .single(),
    supabase
      .from('fee_payments')
      .select('id, amount, payment_method, mpesa_receipt, payment_date, students(first_name, last_name)')
      .eq('school_id', schoolId)
      .order('payment_date', { ascending: false })
      .limit(5),
  ])

  const formatKES = (amount: number) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(amount)

  const collectionRate = stats.expected > 0 ? Math.round((stats.collected / stats.expected) * 100) : 0

  const METHOD_ICON: Record<string, string> = {
    mpesa: '📱',
    cash: '💵',
    bank_transfer: '🏦',
    cheque: '📄',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Financial Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {school?.name} · {activeTerm ? activeTerm.name : 'No active term'}
        </p>
      </div>

      {!activeTerm && (
        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            No active academic term. Ask your principal to set one up before generating invoices.
          </p>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-emerald-600 border-none text-white shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-emerald-200" />
              <p className="text-xs text-emerald-100 uppercase tracking-wider font-medium">Collected</p>
            </div>
            <p className="text-2xl font-bold">{formatKES(stats.collected)}</p>
            <div className="mt-2 bg-emerald-700/60 rounded-full h-1.5">
              <div className="bg-white h-1.5 rounded-full" style={{ width: `${collectionRate}%` }} />
            </div>
            <p className="text-xs text-emerald-200 mt-1">{collectionRate}% collection rate</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Arrears</p>
            </div>
            <p className="text-2xl font-bold text-red-500">{formatKES(stats.arrears)}</p>
            <p className="text-xs text-muted-foreground mt-1">Outstanding balance</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-4 h-4 text-blue-500" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Expected</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{formatKES(stats.expected)}</p>
            <p className="text-xs text-muted-foreground mt-1">Total billed</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="w-4 h-4 text-violet-500" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Invoices</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.count}</p>
            <p className="text-xs text-muted-foreground mt-1">Active invoices</p>
          </CardContent>
        </Card>
      </div>

      {/* M-Pesa Info Banner */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 dark:from-emerald-700 dark:to-emerald-900 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold">M-Pesa Payments</p>
            <p className="text-xs text-emerald-100">Share these details with parents for fee payment</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-xs text-emerald-100 mb-0.5">Paybill Number</p>
            <p className="text-lg font-bold font-mono tracking-wider">247 247</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-xs text-emerald-100 mb-0.5">Account Number</p>
            <p className="text-lg font-bold font-mono tracking-wider">School Code</p>
          </div>
        </div>
        <p className="text-xs text-emerald-200 mt-3">
          After payment, ask parents for their M-Pesa receipt number and record it manually in Invoices.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/bursar/fee-structures" className="group">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors h-full">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Fee Structures</h3>
            <p className="text-sm text-muted-foreground">Define fees per class or term — tuition, transport, meals.</p>
          </div>
        </Link>
        <Link href="/bursar/invoices" className="group">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors h-full">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Manage Invoices</h3>
            <p className="text-sm text-muted-foreground">Generate invoices per class, record M-Pesa and cash payments.</p>
          </div>
        </Link>
      </div>

      {/* Recent Payments */}
      {recentPayments && recentPayments.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-foreground mb-3">Recent Payments</h2>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            {(recentPayments as any[]).map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{METHOD_ICON[p.payment_method] || '💰'}</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {p.students?.first_name} {p.students?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {p.payment_method.replace('_', ' ')}
                      {p.mpesa_receipt ? ` · ${p.mpesa_receipt}` : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-600">{formatKES(p.amount)}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(p.payment_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
