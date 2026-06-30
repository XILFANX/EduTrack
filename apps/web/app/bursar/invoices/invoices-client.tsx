'use client'

import { useState, useMemo } from 'react'
import { RecordPaymentModal } from './record-payment-modal'
import { GenerateInvoicesModal } from './generate-invoices-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Zap, Search, CreditCard, ChevronDown, ChevronUp } from 'lucide-react'

interface Term { id: string; name: string; is_active?: boolean }
interface Class { id: string; name: string }

interface Invoice {
  id: string
  amount: number
  balance: number
  status: string
  created_at: string
  students: {
    id: string
    first_name: string
    last_name: string
    admission_number: string
    classes: { name: string } | null
  } | null
  academic_terms: { name: string } | null
  invoice_items: { description: string; amount: number }[]
  fee_payments: { id: string; amount: number; payment_method: string; mpesa_receipt: string | null; payment_date: string }[]
}

interface Props {
  schoolId: string
  invoices: Invoice[]
  terms: Term[]
  classes: Class[]
}

const formatKES = (n: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n)

const STATUS_BADGE: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  partial: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  unpaid: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

export function InvoicesClient({ schoolId, invoices: initial, terms, classes }: Props) {
  const [invoices, setInvoices] = useState(initial)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [paymentTarget, setPaymentTarget] = useState<Invoice | null>(null)
  const [showGenerate, setShowGenerate] = useState(false)

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const name = `${inv.students?.first_name} ${inv.students?.last_name} ${inv.students?.admission_number}`.toLowerCase()
      const matchSearch = !search || name.includes(search.toLowerCase())
      const matchStatus = filterStatus === 'all' || inv.status === filterStatus
      return matchSearch && matchStatus
    })
  }, [invoices, search, filterStatus])

  const totalExpected = invoices.reduce((s, i) => s + i.amount, 0)
  const totalCollected = invoices.reduce((s, i) => s + (i.amount - i.balance), 0)
  const totalArrears = invoices.reduce((s, i) => s + i.balance, 0)

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total Expected', value: totalExpected, color: 'text-foreground', bg: 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800' },
          { label: 'Collected', value: totalCollected, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' },
          { label: 'Arrears', value: totalArrears, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.bg} border rounded-2xl p-4 text-center`}>
            <p className={`text-lg font-bold ${stat.color}`}>{formatKES(stat.value)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
        <Button className="bg-blue-600 hover:bg-blue-700 gap-2" onClick={() => setShowGenerate(true)}>
          <Zap className="w-4 h-4" />
          Generate Invoices
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search student name or admission no…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoice list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <p className="text-muted-foreground">No invoices found. Generate invoices to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((inv) => {
            const isExpanded = expandedId === inv.id
            const paidAmount = inv.amount - inv.balance
            const student = inv.students
            const studentName = student ? `${student.first_name} ${student.last_name}` : 'Unknown'

            return (
              <div
                key={inv.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden"
              >
                {/* Row */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                      {student?.first_name?.[0] ?? '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{studentName}</p>
                      <p className="text-xs text-muted-foreground">{student?.admission_number} · {student?.classes?.name ?? '—'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className={`text-sm font-bold ${inv.balance > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                        {formatKES(inv.balance)}
                      </p>
                      <p className="text-xs text-muted-foreground">balance</p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${STATUS_BADGE[inv.status] || STATUS_BADGE.unpaid}`}>
                      {inv.status}
                    </span>
                    {inv.balance > 0 && (
                      <Button
                        size="sm"
                        className="h-8 bg-emerald-600 hover:bg-emerald-700 text-xs gap-1"
                        onClick={() => setPaymentTarget(inv)}
                      >
                        <CreditCard className="w-3 h-3" />
                        Pay
                      </Button>
                    )}
                    <button
                      className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      onClick={() => setExpandedId(isExpanded ? null : inv.id)}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-4 bg-slate-50/50 dark:bg-slate-800/20 space-y-4">
                    {/* Fee items */}
                    {inv.invoice_items.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Fee Breakdown</p>
                        <div className="space-y-1">
                          {inv.invoice_items.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{item.description}</span>
                              <span className="font-medium text-foreground">{formatKES(item.amount)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between text-sm font-bold pt-1 border-t border-slate-200 dark:border-slate-700">
                            <span>Total Invoiced</span>
                            <span>{formatKES(inv.amount)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Payment history */}
                    {inv.fee_payments.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Payment History</p>
                        <div className="space-y-1.5">
                          {inv.fee_payments.map((p) => (
                            <div key={p.id} className="flex justify-between items-center text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-xs px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 capitalize">
                                  {p.payment_method.replace('_', ' ')}
                                </span>
                                {p.mpesa_receipt && (
                                  <span className="text-xs font-mono text-muted-foreground">{p.mpesa_receipt}</span>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {new Date(p.payment_date).toLocaleDateString('en-KE')}
                                </span>
                              </div>
                              <span className="text-emerald-600 font-semibold">{formatKES(p.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between text-sm pt-1 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-muted-foreground">Paid so far</span>
                      <span className="text-emerald-600 font-bold">{formatKES(paidAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Remaining</span>
                      <span className={`font-bold ${inv.balance > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                        {formatKES(inv.balance)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      <RecordPaymentModal
        open={!!paymentTarget}
        onClose={() => {
          setPaymentTarget(null)
          window.location.reload()
        }}
        invoice={
          paymentTarget
            ? {
                id: paymentTarget.id,
                balance: paymentTarget.balance,
                studentName: `${paymentTarget.students?.first_name} ${paymentTarget.students?.last_name}`,
                studentId: paymentTarget.students?.id ?? '',
              }
            : null
        }
        schoolId={schoolId}
      />

      <GenerateInvoicesModal
        open={showGenerate}
        onClose={() => {
          setShowGenerate(false)
          window.location.reload()
        }}
        schoolId={schoolId}
        terms={terms}
        classes={classes}
      />
    </>
  )
}
