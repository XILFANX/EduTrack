import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, TrendingUp, TrendingDown, Plus, MoreVertical } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function StoreDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileResult } = await supabase
    .from('users').select('school_id').eq('id', user.id).single()
  const profile = profileResult as any
  if (!profile?.school_id) return null

  // Fetch ledger and aggregate by item
  const { data: ledger } = await supabase
    .from('inventory_ledger')
    .select('*')
    .eq('school_id', profile.school_id)
    .order('created_at', { ascending: false })

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
        <Button className="bg-amber-600 hover:bg-amber-700 gap-2">
          <Plus className="w-4 h-4" />
          Log Stock
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-slate-200 dark:border-slate-800 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalItems}</p>
              <p className="text-xs text-muted-foreground font-medium">Item Types</p>
            </div>
          </CardContent>
        </Card>
        <Card className={`border-slate-200 dark:border-slate-800 ${lowStock > 0 ? 'bg-red-50 dark:bg-red-950/20' : ''}`}>
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${lowStock > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-2xl font-bold ${lowStock > 0 ? 'text-red-600' : 'text-foreground'}`}>{lowStock}</p>
              <p className="text-xs text-muted-foreground font-medium">Low Stock</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Current Stock</h2>
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
                  <th className="px-6 py-4 text-right"></th>
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
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-foreground">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
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
