'use client'

import { useRouter } from 'next/navigation'
import {
  TrendingUp, Banknote, AlertTriangle, BarChart3,
  ChevronDown, Users, Clock, ArrowUpRight
} from 'lucide-react'

const formatKES = (n: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n)

// ─── Mini Bar Chart (pure CSS, no library needed) ─────────────────────────────

function BarChart({ data, color = '#3b82f6' }: { data: { label: string; value: number; max: number }[]; color?: string }) {
  const maxVal = Math.max(...data.map(d => d.max), 1)
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs font-semibold text-muted-foreground w-20 shrink-0 truncate text-right">{d.label}</span>
          <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(d.max / maxVal) * 100}%`, background: '#e2e8f0' }}
            />
            <div
              className="h-full rounded-full absolute top-0 left-0 transition-all duration-700"
              style={{ width: `${(d.value / maxVal) * 100}%`, background: color }}
            />
          </div>
          <span className="text-xs font-bold text-foreground w-16 shrink-0 text-right">
            {d.max > 0 ? `${Math.round((d.value / d.max) * 100)}%` : '0%'}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Sparkline (pure SVG, no library) ─────────────────────────────────────────

function SparkLine({ data }: { data: { date: string; amount: number }[] }) {
  const maxAmt = Math.max(...data.map(d => d.amount), 1)
  const w = 400; const h = 80; const pad = 8

  const points = data.map((d, i) => ({
    x: pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2),
    y: h - pad - ((d.amount / maxAmt) * (h - pad * 2)),
    d,
  }))

  const pathD = points.length < 2
    ? ''
    : `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`

  const areaD = points.length < 2
    ? ''
    : `M ${points[0].x},${h} L ${points.map(p => `${p.x},${p.y}`).join(' L ')} L ${points[points.length - 1].x},${h} Z`

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ minWidth: 280, height: h }}>
          <defs>
            <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {areaD && <path d={areaD} fill="url(#sparkGrad)" />}
          {pathD && <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="4" fill="white" stroke="#3b82f6" strokeWidth="2" />
          ))}
        </svg>
      </div>
      <div className="flex justify-between text-[9px] text-muted-foreground font-medium px-2">
        {data.filter((_, i) => i % 2 === 0).map((d, i) => <span key={i}>{d.date}</span>)}
      </div>
    </div>
  )
}

// ─── Main Analytics Component ─────────────────────────────────────────────────

interface Props {
  stats: { totalExpected: number; totalCollected: number; totalArrears: number; collectionRate: number }
  collectionByClass: { name: string; expected: number; collected: number }[]
  paymentTrend: { date: string; amount: number }[]
  agingBuckets: Record<string, { id: string; className: string; outstanding: number; daysOverdue: number; bucket: string }[]>
  recentPayments: any[]
  terms: any[]
  selectedTermId: string
}

export function FinanceAnalytics({ stats, collectionByClass, paymentTrend, agingBuckets, recentPayments, terms, selectedTermId }: Props) {
  const router = useRouter()
  const selectedTerm = terms.find(t => t.id === selectedTermId)
  const totalDefaulters = Object.values(agingBuckets).flat().length
  const criticalDefaulters = (agingBuckets['60+ days'] || []).length

  return (
    <div className="space-y-6 pb-24">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-blue-500 rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[50px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Financial Analytics</h1>
              <p className="text-blue-100 text-sm mt-0.5">
                {selectedTerm?.name} — School fee collection overview
              </p>
            </div>
          </div>
          {/* Term selector */}
          <div className="relative">
            <select
              value={selectedTermId}
              onChange={e => router.push(`/dashboard/finance?term=${e.target.value}`)}
              className="appearance-none bg-white/15 text-white pl-4 pr-9 py-2 text-sm font-semibold rounded-xl border border-white/25 cursor-pointer hover:bg-white/25 transition-colors"
            >
              {terms.map(t => <option key={t.id} value={t.id} className="text-foreground bg-background">{t.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Total Expected', value: formatKES(stats.totalExpected), sub: 'Total invoiced',
            icon: Banknote, color: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/40',
            iconColor: 'text-blue-600 dark:text-blue-400',
          },
          {
            label: 'Total Collected', value: formatKES(stats.totalCollected), sub: `${stats.collectionRate.toFixed(1)}% collection rate`,
            icon: TrendingUp, color: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
          },
          {
            label: 'Outstanding', value: formatKES(stats.totalArrears), sub: 'Fees in arrears',
            icon: AlertTriangle, color: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800/40',
            iconColor: 'text-orange-600 dark:text-orange-400',
          },
          {
            label: 'Defaulters', value: totalDefaulters.toString(), sub: criticalDefaulters > 0 ? `${criticalDefaulters} critical (60d+)` : 'No critical defaulters',
            icon: Users, color: criticalDefaulters > 0
              ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/40'
              : 'bg-slate-50 dark:bg-slate-900 border-border',
            iconColor: criticalDefaulters > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500',
          },
        ].map(card => (
          <div key={card.label} className={`border rounded-2xl p-4 ${card.color}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{card.label}</p>
              <div className={`w-8 h-8 rounded-xl bg-white/60 dark:bg-black/20 flex items-center justify-center`}>
                <card.icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
            </div>
            <p className="text-xl font-black text-foreground">{card.value}</p>
            <p className={`text-xs mt-1 font-medium ${card.iconColor}`}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Collection rate + Trend side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Collection rate by class */}
        <div className="bg-card border border-border rounded-3xl p-5 space-y-4">
          <div>
            <p className="font-bold text-foreground">Collection Rate by Class</p>
            <p className="text-xs text-muted-foreground mt-0.5">Expected vs collected per class</p>
          </div>
          {collectionByClass.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No invoice data for this term.</p>
          ) : (
            <BarChart
              data={collectionByClass.map(c => ({ label: c.name, value: c.collected, max: c.expected }))}
              color="#3b82f6"
            />
          )}
        </div>

        {/* Payment trend */}
        <div className="bg-card border border-border rounded-3xl p-5 space-y-4">
          <div>
            <p className="font-bold text-foreground">Payment Trend</p>
            <p className="text-xs text-muted-foreground mt-0.5">Weekly payment volumes (last 8 weeks)</p>
          </div>
          {paymentTrend.every(d => d.amount === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-8">No payments recorded in the last 8 weeks.</p>
          ) : (
            <SparkLine data={paymentTrend} />
          )}
        </div>
      </div>

      {/* Defaulter aging table */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <p className="font-bold text-foreground">Defaulter Aging</p>
            <p className="text-xs text-muted-foreground mt-0.5">Students with outstanding balances, grouped by overdue duration</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(agingBuckets).map(([label, list]) => (
              <span key={label} className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                label === '60+ days' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' :
                label === '31–60 days' ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300' :
                'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {label}: {list.length}
              </span>
            ))}
          </div>
        </div>

        {totalDefaulters === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">No defaulters — excellent collection rate!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50/60 dark:bg-slate-900/40">
                  <th className="px-5 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Class</th>
                  <th className="px-5 py-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Outstanding</th>
                  <th className="px-5 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">Days Overdue</th>
                  <th className="px-5 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">Bucket</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {Object.entries(agingBuckets).map(([bucket, list]) =>
                  list.sort((a, b) => b.daysOverdue - a.daysOverdue).map((d, idx) => (
                    <tr key={d.id} className={`${idx % 2 !== 0 ? 'bg-slate-50/40 dark:bg-slate-900/20' : ''} hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-colors`}>
                      <td className="px-5 py-3 font-semibold text-foreground">{d.className}</td>
                      <td className="px-5 py-3 text-right font-bold text-orange-600 dark:text-orange-400">{formatKES(d.outstanding)}</td>
                      <td className="px-5 py-3 text-center text-muted-foreground">{d.daysOverdue}d</td>
                      <td className="px-5 py-3 text-center">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          bucket === '60+ days' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' :
                          bucket === '31–60 days' ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {bucket}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent payments */}
      {recentPayments.length > 0 && (
        <div className="bg-card border border-border rounded-3xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="font-bold text-foreground">Recent Payments</p>
            <p className="text-xs text-muted-foreground mt-0.5">Last 10 payments received</p>
          </div>
          <div className="divide-y divide-border">
            {recentPayments.map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                    <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{formatKES(p.amount)}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.paid_at ? new Date(p.paid_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
