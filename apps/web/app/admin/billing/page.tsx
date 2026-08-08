import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import VerifyPaymentPage from '@/app/bursar/payments/page'
import { CheckCircle2 } from 'lucide-react'

export default async function AdminBillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Role check removed: admin/layout.tsx already guarantees access.
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-blue-600 dark:text-blue-600" />
          Verify Subscription Payments
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Reconcile incoming platform subscription payments from schools.
        </p>
      </div>

      <div className="bg-white dark:bg-[#060d1a] border border-slate-200 dark:border-[#1a2744] rounded-[2rem] overflow-hidden">
        {/* VerifyPaymentPage accepts title & ledgerHref props for context-awareness */}
        <VerifyPaymentPage title="Verify Subscription Payment" ledgerHref="/admin/billing" />
      </div>
    </div>
  )
}

