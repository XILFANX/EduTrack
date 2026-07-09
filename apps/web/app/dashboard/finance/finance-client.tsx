'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Banknote, TrendingUp, ArrowDownToLine, ReceiptText } from 'lucide-react'

interface FinanceClientProps {
  stats: {
    totalExpected: number
    totalCollected: number
    totalArrears: number
  }
  payments: any[]
}

function formatKES(n: number) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n)
}

export function FinanceClient({ stats, payments }: FinanceClientProps) {
  const collectionRate = stats.totalExpected > 0 ? Math.round((stats.totalCollected / stats.totalExpected) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Finance Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">High-level view of school fee collections and cash flow.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Collected</p>
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{formatKES(stats.totalCollected)}</p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2 font-medium">{collectionRate}% of expected</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Expected</p>
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Banknote className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{formatKES(stats.totalExpected)}</p>
            <p className="text-sm text-muted-foreground mt-2">Total billed this term</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Arrears</p>
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <ArrowDownToLine className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{formatKES(stats.totalArrears)}</p>
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-2 font-medium">Pending collection</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <ReceiptText className="w-5 h-5 text-slate-500" />
          Recent M-Pesa Ledger
        </h2>
        
        {payments.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <p className="text-muted-foreground">No recent payments recorded.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-muted-foreground uppercase tracking-wider text-xs font-semibold">
                  <tr>
                    <th className="px-6 py-4">Receipt</th>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Method</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {payments.map((p) => {
                    const studentName = Array.isArray(p.students) ? p.students[0]?.first_name + ' ' + p.students[0]?.last_name : (p.students as any)?.first_name + ' ' + (p.students as any)?.last_name
                    
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-400">{p.mpesa_receipt || 'N/A'}</td>
                        <td className="px-6 py-4 font-medium text-foreground">{studentName}</td>
                        <td className="px-6 py-4 font-semibold text-emerald-600 dark:text-emerald-400">{formatKES(p.amount)}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium">
                            {p.payment_method}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {new Date(p.payment_date).toLocaleDateString()}
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
    </div>
  )
}
