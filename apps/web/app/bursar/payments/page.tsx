'use client'

/**
 * EduTrack — Verify Fees Payment (Blind Payee Submission)
 *
 * Context-aware via title prop:
 *   - Bursar: "Verify Fees Payment"
 *   - Platform Admin: "Verify Subscription Payment"
 *
 * Submit phases: Submit → Verifying... → Payment Verified → Recording... → done
 * Transaction Details card shown after auto-parse.
 */

import { useState } from 'react'
import { submitPayeeVerification, submitBatchPayeeVerification } from '@/app/actions/payments/verify-payment'
import { CheckCircle2, Loader2, ShieldCheck, AlertCircle, Plus, Trash2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import type { PaymentRail } from '@edutrack/shared/payments/types'
import { parseTransactionMessage } from '@/lib/utils/payment-parser'

const RAILS: { value: PaymentRail; label: string }[] = [
  { value: 'mobile_money', label: '📱 Mobile Money' },
  { value: 'bank_transfer', label: '🏦 Bank Transfer' },
  { value: 'crypto', label: '₿ Crypto' },
  { value: 'cash', label: '💵 Cash' },
  { value: 'cheque', label: '📋 Cheque' },
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
    parsedCounterparty: '',
    parsedSelfIdentity: '',
    detectedProvider: '',
    paymentRail: 'mobile_money',
  }
}

type SubmitPhase = 'idle' | 'verifying' | 'verified' | 'recording' | 'done'

interface Props {
  title?: string
  ledgerHref?: string
}

