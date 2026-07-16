'use client'

import { Wallet, Users, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react'

export function BursarDashboardClient({ stats, recentPayments }: { stats: any, recentPayments: any[] }) {
  const formatter = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' })

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-[40px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black">Financial Overview</h1>
            <p className="text-sm text-blue-100">Real-time revenue and collection metrics</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Expected */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground font-medium mb-1">Expected Revenue</p>
          <h3 className="text-2xl font-bold text-foreground">{formatter.format(stats.totalExpected)}</h3>
        </div>

        {/* Collected */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
          <div className="flex items-center justify-between mb-4 relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
              {stats.collectionRate}%
            </div>
          </div>
          <p className="text-sm text-muted-foreground font-medium mb-1 relative">Total Collected</p>
          <h3 className="text-2xl font-bold text-foreground relative">{formatter.format(stats.totalCollected)}</h3>
        </div>

        {/* Outstanding */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-red-500/10 dark:bg-red-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
          <div className="flex items-center justify-between mb-4 relative">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground font-medium mb-1 relative">Outstanding Arrears</p>
          <h3 className="text-2xl font-bold text-foreground relative">{formatter.format(stats.outstanding)}</h3>
        </div>

        {/* Enrolled Students */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground font-medium mb-1">Active Students</p>
          <h3 className="text-2xl font-bold text-foreground">{stats.totalStudents}</h3>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500" />
            Recent M-Pesa Payments
          </h2>
        </div>
        
        {recentPayments.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-muted-foreground">No recent payments recorded.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentPayments.map((p, i) => (
              <div key={i} className="py-4 flex justify-between items-center first:pt-0 last:pb-0">
                <div>
                  <p className="font-medium text-foreground">Payment Received</p>
                  <p className="text-xs text-muted-foreground">{new Date(p.payment_date).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">+{formatter.format(p.amount)}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">M-Pesa</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
