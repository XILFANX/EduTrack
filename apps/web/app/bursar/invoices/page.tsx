import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Receipt, Send, CheckCircle2, Clock } from 'lucide-react'

export default async function InvoicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return null

  const { data: invoicesResult } = await supabase
    .from('invoices')
    .select('*, students(first_name, last_name, admission_number), academic_terms(name)')
    .eq('school_id', profile.school_id)
    .order('created_at', { ascending: false })
  const invoices = (invoicesResult as any[]) || []

  const formatKES = (amount: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage student billing and track payments.</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700 gap-2">
          <Receipt className="w-4 h-4" />
          Bill a Class
        </Button>
      </div>

      <div className="space-y-3">
        {!invoices || invoices.length === 0 ? (
           <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
           <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/40 mx-auto flex items-center justify-center mb-4">
             <Receipt className="w-8 h-8 text-purple-600 dark:text-purple-400" />
           </div>
           <h2 className="text-lg font-semibold text-foreground">No invoices generated</h2>
           <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
             Click "Bill a Class" to apply fee structures and generate invoices for students.
           </p>
         </div>
        ) : (
          invoices.map(inv => (
            <Card key={inv.id} className="border-slate-200 dark:border-slate-800 flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  inv.balance === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'
                }`}>
                  {inv.balance === 0 ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {inv.students?.first_name} {inv.students?.last_name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {inv.students?.admission_number} • {inv.academic_terms?.name}
                  </p>
                </div>
              </div>

              <div className="text-right flex items-center gap-6">
                <div>
                  <p className="font-bold text-foreground">{formatKES(inv.amount)}</p>
                  <p className="text-xs text-muted-foreground">
                    Bal: <span className={inv.balance > 0 ? 'text-red-500 font-medium' : 'text-emerald-500 font-medium'}>
                      {formatKES(inv.balance)}
                    </span>
                  </p>
                </div>
                {inv.balance > 0 && (
                  <Button variant="outline" size="icon" className="text-slate-500 hover:text-emerald-600">
                    <Send className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
