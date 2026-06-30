import { createClient } from '@/lib/supabase/server'
import { CardContent } from '@/components/ui/card'
import { Wallet, CheckCircle2, AlertCircle, Smartphone, Copy } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function ParentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, full_name, school_id, schools(name)')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return null

  const school = (profile as any).schools

  // Get students linked to this parent
  const { data: studentLinks } = await supabase
    .from('student_parents')
    .select('relationship, students(id, first_name, last_name, admission_number, classes(name))')
    .eq('parent_id', user.id)

  const students = (studentLinks as any[]) || []

  // For each student, get their active term invoice
  const { data: activeTerm } = await supabase
    .from('academic_terms')
    .select('id, name')
    .eq('school_id', profile.school_id)
    .eq('is_active', true)
    .single()

  // Fetch invoices for all linked students in the active term
  const studentIds = students.map((l: any) => l.students?.id).filter(Boolean)
  let invoices: any[] = []

  if (studentIds.length > 0 && activeTerm) {
    const { data: invData } = await supabase
      .from('invoices')
      .select('id, amount, balance, status, students(id, first_name, last_name), academic_terms(name)')
      .eq('school_id', profile.school_id)
      .eq('term_id', activeTerm.id)
      .in('student_id', studentIds)
      .is('deleted_at', null)

    invoices = (invData as any[]) || []
  }

  const formatKES = (amount: number) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(amount)

  const firstName = profile.full_name?.split(' ')[0] ?? 'Parent'

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Hello, {firstName}! 👋</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {school?.name} · {activeTerm?.name ?? 'No active term'}
        </p>
      </div>

      {/* No students linked yet */}
      {students.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center mb-4">
            <Wallet className="w-7 h-7 text-slate-400" />
          </div>
          <p className="font-semibold text-foreground">No students linked yet</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
            Your school administrator will link your children to your account. Check back soon!
          </p>
        </div>
      )}

      {/* Student fee cards */}
      {students.map((link: any) => {
        const student = link.students
        if (!student) return null
        const invoice = invoices.find((inv: any) => inv.students?.id === student.id)
        const balance = invoice?.balance ?? null
        const totalAmount = invoice?.amount ?? null
        const paidAmount = totalAmount !== null && balance !== null ? totalAmount - balance : null

        return (
          <div key={student.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            {/* Student Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
                  {student.first_name[0]}
                </div>
                <div>
                  <p className="font-bold">{student.first_name} {student.last_name}</p>
                  <p className="text-xs text-blue-100">{student.classes?.name ?? '—'} · Adm: {student.admission_number}</p>
                </div>
              </div>
            </div>

            <CardContent className="p-4 space-y-4">
              {/* No invoice for this term */}
              {!invoice && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">No invoice generated for this term yet.</p>
                </div>
              )}

              {/* Invoice summary */}
              {invoice && (
                <>
                  {/* Balance summary */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                      <p className="text-xs text-muted-foreground mb-1">Total</p>
                      <p className="text-sm font-bold text-foreground">{formatKES(totalAmount!)}</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3">
                      <p className="text-xs text-muted-foreground mb-1">Paid</p>
                      <p className="text-sm font-bold text-emerald-600">{formatKES(paidAmount!)}</p>
                    </div>
                    <div className={`rounded-xl p-3 ${balance! > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'}`}>
                      <p className="text-xs text-muted-foreground mb-1">Balance</p>
                      <p className={`text-sm font-bold ${balance! > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                        {formatKES(balance!)}
                      </p>
                    </div>
                  </div>

                  {/* Status */}
                  {balance! > 0 ? (
                    <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 rounded-xl text-sm text-orange-700 dark:text-orange-400">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p>You have an outstanding balance of <strong>{formatKES(balance!)}</strong>. Please pay before the end of the term to avoid disruptions.</p>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-sm text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <p>All fees cleared for this term. Thank you! 🎉</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </div>
        )
      })}

      {/* M-Pesa Payment Instructions */}
      {students.length > 0 && (
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
              Go to <strong>M-Pesa</strong> → <strong>Lipa na M-Pesa</strong> → <strong>Pay Bill</strong>
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
              Share the <strong>receipt code</strong> with the school bursar to confirm payment
            </li>
          </ol>
        </div>
      )}
    </div>
  )
}
