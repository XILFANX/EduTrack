"use client"

import { useState } from "react"
import { recordManualPayment } from "@/app/(dashboard)/rent/invoices/actions"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { toast } from 'sonner'

export function RecordPaymentButton({ invoiceId, balance, currency }: { invoiceId: string, balance: number, currency: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState(balance.toString())
  const [reference, setReference] = useState("")

  async function handleRecord() {
    if (loading) return
    setLoading(true)
    try {
      const res = await recordManualPayment(invoiceId, amount, reference)
      if (!res.error) {
        setIsOpen(false)
        window.location.reload() // Refresh to update the invoice list
      } else {
        alert(res.error)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
      >
        Record Payment
      </button>

      <ConfirmDialog
        open={isOpen}
        onCancel={() => !loading && setIsOpen(false)}
        onConfirm={handleRecord}
        title="Record Manual Payment"
        description="Manually record a payment that was made outside of the system."
        confirmLabel="Save Payment"
        cancelLabel="Cancel"
        variant="default"
        loading={loading}
      >
        <div className="space-y-4 mt-4 text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount ({currency})</label>
            <input 
              type="number" 
              value={amount} 
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              placeholder="e.g. 15000"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Receipt / Reference (Optional)</label>
            <input 
              type="text" 
              value={reference} 
              onChange={e => setReference(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              placeholder="e.g. Cash, Cheque No."
            />
          </div>
        </div>
      </ConfirmDialog>
    </>
  )
}
