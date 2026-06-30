'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { recordPayment } from './actions'
import { CreditCard, Check, Smartphone, Building2, Banknote } from 'lucide-react'

const PAYMENT_METHODS = [
  { value: 'mpesa', label: 'M-Pesa', icon: Smartphone, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' },
  { value: 'cash', label: 'Cash', icon: Banknote, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' },
  { value: 'cheque', label: 'Cheque', icon: CreditCard, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200 dark:bg-violet-900/20 dark:border-violet-800' },
]

interface Props {
  open: boolean
  onClose: () => void
  invoice: {
    id: string
    balance: number
    studentName: string
    studentId: string
  } | null
  schoolId: string
}

const formatKES = (n: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n)

export function RecordPaymentModal({ open, onClose, invoice, schoolId }: Props) {
  const [method, setMethod] = useState('mpesa')
  const [amount, setAmount] = useState('')
  const [mpesaReceipt, setMpesaReceipt] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  function reset() {
    setMethod('mpesa')
    setAmount('')
    setMpesaReceipt('')
    setNotes('')
    setError(null)
    setDone(false)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amt = Number(amount)
    if (!amt || amt <= 0) { setError('Enter a valid amount.'); return }
    if (!invoice) return

    setLoading(true)
    setError(null)

    const res = await recordPayment({
      schoolId,
      invoiceId: invoice.id,
      studentId: invoice.studentId,
      amount: amt,
      method,
      mpesaReceipt: mpesaReceipt || undefined,
      notes: notes || undefined,
    })

    setLoading(false)

    if (res && 'error' in res) {
      setError(res.error ?? null)
    } else {
      setDone(true)
    }
  }

  if (!invoice) return null

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-emerald-600" />
            </div>
            Record Payment
          </DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8" />
            </div>
            <p className="font-bold text-lg">Payment Recorded!</p>
            <p className="text-sm text-muted-foreground">
              {formatKES(Number(amount))} payment has been applied to {invoice.studentName}'s account.
            </p>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={handleClose}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Student & balance info */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-800 space-y-1">
              <p className="text-sm font-semibold text-foreground">{invoice.studentName}</p>
              <p className="text-xs text-muted-foreground">
                Outstanding balance: <span className="text-red-500 font-bold">{formatKES(invoice.balance)}</span>
              </p>
            </div>

            {/* Payment method picker */}
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((m) => {
                  const Icon = m.icon
                  const isActive = method === m.value
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setMethod(m.value)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-sm font-medium transition-all ${
                        isActive
                          ? m.bg + ' ring-1 ring-current'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? m.color : 'text-muted-foreground'}`} />
                      <span className={isActive ? m.color : 'text-muted-foreground'}>{m.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="pay-amount">Amount (KES) *</Label>
              <Input
                id="pay-amount"
                type="number"
                placeholder={`Up to ${formatKES(invoice.balance)}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                max={invoice.balance}
              />
              <button
                type="button"
                className="text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
                onClick={() => setAmount(String(invoice.balance))}
              >
                Pay full balance ({formatKES(invoice.balance)})
              </button>
            </div>

            {/* M-Pesa receipt */}
            {method === 'mpesa' && (
              <div className="space-y-2">
                <Label htmlFor="mpesa-receipt">M-Pesa Receipt No.</Label>
                <Input
                  id="mpesa-receipt"
                  placeholder="e.g. QJK23XF89H"
                  value={mpesaReceipt}
                  onChange={(e) => setMpesaReceipt(e.target.value.toUpperCase())}
                />
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="pay-notes">Notes (optional)</Label>
              <Input
                id="pay-notes"
                placeholder="e.g. Term 1 partial payment"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg border border-red-200">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                {loading ? 'Saving…' : 'Record Payment'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
