'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Wallet, TrendingUp, TrendingDown, Users, FileText,
  BarChart3, ChevronRight, CreditCard, AlertTriangle, CheckCircle2
} from 'lucide-react'

const fmt = (n: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n)
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

const STATUS_CONFIG: Record<string, { label: string; bg: string; dot: string }> = {
  paid: { label: 'Paid', bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400', dot: 'bg-emerald-400' },
  partial: { label: 'Partial', bg: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400', dot: 'bg-amber-400' },
  unpaid: { label: 'Unpaid', bg: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400', dot: 'bg-red-400' },
}

export function BursarDashboardClient({ stats, recentPayments }: { stats: any; recentPayments: any[] }) {
  const collectionPct = stats.totalExpected > 0 ? (stats.totalCollected / stats.totalExpected) * 100 : 0
  const [tab, setTab] = useState<'overview' | 'payments'>('overview')

  return (
    <div className="space-y-6 pb-24">
      {/* Premium hero banner */}
      <div className="relative bg-gradient-to-br from-emerald-700 via-teal-700 to-emerald-900 rounded-3xl p-6 overflow-hidden text-white shadow-xl">
        {/* decorative blobs */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-teal-400/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight">Finance Dashboard</h1>
                <p className="text-emerald-200 text-sm">School Fee Collection Overview</p>
              </div>
            </div>

            {/* Collection rate bar */}
            <div className="mb-1.5 flex items-center justify-between text-xs text-emerald-200">
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
              { label: 'Collected', value: fmt(stats.totalCollected), icon: TrendingUp, accent: 'bg-emerald-400/20' },
              { label: 'Arrears', value: fmt(stats.outstanding), icon: TrendingDown, accent: 'bg-red-400/20' },
              { label: 'Students', value: stats.totalStudents, icon: Users, accent: 'bg-white/10' },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className={`${item.accent} backdrop-blur-sm rounded-2xl px-3 py-2.5 flex flex-col gap-0.5`}>
                  <div className="flex items-center gap-1.5 text-emerald-200">
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
          { label: 'Record Payment', href: '/bursar/invoices', icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-800/30' },
          { label: 'View Invoices', href: '/bursar/invoices', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-100 dark:border-blue-800/30' },
          { label: 'Defaulters List', href: '/bursar/invoices', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-100 dark:border-amber-800/30' },
          { label: 'Fee Structures', href: '/bursar/fee-structures', icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-100 dark:border-purple-800/30' },
        ].map((action, i) => {
          const Icon = action.icon
          return (
            <Link
              key={i}
              href={action.href}
              className={`flex flex-col items-center gap-2 p-4 ${action.bg} border ${action.border} rounded-2xl hover:scale-[1.02] transition-all text-center group`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-slate-900 shadow-sm`}>
                <Icon className={`w-5 h-5 ${action.color}`} />
              </div>
              <span className="text-xs font-semibold text-foreground">{action.label}</span>
              <ChevronRight className={`w-3.5 h-3.5 ${action.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
            </Link>
          )
        })}
      </div>

      {/* Recent Payments */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-bold text-foreground">Recent Payments</h2>
          <Link href="/bursar/invoices" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1">
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
            {recentPayments.slice(0, 8).map((p: any, i: number) => {
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
          { label: 'Fully Paid', icon: CheckCircle2, value: `—`, sub: 'students cleared', color: 'emerald' },
          { label: 'Partial Payers', icon: AlertTriangle, value: `—`, sub: 'still outstanding', color: 'amber' },
          { label: 'Not Paid', icon: TrendingDown, value: `—`, sub: 'zero payment', color: 'red' },
        ].map((card, i) => {
          const Icon = card.icon
          return (
            <div key={i} className={`bg-${card.color}-50 dark:bg-${card.color}-900/10 border border-${card.color}-100 dark:border-${card.color}-800/30 rounded-2xl p-4 flex items-center gap-4`}>
              <div className={`w-10 h-10 rounded-xl bg-${card.color}-100 dark:bg-${card.color}-900/40 flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 text-${card.color}-600 dark:text-${card.color}-400`} />
              </div>
              <div>
                <p className={`text-xl font-extrabold text-${card.color}-700 dark:text-${card.color}-400`}>{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
