import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Receipt, CheckCircle2, AlertCircle, Smartphone } from 'lucide-react'

export default async function ParentPayments() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileResult } = await supabase
    .from('users')
    .select('school_id, schools(name, fee_due_day)')
    .eq('id', user.id)
    .single()

  const profile = profileResult as any
  if (!profile?.school_id) return null
  const school = profile.schools

  // Get all linked students
  const { data: studentLinks } = await supabase
    .from('student_parents')
    .select('students(id, first_name, last_name, admission_number)')
    .eq('parent_id', user.id)

  const students = ((studentLinks as any[]) || []).map((l: any) => l.students).filter(Boolean)
  const studentIds = students.map((s: any) => s.id)

  // Active term
  const { data: activeTerm } = await supabase
    .from('academic_terms')
    .select('id, name')
    .eq('school_id', profile.school_id)
    .eq('is_active', true)
    .single()

  // Invoices
  let invoices: any[] = []
  let payments: any[] = []

  if (studentIds.length > 0 && activeTerm) {
    const { data: invData } = await supabase
      .from('invoices')
      .select('id, amount, balance, status, student_id, students(first_name, last_name)')
      .eq('school_id', profile.school_id)
      .eq('term_id', activeTerm.id)
      .in('student_id', studentIds)
      .is('deleted_at', null)

    invoices = (invData as any[]) || []

    // Payment history for these invoices
    const invoiceIds = invoices.map((inv: any) => inv.id)
    if (invoiceIds.length > 0) {
      const { data: payData } = await supabase
        .from('fee_payments')
        .select('amount, payment_method, mpesa_receipt, payment_date, invoice_id, students(first_name, last_name)')
        .in('invoice_id', invoiceIds)
        .order('payment_date', { ascending: false })

      payments = (payData as any[]) || []
    }
  }

  const formatKES = (n: number) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n)

  const totalOwed = invoices.reduce((sum: number, inv: any) => sum + (inv.balance || 0), 0)

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Payments</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {activeTerm?.name ?? 'No active term'} · Fee Overview
        </p>
      </div>

      {students.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No students linked to your account yet.</p>
        </div>
      )}

      {/* Overall balance banner */}
      {invoices.length > 0 && (
        <div className={`rounded-2xl p-5 text-white ${totalOwed > 0 ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-emerald-500 to-emerald-600'}`}>
          <p className="text-sm font-medium opacity-90">Outstanding Balance</p>
          <p className="text-4xl font-bold mt-1">{formatKES(totalOwed)}</p>
          <p className="text-sm mt-2 opacity-80">
            {totalOwed > 0 ? 'Please settle before the end of term.' : 'All fees cleared. Thank you! 🎉'}
          </p>
        </div>
      )}

      {/* Per-student invoice breakdown */}
      {invoices.map((inv: any) => {
        const paid = inv.amount - inv.balance
        return (
          <div key={inv.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <p className="font-semibold text-foreground text-sm">
                  {inv.students?.first_name} {inv.students?.last_name}
                </p>
                <p className="text-xs text-muted-foreground">{activeTerm?.name}</p>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                inv.status === 'paid'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                  : inv.status === 'partial'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
              }`}>
                {inv.status === 'paid' ? 'Paid' : inv.status === 'partial' ? 'Partial' : 'Unpaid'}
              </span>
            </div>
            <div className="grid grid-cols-3 text-center divide-x divide-slate-100 dark:divide-slate-800">
              <div className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Billed</p>
                <p className="font-bold text-sm text-foreground">{formatKES(inv.amount)}</p>
              </div>
              <div className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Paid</p>
                <p className="font-bold text-sm text-emerald-600">{formatKES(paid)}</p>
              </div>
              <div className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Balance</p>
                <p className={`font-bold text-sm ${inv.balance > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                  {formatKES(inv.balance)}
                </p>
              </div>
            </div>
          </div>
        )
      })}

      {/* Payment history */}
      {payments.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-foreground">Payment History</h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {payments.map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {p.students?.first_name} {p.students?.last_name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{p.payment_method}</span>
                    {p.mpesa_receipt && (
                      <span className="text-xs font-mono text-muted-foreground">· {p.mpesa_receipt}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(p.payment_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-bold text-sm">{formatKES(p.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* M-Pesa payment instructions */}
      {students.length > 0 && totalOwed > 0 && (
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold">How to Pay via M-Pesa</p>
              <p className="text-xs text-emerald-100">Follow these steps on your phone</p>
            </div>
          </div>
          <ol className="space-y-2 text-sm text-emerald-50">
            <li className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-white/20 text-xs flex items-center justify-center shrink-0 font-bold">1</span>
              Go to <strong className="mx-1">M-Pesa</strong> → <strong className="mx-1">Lipa na M-Pesa</strong> → <strong className="ml-1">Pay Bill</strong>
            </li>
            <li className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-white/20 text-xs flex items-center justify-center shrink-0 font-bold">2</span>
              Business No: <strong className="font-mono ml-1">247 247</strong>
            </li>
            <li className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-white/20 text-xs flex items-center justify-center shrink-0 font-bold">3</span>
              Account No: <strong className="font-mono ml-1">{school?.name ?? 'Your School Code'}</strong>
            </li>
            <li className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-white/20 text-xs flex items-center justify-center shrink-0 font-bold">4</span>
              Enter the exact amount and your M-Pesa PIN
            </li>
            <li className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-white/20 text-xs flex items-center justify-center shrink-0 font-bold">5</span>
              Share the <strong className="mx-1">receipt code</strong> with the school bursar to confirm payment
            </li>
          </ol>
        </div>
      )}
    </div>
  )
}
