import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ShieldCheck, MessageSquare } from 'lucide-react'
import { MessagingPoliciesClient } from '@/components/shared/messaging-policies-client'
import { getMessagingPolicy } from '@/app/actions/chat'

export const dynamic = 'force-dynamic'

export default async function MessagingPoliciesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id || !['admin', 'principal', 'headteacher'].includes(profile.role as string)) {
    redirect('/dashboard')
  }

  const policy = await getMessagingPolicy()

  const defaultPolicy = {
    parents_can_message_teachers: true,
    parents_can_message_admin: true,
    parents_can_message_parents: false,
    subject_teachers_can_message_parents: true,
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Messaging Policies</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          Control who can initiate conversations with whom in your school. These settings take effect immediately and apply across all portals.
        </p>
      </div>

      {/* Info callout */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl">
        <MessageSquare className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">How policies work</p>
          <p className="text-xs text-blue-700 dark:text-blue-400 mt-1 leading-relaxed">
            Disabling a rule hides the contact from the affected role&apos;s contact list entirely. Existing conversations remain accessible. Class Group chats are not affected by these policies — they are automatically maintained per class enrolment.
          </p>
        </div>
      </div>

      {/* Policy toggles */}
      <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
        <h2 className="text-sm font-bold text-foreground mb-4 uppercase tracking-widest text-slate-500">
          Communication Rules
        </h2>
        <MessagingPoliciesClient initialPolicy={policy || defaultPolicy} />
      </div>
    </div>
  )
}
