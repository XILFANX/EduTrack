import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import VerifyPaymentPage from '@/app/bursar/payments/page'
import { CheckCircle2 } from 'lucide-react'

export default async function AdminBillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'superadmin') {
    redirect('/dashboard')
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-blue-600 dark:text-blue-500" />
          Verify Subscriptions
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Reconcile incoming platform subscription payments from schools.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden">
        {/* We reuse the VerifyClient but tell it this is for subscriptions if it supported that via prop. 
            Currently, verify-client is tied to payee logic. We will render the existing one for now. */}
        <VerifyPaymentPage />
      </div>
    </div>
  )
}
