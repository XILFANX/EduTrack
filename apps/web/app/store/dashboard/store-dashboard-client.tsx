'use client'

import { Package, TrendingDown, ArrowDownRight, ArrowUpRight, FileText } from 'lucide-react'

export function StoreDashboardClient({ recentTransactions, currentStock }: { recentTransactions: any[], currentStock: any[] }) {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-[40px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black">Inventory Dashboard</h1>
            <p className="text-sm text-blue-100">Monitor kitchen and stationery supplies</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Active Stock */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-amber-500" />
              Current Stock Levels
            </h2>
            
            {currentStock.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No inventory items tracked yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {currentStock.map((item, i) => (
                  <div key={i} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{item.name}</p>
                    <p className={`text-2xl font-bold ${item.qty < 10 ? 'text-red-600' : 'text-foreground'}`}>
                      {item.qty}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Low Stock Warning */}
          {currentStock.some(i => i.qty < 10) && (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-3xl p-5 flex items-start gap-3">
              <TrendingDown className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-red-800 dark:text-red-400">Low Stock Alert</h3>
                <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1">
                  Some items have fallen below the safe threshold of 10 units. Please review inventory and re-order.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Ledger Feed */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col h-[500px]">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-500" />
            Recent Ledger
          </h2>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent transactions.</p>
            ) : (
              recentTransactions.map(tx => (
                <div key={tx.id} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    tx.transaction_type === 'in' 
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' 
                      : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30'
                  }`}>
                    {tx.transaction_type === 'in' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{tx.item_name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                  <div className={`text-sm font-bold ${tx.transaction_type === 'in' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {tx.transaction_type === 'in' ? '+' : '-'}{tx.quantity}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
