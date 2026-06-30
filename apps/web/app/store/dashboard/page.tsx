import { createClient } from '@/lib/supabase/server'
import { TrendingDown, Package } from 'lucide-react'
import { redirect } from 'next/navigation'
import { LogStockButton } from '../log-stock-button'

export default async function StoreDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileResult } = await supabase
    .from('users').select('school_id, id').eq('id', user.id).single()
  const profile = profileResult as any
  if (!profile?.school_id) return null

  const { data: ledger } = await supabase
    .from('inventory_ledger')
    .select('item_name, quantity_change')
    .eq('school_id', profile.school_id)

  // Aggregate current stock per item
  const stockMap: Record<string, { name: string; quantity: number }> = {}
  for (const entryRaw of ledger || []) {
    const entry = entryRaw as any
    if (!stockMap[entry.item_name]) {
      stockMap[entry.item_name] = { name: entry.item_name, quantity: 0 }
    }
    stockMap[entry.item_name].quantity += Number(entry.quantity_change)
  }
  const items = Object.values(stockMap)
  const totalItems = items.length
  const lowStock = items.filter(i => i.quantity <= 5).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Store</h1>
          <p className="text-sm text-muted-foreground mt-1">Track inventory and stock levels.</p>
        </div>
        <LogStockButton schoolId={profile.school_id} userId={profile.id} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-amber-700 dark:text-amber-400">{totalItems}</p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Item Types</p>
        </div>
        <div className={`${lowStock > 0 ? 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'} border rounded-2xl p-4 text-center`}>
          <p className={`text-3xl font-bold ${lowStock > 0 ? 'text-red-600' : 'text-foreground'}`}>{lowStock}</p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Low Stock</p>
        </div>
      </div>

      {/* Inventory list */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Current Stock</h2>
        {items.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/40 mx-auto flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">No inventory logged</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
              Use "Log Stock" to record your first inventory entry.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-muted-foreground uppercase tracking-wider text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">Item</th>
                  <th className="px-6 py-4 text-right">Qty</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {items.map((item) => (
                  <tr key={item.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{item.name}</td>
                    <td className="px-6 py-4 text-right font-bold text-foreground">{item.quantity}</td>
                    <td className="px-6 py-4 text-right">
                      {item.quantity <= 5 ? (
                        <span className="px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium">Low</span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
