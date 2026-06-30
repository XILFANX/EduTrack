'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react'
import { logStock } from './actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Props {
  schoolId: string
  userId: string
  onClose: () => void
}

export function LogStockModal({ schoolId, userId, onClose }: Props) {
  const router = useRouter()
  const [type, setType] = useState<'in' | 'out'>('in')
  const [itemName, setItemName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const qty = parseInt(quantity)
    if (!itemName.trim() || isNaN(qty) || qty <= 0) {
      setError('Please fill in item name and a valid quantity.')
      return
    }

    setLoading(true)
    const res = await logStock({
      schoolId,
      userId,
      itemName: itemName.trim(),
      quantityChange: type === 'in' ? qty : -qty,
      notes,
    })
    setLoading(false)

    if (res.error) {
      setError(res.error)
    } else {
      toast.success(`Stock ${type === 'in' ? 'received' : 'issued'} successfully`)
      router.refresh()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-foreground">Log Stock</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Stock In / Out toggle */}
          <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 p-1 gap-1">
            <button
              type="button"
              onClick={() => setType('in')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                type === 'in' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-foreground'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Stock In
            </button>
            <button
              type="button"
              onClick={() => setType('out')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                type === 'out' ? 'bg-red-500 text-white' : 'text-slate-500 hover:text-foreground'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              Stock Out
            </button>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Item Name</label>
            <input
              type="text"
              value={itemName}
              onChange={e => setItemName(e.target.value)}
              placeholder="e.g. Maize Flour, Pencils"
              className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Quantity</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              placeholder="0"
              className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Received from supplier, Issued to kitchen"
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            type="submit"
            disabled={loading}
            className={`w-full gap-2 ${type === 'in' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-500 hover:bg-red-600'}`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {type === 'in' ? 'Confirm Stock In' : 'Confirm Stock Out'}
          </Button>
        </form>
      </div>
    </div>
  )
}
