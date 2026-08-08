'use client'

import { useState } from 'react'
import { Search, Receipt, Plus, Download, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function InvoicesClient({ invoices }: { invoices: any[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const formatter = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' })

  const filteredInvoices = invoices.filter(inv => {
    const q = searchQuery.toLowerCase()
    const st = inv.students
    if (!st) return false
    return (
      st.first_name.toLowerCase().includes(q) ||
      st.last_name.toLowerCase().includes(q) ||
      st.admission_number.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invoices & Billing</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage termly fee invoices for all students.</p>
        </div>
        <Button className="bg-[#1D6FEB] hover:bg-[#1558C8] gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Generate Invoices</span>
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by student name or admission number..." 
          className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-[#1a2744] bg-white dark:bg-[#060d1a] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
        />
      </div>

      {filteredInvoices.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#060d1a] border border-slate-200 dark:border-[#1a2744] rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/40 mx-auto flex items-center justify-center mb-4">
            <Receipt className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">No invoices found</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
            Click Generate Invoices to automatically bill all active students for this term.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#060d1a] border border-slate-200 dark:border-[#1a2744] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-[#060d1a] border-b border-slate-200 dark:border-[#1a2744] text-muted-foreground uppercase tracking-wider text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Total Billed</th>
                  <th className="px-6 py-4">Paid</th>
                  <th className="px-6 py-4">Balance</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredInvoices.map((inv) => {
                  const balance = inv.amount_due - inv.amount_paid
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-[#0d1b2e]/20 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">{inv.students?.first_name} {inv.students?.last_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{inv.students?.admission_number}</p>
                      </td>
                      <td className="px-6 py-4 font-medium">{formatter.format(inv.amount_due)}</td>
                      <td className="px-6 py-4 text-blue-600 dark:text-blue-400 font-medium">{formatter.format(inv.amount_paid)}</td>
                      <td className="px-6 py-4 font-bold text-red-600 dark:text-red-400">{formatter.format(balance)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${
                          inv.status === 'paid' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          inv.status === 'partial' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-600">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-600">
                            <Printer className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
