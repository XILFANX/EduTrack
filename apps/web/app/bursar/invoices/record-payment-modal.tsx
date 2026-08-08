'use client'

/**
 * EduTrack — Bursar: Verify Payment Modal (Blind Payee Submission)
 *
 * Replaces the old RecordPaymentModal which let bursars record payments
 * on parents' behalf (single-sided, claim-and-confirm).
 *
 * NEW MODEL: Bursar pastes what the school RECEIVED — no student lookup,
 * no obligation pre-fill, no payer info ever shown.
 */

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { submitPayeeVerification, submitBatchPayeeVerification } from '@/app/actions/payments/verify-payment'
import { ShieldCheck, EyeOff, CheckCircle2, Loader2, Plus, Trash2, AlertTriangle } from 'lucide-react'
import type { PaymentRail } from '@edutrack/shared/payments/types'
import { parseTransactionMessage } from '@/lib/utils/payment-parser'

const RAILS: { value: PaymentRail; label: string }[] = [
  { value: 'mobile_money', label: '📱 Mobile Money' },
  { value: 'bank_transfer', label: '🏦 Bank Transfer' },
  { value: 'cash', label: '💵 Cash' },
  { value: 'cheque', label: '📋 Cheque' },
]

interface SubmissionRow {
  id: string
  rawMessage: string
  referenceCode: string
  parsedAmount: string
  parsedCurrency: string
  parsedTransactionAt: string
  paymentRail: PaymentRail
}

function makeRow(): SubmissionRow {
  return {
    id: Math.random().toString(36).slice(2),
    rawMessage: '',
    referenceCode: '',
    parsedAmount: '',
    parsedCurrency: 'KES',
    parsedTransactionAt: '',
    paymentRail: 'mobile_money',
  }
}

interface Props {
  open: boolean
  onClose: () => void
}

export function VerifyPaymentModal({ open, onClose }: Props) {
  const [rows, setRows] = useState<SubmissionRow[]>([makeRow()])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ submitted: number; matched: number; errors: string[] } | null>(null)

  function reset() {
    setRows([makeRow()])
    setResult(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  function updateRow(id: string, patch: Partial<SubmissionRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  function addRow() {
    setRows((prev) => [...prev, makeRow()])
  }

  function removeRow(id: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev))
  }

  function parseMessage(raw: string, rowId: string) {
    const parsed = parseTransactionMessage(raw)
    const patch: Partial<SubmissionRow> = { rawMessage: raw }
    if (parsed.referenceCode) patch.referenceCode = parsed.referenceCode
    if (parsed.parsedAmount) patch.parsedAmount = parsed.parsedAmount.toString()
    if (parsed.parsedTransactionAt) patch.parsedTransactionAt = parsed.parsedTransactionAt
    if (parsed.paymentRail && parsed.paymentRail !== 'other') patch.paymentRail = parsed.paymentRail
    if (parsed.parsedCurrency) patch.parsedCurrency = parsed.parsedCurrency
    updateRow(rowId, patch)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const inputs = rows
      .filter((r) => r.referenceCode.trim() || r.rawMessage.trim())
      .map((r) => ({
        rawMessage: r.rawMessage || null,
        referenceCode: r.referenceCode,
        parsedAmount: parseFloat(r.parsedAmount) || 0,
        parsedCurrency: r.parsedCurrency,
        parsedTransactionAt: r.parsedTransactionAt || null,
        paymentRail: r.paymentRail,
      }))

    const res = inputs.length === 1
      ? await submitPayeeVerification(inputs[0]).then((r) => ({
          submitted: r.success ? 1 : 0,
          matched: r.matched ? 1 : 0,
          errors: r.error ? [r.error] : [],
        }))
      : await submitBatchPayeeVerification(inputs)

    setLoading(false)
    setResult(res)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
            </div>
            Verify Payment Received
          </DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="p-6 text-center space-y-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${result.matched > 0 ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
              <CheckCircle2 className={`w-8 h-8 ${result.matched > 0 ? 'text-blue-600' : 'text-red-600'}`} />
            </div>
            <p className="font-bold text-lg text-foreground">
              {result.submitted} submitted · {result.matched} matched
            </p>
            <p className="text-sm text-muted-foreground">
              {result.matched === result.submitted
                ? 'All verified — ledger updated.'
                : 'Unmatched entries will auto-match when parents submit their side.'}
            </p>
            {result.errors.map((e, i) => (
              <p key={i} className="text-sm text-red-600 bg-orange-50 dark:bg-orange-950/30 px-3 py-2 rounded-lg">{e}</p>
            ))}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={reset}>Verify more</Button>
              <Button className="flex-1 bg-[#1D6FEB] hover:bg-[#1558C8]" onClick={handleClose}>Done</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Blindness notice */}
            <div className="flex gap-2 items-start bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
              <EyeOff className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>Blind verification:</strong> Paste what the school received. Do not search for students or invoices — the system matches independently.
              </p>
            </div>

            {rows.map((row, idx) => (
              <div key={row.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3 relative">
                {rows.length > 1 && (
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Entry {idx + 1}</span>
                    <button type="button" onClick={() => removeRow(row.id)} className="text-muted-foreground hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* SMS paste */}
                <div className="space-y-1.5">
                  <Label htmlFor={`raw-${row.id}`} className="text-xs">Transaction Message</Label>
                  <textarea
                    id={`raw-${row.id}`}
                    rows={2}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-mono"
                    placeholder="Paste M-Pesa or bank notification here…"
                    value={row.rawMessage}
                    onChange={(e) => parseMessage(e.target.value, row.id)}
                  />
                  {row.referenceCode && (
                    <p className="text-[11px] text-red-600">
                      ✓ Code: <span className="font-mono font-bold">{row.referenceCode}</span> · Amount: <strong>{row.parsedAmount}</strong>
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor={`ref-${row.id}`} className="text-xs">Reference Code *</Label>
                    <Input
                      id={`ref-${row.id}`}
                      className="font-mono uppercase text-sm h-9"
                      placeholder="QJK23XF89H"
                      value={row.referenceCode}
                      onChange={(e) => updateRow(row.id, { referenceCode: e.target.value.toUpperCase().trim() })}
                      required={row.paymentRail !== 'cash' && row.paymentRail !== 'cheque'}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`amt-${row.id}`} className="text-xs">Amount Received *</Label>
                    <Input
                      id={`amt-${row.id}`}
                      type="number"
                      className="text-sm h-9"
                      placeholder="15000"
                      value={row.parsedAmount}
                      onChange={(e) => updateRow(row.id, { parsedAmount: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Rail selector */}
                <div className="flex flex-wrap gap-1.5">
                  {RAILS.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => updateRow(row.id, { paymentRail: r.value })}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                        row.paymentRail === r.value
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'border-slate-200 dark:border-slate-700 text-muted-foreground'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>

                {(row.paymentRail === 'cash' || row.paymentRail === 'cheque') && (
                  <div className="flex gap-1.5 items-start bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2">
                    <AlertTriangle className="w-3 h-3 text-red-600 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-red-700 dark:text-red-400">
                      Cash/cheque will not auto-match. It goes to your Pending Cash list.
                    </p>
                  </div>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addRow}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-xs text-muted-foreground hover:border-cyan-400 hover:text-blue-600 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add another
            </button>

            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-[#1D6FEB] hover:bg-[#1558C8]" disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting…</> : <><ShieldCheck className="w-4 h-4 mr-2" />Verify{rows.length > 1 ? ` (${rows.length})` : ''}</>}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
