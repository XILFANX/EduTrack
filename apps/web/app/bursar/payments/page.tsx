'use client'

/**
 * EduTrack — Bursar: Verify Payment (Blind Payee Submission)
 *
 * Replaces the old RecordPaymentModal which let bursars enter
 * payments on parents' behalf (claim-and-confirm model).
 *
 * NEW MODEL:
 *   - Bursar pastes what they RECEIVED (SMS/bank alert)
 *   - Never shown any pending payer claims — blindness enforced
 *   - Engine matches automatically; result shown without payer identity
 *   - Cash/cheque: shown in a separate "Pending Cash" list to confirm
 */

import { useState } from 'react'
import { submitPayeeVerification, submitBatchPayeeVerification } from '@/app/actions/payments/verify-payment'
import { CheckCircle2, Loader2, ShieldCheck, AlertCircle, Plus, Trash2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import type { PaymentRail } from '@edutrack/shared/payments/types'
import { parseTransactionMessage } from '@/lib/utils/payment-parser'

const RAILS: { value: PaymentRail; label: string; placeholder: string }[] = [
  { value: 'mobile_money', label: '📱 Mobile Money', placeholder: 'e.g. QJK23XF89H' },
  { value: 'mpesa_paybill', label: '📱 M-Pesa Paybill', placeholder: 'e.g. QJK23XF89H' },
  { value: 'mpesa_till', label: '📱 M-Pesa Buy Goods', placeholder: 'e.g. QJK23XF89H' },
  { value: 'bank_transfer', label: '🏦 Bank Transfer', placeholder: 'e.g. REF2026001234' },
  { value: 'cash', label: '💵 Cash', placeholder: '' },
  { value: 'cheque', label: '📋 Cheque', placeholder: '' },
]

interface SubmissionRow {
  id: string
  rawMessage: string
  referenceCode: string
  parsedAmount: string
  parsedFee: string
  parsedCurrency: string
  parsedTransactionAt: string
  paymentRail: PaymentRail
  parsedCounterparty: string
  parsedSelfIdentity: string
  detectedProvider: string
}

function makeRow(): SubmissionRow {
  return {
    id: Math.random().toString(36).slice(2),
    rawMessage: '',
    referenceCode: '',
    parsedAmount: '',
    parsedFee: '',
    parsedCurrency: 'KES',
    parsedTransactionAt: '',
    paymentRail: 'mobile_money',
    parsedCounterparty: '',
    parsedSelfIdentity: '',
    detectedProvider: '',
  }
}

export default function VerifyPaymentPage() {
  const [rows, setRows] = useState<SubmissionRow[]>([makeRow()])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ submitted: number; matched: number; errors: string[] } | null>(null)
  const [showRaw, setShowRaw] = useState<Record<string, boolean>>({})

  function updateRow(id: string, patch: Partial<SubmissionRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  function addRow() {
    setRows((prev) => [...prev, makeRow()])
  }

  function removeRow(id: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev))
  }

  // Auto-parse SMS using shared parser (§7.0)
  function parseMessage(raw: string, rowId: string) {
    setRows(current => current.map(row => {
      if (row.id !== rowId) return row
      const parsed = parseTransactionMessage(raw)
      return {
        ...row,
        rawMessage: raw,
        referenceCode: parsed.referenceCode || row.referenceCode,
        parsedAmount: parsed.parsedAmount ? parsed.parsedAmount.toString() : row.parsedAmount,
        parsedFee: parsed.parsedFee ? parsed.parsedFee.toString() : row.parsedFee,
        parsedTransactionAt: parsed.parsedTransactionAt || row.parsedTransactionAt,
        paymentRail: parsed.paymentRail !== 'other' ? parsed.paymentRail : row.paymentRail,
        parsedCounterparty: parsed.parsedCounterparty || '',
        parsedSelfIdentity: parsed.parsedSelfIdentity || '',
        detectedProvider: parsed.detectedProvider || '',
      }
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    const inputs = rows
      .filter((r) => r.referenceCode.trim() || r.rawMessage.trim())
      .map((r) => ({
        rawMessage: r.rawMessage || null,
        referenceCode: r.referenceCode,
        parsedAmount: parseFloat(r.parsedAmount) || 0,
        parsedFee: r.parsedFee ? parseFloat(r.parsedFee) : null,
        parsedCurrency: r.parsedCurrency,
        parsedTransactionAt: r.parsedTransactionAt || null,
        paymentRail: r.paymentRail,
      }))

    const res = rows.length === 1
      ? await submitPayeeVerification(inputs[0])
        .then((r) => ({
          submitted: r.success ? 1 : 0,
          matched: r.matched ? 1 : 0,
          errors: r.error ? [r.error] : [],
        }))
      : await submitBatchPayeeVerification(inputs)

    setLoading(false)
    setResult(res)
  }

  if (result) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${result.matched > 0 ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
          <CheckCircle2 className={`w-10 h-10 ${result.matched > 0 ? 'text-orange-600' : 'text-orange-600'}`} />
        </div>
        <h2 className="text-xl font-bold text-foreground">
          {result.submitted} submitted · {result.matched} auto-matched
        </h2>
        <p className="text-sm text-muted-foreground">
          {result.matched === result.submitted
            ? 'All verified payments matched and posted to the ledger.'
            : result.matched > 0
            ? 'Some payments matched. Unmatched ones are in the pool awaiting payer submissions.'
            : 'Submissions recorded. They will auto-match when parents post their side.'}
        </p>
        {result.errors.length > 0 && (
          <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 rounded-xl p-3 text-left space-y-1">
            {result.errors.map((e, i) => (
              <p key={i} className="text-sm text-orange-600">{e}</p>
            ))}
          </div>
        )}
        <div className="flex gap-3 justify-center pt-2">
          <Button variant="outline" onClick={() => { setResult(null); setRows([makeRow()]) }}>
            Submit more
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => window.location.href = '/bursar/ledger'}>
            View Ledger
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl font-bold text-foreground">Verify Payment</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Paste what you received from your bank or M-Pesa. Do not look up students/parents — just paste the message.
        </p>
        {/* Blindness notice */}
        <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 flex gap-3 items-start">
          <EyeOff className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>Blind verification:</strong> You will not see any parent claims or notifications. Just submit what you received — the system matches independently.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {rows.map((row, idx) => (
          <div key={row.id} className="bg-card border border-border rounded-2xl p-4 space-y-4 relative">
            {rows.length > 1 && (
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Entry {idx + 1}</span>
                <button type="button" onClick={() => removeRow(row.id)} className="text-muted-foreground hover:text-orange-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Raw message paste area */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor={`raw-${row.id}`}>Transaction Message (paste SMS or app notification)</Label>
                <button
                  type="button"
                  onClick={() => setShowRaw((s) => ({ ...s, [row.id]: !s[row.id] }))}
                  className="text-xs text-muted-foreground flex items-center gap-1"
                >
                  {showRaw[row.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {showRaw[row.id] ? 'Hide' : 'Show'}
                </button>
              </div>
              <textarea
                id={`raw-${row.id}`}
                rows={3}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-mono"
                placeholder="e.g. QJK23XF89H Confirmed. Ksh 15,000.00 received from 0712 345 678 on 1/8/26 at 10:30 AM."
                value={showRaw[row.id] ? row.rawMessage : row.rawMessage ? '● '.repeat(6) + ' (hidden)' : ''}
                onChange={(e) => parseMessage(e.target.value, row.id)}
                onFocus={() => setShowRaw((s) => ({ ...s, [row.id]: true }))}
              />
              {row.rawMessage && (
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  Auto-parsed: code <span className="font-mono font-bold">{row.referenceCode || '—'}</span> · amount <strong>{row.parsedAmount || '—'}</strong>
                </p>
              )}
            </div>

            {/* Manual entry (if paste didn't parse) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor={`ref-${row.id}`}>Reference Code *</Label>
                <Input
                  id={`ref-${row.id}`}
                  className="font-mono uppercase"
                  placeholder="QJK23XF89H"
                  value={row.referenceCode}
                  onChange={(e) => updateRow(row.id, { referenceCode: e.target.value.toUpperCase().trim() })}
                  required={row.paymentRail !== 'cash' && row.paymentRail !== 'cheque'}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`amount-${row.id}`}>Amount Received (KES) *</Label>
                <Input
                  id={`amount-${row.id}`}
                  type="number"
                  placeholder="15000"
                  value={row.parsedAmount}
                  onChange={(e) => updateRow(row.id, { parsedAmount: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Rail selector */}
            <div className="space-y-1.5">
              <Label>Payment Channel</Label>
              <div className="flex flex-wrap gap-2">
                {RAILS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => updateRow(row.id, { paymentRail: r.value })}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      row.paymentRail === r.value
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'border-border text-muted-foreground hover:border-blue-300'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              {(row.paymentRail === 'cash' || row.paymentRail === 'cheque') && (
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  ⚠ Cash/cheque entries will not auto-match. They go to your Pending Cash list for you to confirm.
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Add another */}
        <button
          type="button"
          onClick={addRow}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:border-blue-400 hover:text-blue-600 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add another transaction
        </button>

        <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold">
          {loading ? (
            <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</span>
          ) : (
            <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Submit Verification{rows.length > 1 ? `s (${rows.length})` : ''}</span>
          )}
        </Button>
      </form>
    </div>
  )
}
