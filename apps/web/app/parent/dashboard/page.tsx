import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Wallet, CheckCircle2, AlertCircle } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function ParentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Find students linked to this parent
  // We use the admin client or a join via RLS if set up correctly
  // For demo, we'll assume RLS lets the parent read their own students' invoices
  
  // Since we haven't seeded student_parents yet, let's just show an empty state or 
  // fetch invoices where student is linked to parent.
  // We'll mock the UI structure since data is empty.

  const formatKES = (amount: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(amount)
  }

  // MOCK DATA for now until we build the Parent->Student linking UI
  const mockStudents = [
    {
      id: '1',
      name: 'John Doe',
      class: 'Grade 4',
      invoice: {
        id: 'inv-1',
        term: 'Term 1 - 2026',
        amount: 15000,
        balance: 15000,
      }
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Welcome back!</h1>
        <p className="text-sm text-muted-foreground mt-1">Here is the fee status for your children.</p>
      </div>

      <div className="space-y-4">
        {mockStudents.map((student) => (
          <Card key={student.id} className="border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4">
              <h2 className="font-semibold text-lg text-foreground">{student.name}</h2>
              <p className="text-sm text-muted-foreground">{student.class}</p>
            </div>
            
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
                    {student.invoice.term} Fees
                  </p>
                  <p className="text-2xl font-bold text-foreground">{formatKES(student.invoice.balance)}</p>
                </div>
                
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  student.invoice.balance > 0 ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  {student.invoice.balance > 0 ? <Wallet className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                </div>
              </div>

              {student.invoice.balance > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 rounded-lg text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>Fees are due. Please settle the balance to avoid disruptions.</p>
                  </div>
                  
                  {/* Client component needed for STK Push logic, but we'll mock it here with a form/action for simplicity */}
                  <form action="/api/mpesa/push" method="POST">
                    <input type="hidden" name="invoiceId" value={student.invoice.id} />
                    <input type="hidden" name="amount" value={student.invoice.balance} />
                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-12 rounded-xl text-lg">
                      Pay with M-Pesa
                    </Button>
                  </form>
                </div>
              ) : (
                <div className="flex items-start gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <p>All fees are cleared for this term. Thank you!</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
