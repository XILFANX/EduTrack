'use client'

import { useState } from 'react'
import { Search, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react'

export function LedgerClient({ transactions }: { transactions: any[] }) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTx = transactions.filter(tx => {
    const q = searchQuery.toLowerCase()
    return tx.item_name.toLowerCase().includes(q) || tx.logged_by.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transaction Ledger</h1>
          <p className="text-sm text-muted-foreground mt-1">Full history of all items checked in and out.</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by item name or logger..." 
          className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
        />
      </div>

      {filteredTx.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/40 mx-auto flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">No transactions found</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
            No stock movements match your search criteria.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-muted-foreground uppercase tracking-wider text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">Item Name</th>
                  <th className="px-6 py-4">Quantity</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Logged By</th>
                  <th className="px-6 py-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredTx.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{tx.item_name}</td>
                    <td className="px-6 py-4">
                      <div className={`font-bold ${tx.transaction_type === 'in' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {tx.transaction_type === 'in' ? '+' : '-'}{tx.quantity}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider flex items-center w-fit gap-1 ${
                        tx.transaction_type === 'in' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30'
                      }`}>
                        {tx.transaction_type === 'in' ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{tx.logged_by}</td>
                    <td className="px-6 py-4 text-right text-muted-foreground">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
