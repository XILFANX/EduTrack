'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Wallet, TrendingUp, TrendingDown, Users, FileText,
  BarChart3, ChevronRight, CreditCard, AlertTriangle, CheckCircle2, Banknote
} from 'lucide-react'

const fmt = (n: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n)
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

const STATUS_CONFIG: Record<string, { label: string; bg: string; dot: string }> = {
  paid: { label: 'Paid', bg: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400', dot: 'bg-blue-400' },
  partial: { label: 'Partial', bg: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400', dot: 'bg-orange-400' },
  unpaid: { label: 'Unpaid', bg: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400', dot: 'bg-orange-400' },
}

export function BursarDashboardClient({ stats, recentPayments }: { stats: any; recentPayments: any[] }) {
  const collectionPct = stats.totalExpected > 0 ? (stats.totalCollected / stats.totalExpected) * 100 : 0
  const [tab, setTab] = useState<'overview' | 'payments'>('overview')

  return (
    <div className="space-y-6 pb-24">
      {/* Premium hero banner */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-blue-500 rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[50px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight">Finance Dashboard</h1>
                <p className="text-blue-200 text-sm">School Fee Collection Overview</p>
              </div>
            </div>

            {/* Collection rate bar */}
            <div className="mb-1.5 flex items-center justify-between text-xs text-blue-200">
              <span>Collection Rate</span>
              <span className="font-bold text-white">{collectionPct.toFixed(1)}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-white transition-all duration-700"
                style={{ width: `${Math.min(100, collectionPct)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:w-64">
            {[
              { label: 'Expected', value: fmt(stats.totalExpected), icon: BarChart3, accent: 'bg-white/10' },
              { label: 'Collected', value: fmt(stats.totalCollected), icon: TrendingUp, accent: 'bg-blue-400/20' },
              { label: 'Arrears', value: fmt(stats.outstanding), icon: TrendingDown, accent: 'bg-orange-400/20' },
              { label: 'Students', value: stats.totalStudents, icon: Users, accent: 'bg-white/10' },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className={`${item.accent} backdrop-blur-sm rounded-2xl px-3 py-2.5 flex flex-col gap-0.5`}>
                  <div className="flex items-center gap-1.5 text-blue-200">
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-semibold uppercase tracking-wide">{item.label}</span>
                  </div>
                  <p className="text-white font-bold text-sm leading-tight">{item.value}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Verify Fees', sublabel: 'Record payments', href: '/bursar/payments', icon: CheckCircle2 },
          { label: 'Defaulters List', sublabel: 'View unpaid', href: '/bursar/invoices', icon: AlertTriangle },
          { label: 'Fee Structures', sublabel: 'Manage terms', href: '/bursar/fee-structures', icon: BarChart3 },
          { label: 'Ledger', sublabel: 'Transaction log', href: '/bursar/ledger', icon: Banknote },
        ].map((action, i) => {
          const Icon = action.icon
          return (
            <Link
              key={i}
              href={action.href}
              className="flex flex-col items-center gap-2 p-4 bg-card hover:bg-slate-50 dark:hover:bg-slate-900/50 border border-border hover:border-blue-500/50 rounded-2xl hover:scale-[1.02] transition-all text-center shadow-sm group"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 group-hover:bg-blue-100 dark:group-hover:bg-blue-800/40 transition-colors">
                <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-center min-w-0 w-full mt-1">
                <p className="font-bold text-xs text-foreground truncate">{action.label}</p>
                <p className="text-[10px] text-muted-foreground truncate hidden sm:block mt-0.5">{action.sublabel}</p>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Recent Payments */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-bold text-foreground">Recent Payments</h2>
          <Link href="/bursar/invoices" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1">
            View all <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentPayments.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentPayments.slice(0, 3).map((p: any, i: number) => {
              const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.unpaid
              return (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/60 dark:hover:bg-slate-900/30 transition-colors">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {p.students?.first_name} {p.students?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{fmtDate(p.payment_date || p.created_at)} · {p.students?.classes?.name || '—'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm text-foreground">{fmt(Number(p.amount))}</p>
                    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border border-transparent ${cfg.bg}`}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Debt analysis chart-like cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Fully Paid', icon: CheckCircle2, value: `—`, sub: 'students cleared' },
          { label: 'Partial Payers', icon: AlertTriangle, value: `—`, sub: 'still outstanding' },
          { label: 'Not Paid', icon: TrendingDown, value: `—`, sub: 'zero payment' },
        ].map((card, i) => {
          const Icon = card.icon
          return (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xl font-extrabold text-foreground">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
