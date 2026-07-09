import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import AccountClient from './account-client'
import DeleteAccountButton from './delete-account-button'

export default async function AccountSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, phone_number')
    .eq('id', user.id)
    .single()

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto pb-32">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/dashboard/settings" className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-xl font-bold text-foreground">Account &amp; Security</h1>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <p className="text-slate-500 text-sm mb-6">Manage your login credentials and profile details.</p>
        <AccountClient
          initialName={profile?.full_name ?? ''}
          initialPhone={profile?.phone_number ?? ''}
        />
      </div>

      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl p-6 shadow-sm">
        <h2 className="text-red-600 dark:text-red-400 font-semibold mb-2">Danger Zone</h2>
        <p className="text-sm text-red-800 dark:text-red-300 mb-4">
          Deleting your account is permanent. All school data associated with your profile will be removed.
        </p>
        <DeleteAccountButton />
      </div>
    </div>
  )
}
