'use client'

import Link from 'next/link'
import {
  Package, ArrowDownToLine, ArrowUpFromLine, AlertTriangle,
  ChevronRight, Plus, Boxes
} from 'lucide-react'

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })

export function StoreDashboardClient({
  recentTransactions, currentStock, schoolId, userId
}: {
  recentTransactions: any[]
  currentStock: { name: string; qty: number }[]
  schoolId: string
  userId: string
}) {
  const totalIn = recentTransactions.filter(t => t.transaction_type === 'in').reduce((s, t) => s + t.quantity, 0)
  const totalOut = recentTransactions.filter(t => t.transaction_type === 'out').reduce((s, t) => s + t.quantity, 0)
  const lowStockItems = currentStock.filter(s => s.qty <= 5 && s.qty >= 0)
  const outOfStockItems = currentStock.filter(s => s.qty <= 0)

  return (
    <div className="space-y-6 pb-24">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-amber-600 via-orange-600 to-amber-900 rounded-3xl p-6 overflow-hidden text-white shadow-xl">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-orange-400/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-amber-300/10 blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Store Inventory</h1>
              <p className="text-amber-200 text-sm">Track school supplies and disbursements</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Stock Items', value: currentStock.length },
              { label: 'Low Stock', value: lowStockItems.length },
              { label: 'Out of Stock', value: outOfStockItems.length },
              { label: 'Recent Out', value: totalOut },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl px-3 py-3 text-center">
                <p className="text-2xl font-extrabold text-white">{s.value}</p>
                <p className="text-[10px] text-amber-200 font-semibold uppercase tracking-wide mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Log Stock In', href: '/store/ledger', icon: ArrowDownToLine, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-800/30' },
          { label: 'Disburse Items', href: '/store/ledger', icon: ArrowUpFromLine, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-100 dark:border-orange-800/30' },
          { label: 'View All Stock', href: '/store/stock', icon: Boxes, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-100 dark:border-amber-800/30' },
          { label: 'New Item', href: '/store/stock', icon: Plus, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-100 dark:border-blue-800/30' },
        ].map((a, i) => {
          const Icon = a.icon
          return (
            <Link key={i} href={a.href}
              className={`flex flex-col items-center gap-2 p-4 ${a.bg} border ${a.border} rounded-2xl hover:scale-[1.02] transition-all text-center`}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-slate-900 shadow-sm">
                <Icon className={`w-5 h-5 ${a.color}`} />
              </div>
              <span className="text-xs font-semibold text-foreground">{a.label}</span>
            </Link>
          )
        })}
      </div>

      {/* Low stock warnings */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-amber-800 dark:text-amber-400 text-sm">Low Stock Alerts ({lowStockItems.length})</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map((item, i) => (
              <div key={i} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                item.qty <= 0
                  ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30'
                  : 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800/30'
              }`}>
                <span>{item.name}</span>
                <span className="font-extrabold">{item.qty <= 0 ? 'OUT' : `×${item.qty}`}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Split ledger */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Check-ins */}
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <h2 className="font-bold text-foreground text-sm">Recent Check-Ins</h2>
          </div>
          {recentTransactions.filter(t => t.transaction_type === 'in').length === 0 ? (
            <div className="text-center py-8">
              <ArrowDownToLine className="w-6 h-6 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No check-ins recorded.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentTransactions.filter(t => t.transaction_type === 'in').slice(0, 5).map((tx: any, i: number) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/60 dark:hover:bg-slate-900/20 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                    <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{tx.item_name}</p>
                    <p className="text-xs text-muted-foreground">{fmtDate(tx.created_at)} · By {tx.logged_by}</p>
                  </div>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">+{tx.quantity}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Check-outs */}
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-400" />
            <h2 className="font-bold text-foreground text-sm">Recent Disbursements</h2>
          </div>
          {recentTransactions.filter(t => t.transaction_type === 'out').length === 0 ? (
            <div className="text-center py-8">
              <ArrowUpFromLine className="w-6 h-6 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No disbursements recorded.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentTransactions.filter(t => t.transaction_type === 'out').slice(0, 5).map((tx: any, i: number) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/60 dark:hover:bg-slate-900/20 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center shrink-0">
                    <ArrowUpFromLine className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{tx.item_name}</p>
                    <p className="text-xs text-muted-foreground">{fmtDate(tx.created_at)} · {tx.notes || 'No notes'}</p>
                  </div>
                  <span className="text-orange-600 dark:text-orange-400 font-bold text-sm">-{tx.quantity}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Current Stock Levels */}
      {currentStock.length > 0 && (
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-bold text-foreground">Current Stock Levels</h2>
            <Link href="/store/stock" className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {currentStock.slice(0, 9).map((item, i) => {
              const isLow = item.qty <= 5
              const isOut = item.qty <= 0
              return (
                <div key={i} className={`rounded-xl px-3 py-2.5 border ${
                  isOut ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30'
                        : isLow ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30'
                        : 'bg-slate-50 dark:bg-slate-900/30 border-border'
                }`}>
                  <p className={`text-lg font-extrabold ${isOut ? 'text-red-600 dark:text-red-400' : isLow ? 'text-amber-700 dark:text-amber-400' : 'text-foreground'}`}>{item.qty}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{item.name}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
