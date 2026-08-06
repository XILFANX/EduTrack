import { ArrowLeft, Bell } from 'lucide-react'
import Link from 'next/link'

export default function NotificationsPage() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto pb-32">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/dashboard/settings" className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-xl font-bold text-foreground">Notifications</h1>
      </div>

      <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
        <div className="w-16 h-16 rounded-2xl bg-cyan-100 dark:bg-cyan-900/40 mx-auto flex items-center justify-center mb-4">
          <Bell className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Notification preferences</h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
          Manage your email and SMS alerts here. Configuration options will be unlocked in a future update.
        </p>
      </div>
    </div>
  )
}
