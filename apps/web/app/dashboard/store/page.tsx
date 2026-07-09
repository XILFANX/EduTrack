import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Package, TrendingDown, ArrowRightLeft, Plus } from 'lucide-react'
import Link from 'next/link'

export default async function StoreOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('school_id').eq('id', user.id).single()
  if (!profile?.school_id) return null

  // Fetch inventory items
  const { data: itemsRaw } = await supabase
    .from('store_items')
    .select('id, name, category, quantity_on_hand, reorder_level, unit')
    .eq('school_id', profile.school_id)
    .is('deleted_at', null)
    .order('name')
    .limit(20)

  // Fetch recent transactions (issues/restocks)
  const { data: txRaw } = await supabase
    .from('store_transactions')
    .select('id, type, quantity, notes, created_at, store_items(name)')
    .eq('school_id', profile.school_id)
    .order('created_at', { ascending: false })
    .limit(10)

  const items = (itemsRaw as any[]) || []
  const transactions = (txRaw as any[]) || []
  const totalItems = items.length
  const lowStockItems = items.filter((i: any) => i.quantity_on_hand <= (i.reorder_level ?? 5)).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Store & Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">School supplies and stock management.</p>
        </div>
        <Link
          href="/store/dashboard"
          className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          Full Portal →
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Items', value: totalItems, icon: Package, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
          { label: 'Low Stock', value: lowStockItems, icon: TrendingDown, color: lowStockItems > 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' },
          { label: 'Transactions', value: transactions?.length ?? 0, icon: ArrowRightLeft, color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          )
        })}
      </div>

      {/* Inventory Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold text-foreground flex items-center gap-2"><Package className="w-4 h-4 text-slate-500" /> Inventory</h2>
          <Link href="/store/inventory" className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Item
          </Link>
        </div>
        {!items || items.length === 0 ? (
          <div className="p-10 text-center">
            <Package className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500">No inventory items catalogued yet.</p>
            <p className="text-xs text-slate-400 mt-1">Head to the Store portal to add stock items.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3">Item</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">In Stock</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {items.map(item => {
                  const isLow = item.quantity_on_hand <= (item.reorder_level ?? 5)
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-3 font-medium text-foreground">{item.name}</td>
                      <td className="px-6 py-3 text-muted-foreground">{item.category || '—'}</td>
                      <td className="px-6 py-3 font-semibold text-foreground">
                        {item.quantity_on_hand} {item.unit || 'units'}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${isLow ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                          {isLow ? 'Low Stock' : 'Adequate'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-semibold text-foreground flex items-center gap-2"><ArrowRightLeft className="w-4 h-4 text-slate-500" /> Recent Transactions</h2>
        </div>
        {!transactions || transactions.length === 0 ? (
          <div className="p-10 text-center">
            <ArrowRightLeft className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500">No transactions recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Item</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {transactions.map(t => {
                  const storeItem = t.store_items as any
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-3 text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-3 font-medium text-foreground">{storeItem?.name || '—'}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${t.type === 'restock' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                          {t.type === 'restock' ? '▲ Restock' : '▼ Issue'}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-semibold text-foreground">{t.quantity}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