export default function VerifyPaymentPage({ title = 'Verify Fees Payment', ledgerHref = '/bursar/ledger' }: Props) {
  const [rows, setRows] = useState<SubmissionRow[]>([makeRow()])
  const [phase, setPhase] = useState<SubmitPhase>('idle')
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
    setResult(null)
    setPhase('verifying')

    const inputs = rows
      .filter((r) => r.referenceCode.trim() || r.rawMessage.trim())
      .map((r) => ({
        rawMessage: r.rawMessage || null,
        referenceCode: r.referenceCode,
        parsedAmount: parseFloat(r.parsedAmount) || 0,
        parsedFee: r.parsedFee ? parseFloat(r.parsedFee) : null,
        parsedCurrency: r.parsedCurrency,
        parsedTransactionAt: r.parsedTransactionAt || null,
        parsedCounterparty: r.parsedCounterparty || null,
        parsedSelfIdentity: r.parsedSelfIdentity || null,
        paymentRail: r.paymentRail,
      }))

    await new Promise(r => setTimeout(r, 700))
    setPhase('verified')
    await new Promise(r => setTimeout(r, 800))
    setPhase('recording')

    const res = rows.length === 1
      ? await submitPayeeVerification(inputs[0])
          .then((r) => ({
            submitted: r.success ? 1 : 0,
            matched: r.matched ? 1 : 0,
            errors: r.error ? [r.error] : [],
          }))
      : await submitBatchPayeeVerification(inputs)

    setPhase('done')
    setResult(res)
  }

  if (phase === 'done' && result) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${result.errors.length > 0 ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
          {result.errors.length > 0
            ? <AlertCircle className="w-10 h-10 text-orange-500" />
            : <CheckCircle2 className="w-10 h-10 text-blue-600" />}
        </div>
        <h2 className="text-xl font-bold text-foreground">
          {result.matched > 0
            ? `${result.matched} Payment${result.matched > 1 ? 's' : ''} Recorded to Ledger`
            : 'Submission Received'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {result.matched === result.submitted
            ? 'All payments matched and successfully recorded to the ledger.'
            : result.matched > 0
            ? 'Some payments matched. Unmatched ones will auto-match when the payer posts their side.'
            : 'Your submission is in the pool. It will auto-match when the parent submits their transaction.'}
        </p>
        {result.errors.length > 0 && (
          <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 rounded-xl p-3 text-left space-y-1">
            {result.errors.map((e, i) => (
              <p key={i} className="text-sm text-orange-600">{e}</p>
            ))}
          </div>
        )}
        <div className="flex gap-3 justify-center pt-2">
          <Button variant="outline" onClick={() => { setResult(null); setRows([makeRow()]); setPhase('idle') }}>
            Submit more
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => window.location.href = ledgerHref}>
            View Ledger
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Paste the exact confirmation message you received from your bank or payment provider. The system will automatically extract the details and record it to the ledger.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {rows.map((row, idx) => (
          <div key={row.id} className="bg-card border border-border rounded-2xl p-4 space-y-4">
            {rows.length > 1 && (
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Entry {idx + 1}</span>
                <button type="button" onClick={() => removeRow(row.id)} className="text-muted-foreground hover:text-orange-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={`raw-${row.id}`}>Transaction Message (paste SMS or app notification)</Label>
                <button type="button" onClick={() => setShowRaw((s) => ({ ...s, [row.id]: !s[row.id] }))}
                  className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground">
                  {showRaw[row.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {showRaw[row.id] ? 'Hide' : 'Show'}
                </button>
              </div>
              <textarea
                id={`raw-${row.id}`}
                rows={3}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-mono"
                placeholder="e.g. QJK23XF89H Confirmed. Ksh 15,000.00 received from 0712 345 678 on 1/8/26 at 10:30 AM."
                value={showRaw[row.id] ? row.rawMessage : (row.rawMessage ? '●●●●●● (tap Show to edit)' : '')}
                onChange={(e) => parseMessage(e.target.value, row.id)}
                onFocus={() => setShowRaw((s) => ({ ...s, [row.id]: true }))}
              />

              {row.rawMessage && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Transaction Details</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                    {row.detectedProvider && <><span className="text-muted-foreground">Provider</span><span className="font-medium text-foreground">{row.detectedProvider}</span></>}
                    {row.referenceCode && <><span className="text-muted-foreground">Reference</span><span className="font-mono font-bold text-foreground">{row.referenceCode}</span></>}
                    {row.parsedAmount && <><span className="text-muted-foreground">Amount</span><span className="font-semibold text-foreground">{row.parsedCurrency} {parseFloat(row.parsedAmount).toLocaleString()}</span></>}
                    {row.parsedFee && <><span className="text-muted-foreground">Transaction Fee</span><span className="text-foreground">{row.parsedCurrency} {parseFloat(row.parsedFee).toLocaleString()}</span></>}
                    {row.parsedTransactionAt && <><span className="text-muted-foreground">Date / Time</span><span className="text-foreground">{row.parsedTransactionAt}</span></>}
                    {row.parsedCounterparty && <><span className="text-muted-foreground">From</span><span className="italic text-foreground">{row.parsedCounterparty}</span></>}
                    {row.parsedSelfIdentity && <><span className="text-muted-foreground">To Account</span><span className="italic text-foreground">{row.parsedSelfIdentity}</span></>}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor={`ref-${row.id}`}>Reference Code *</Label>
                <Input id={`ref-${row.id}`} className="font-mono uppercase" placeholder="QJK23XF89H"
                  value={row.referenceCode}
                  onChange={(e) => updateRow(row.id, { referenceCode: e.target.value.toUpperCase().trim() })}
                  required={row.paymentRail !== 'cash' && row.paymentRail !== 'cheque'} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`amount-${row.id}`}>Amount Received *</Label>
                <Input id={`amount-${row.id}`} type="number" placeholder="15000" value={row.parsedAmount}
                  onChange={(e) => updateRow(row.id, { parsedAmount: e.target.value })} required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Payment Channel</Label>
              <div className="flex flex-wrap gap-2">
                {RAILS.map((r) => (
                  <button key={r.value} type="button" onClick={() => updateRow(row.id, { paymentRail: r.value })}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      row.paymentRail === r.value
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700'
                        : 'border-border text-muted-foreground hover:border-blue-300'
                    }`}>
                    {r.label}
                  </button>
                ))}
              </div>
              {(row.paymentRail === 'cash' || row.paymentRail === 'cheque') && (
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  ⚠ Cash/cheque payments won't auto-match. They go to your Pending Cash list for manual confirmation.
                </p>
              )}
            </div>
          </div>
        ))}

        <button type="button" onClick={addRow}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:border-blue-400 hover:text-blue-600 transition-all">
          <Plus className="w-4 h-4" />
          Add another transaction
        </button>

        <Button type="submit" disabled={phase !== 'idle'}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-all">
          {phase === 'idle' && <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Submit{rows.length > 1 ? ' All' : ''}</span>}
          {phase === 'verifying' && <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</span>}
          {phase === 'verified' && <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Payment Verified ✓</span>}
          {phase === 'recording' && <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Recording to ledger...</span>}
        </Button>
      </form>
    </div>
  )
}
