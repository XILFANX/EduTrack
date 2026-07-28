import React from 'react'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Terminal, Lock, KeyRound, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PinForm } from './pin-form'
import { SetupPinForm } from './setup-pin-form'
import { MobileDocsSidebar } from './mobile-sidebar'
import { DesktopDocsSidebar } from './desktop-sidebar'
import { DocsHeaderNav } from './docs-header-nav'

export default async function AdminDocsLayout({ children }: { children: React.ReactNode }) {
  // 1. Verify user is authenticated
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login?next=/admin/docs')
  }

  // 2. Fetch user role using regular client (users can read their own row)
  const { data: userRecord, error: userRecordError } = await supabase
    .from('users')
    .select('role, dev_docs_pin_hash')
    .eq('id', user.id)
    .single()

  if (userRecordError || !userRecord) {
    redirect('/admin/dashboard')
  }

  // 3. Check admin access
  const adminEmail = process.env.PRODUCT_ADMINISTRATOR_EMAIL ?? ''
  const isAdmin =
    userRecord.role === 'admin' ||
    (adminEmail !== '' && user.email?.toLowerCase() === adminEmail.toLowerCase())

  if (!isAdmin) {
    redirect('/admin/dashboard')
  }

  // 4. Check PIN state
  const hasPinSetup = !!userRecord.dev_docs_pin_hash

  const cookieStore = await cookies()
  const isSessionUnlocked = cookieStore.has('dev_docs_session_v2')

  // 5. First-time setup
  if (!hasPinSetup) {
    return (
      <div className="min-h-[calc(100vh-theme(spacing.16))] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-6 border border-slate-200 dark:border-slate-700">
              <KeyRound className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-mono font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
              Set Up Developer PIN
            </h1>
            <p className="text-sm font-mono text-slate-600 dark:text-slate-400 leading-relaxed">
              Create a secure PIN for your developer docs.<br />
              This is separate from your account password.
            </p>
          </div>
          <SetupPinForm />
        </div>
      </div>
    )
  }

  // 6. PIN entry gate
  if (!isSessionUnlocked) {
    return (
      <div className="min-h-[calc(100vh-theme(spacing.16))] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 mb-6 border border-slate-200 dark:border-slate-700">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-mono font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
              Developer Mode
            </h1>
            <p className="text-sm font-mono text-slate-600 dark:text-slate-400">
              Internal Architectural Docs are locked. Enter your PIN to proceed.
            </p>
          </div>
          <PinForm />
        </div>
      </div>
    )
  }

  // 7. Render docs layout
  return (
    <div className="flex flex-col font-mono min-h-[calc(100vh-theme(spacing.32))] bg-white dark:bg-[#0A0A0F] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header */}
      <header className="w-full border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex-none px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center gap-4">
          <MobileDocsSidebar />
          <Link
            href="/admin/dashboard"
            className="hidden sm:block text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors text-sm shrink-0"
          >
            &larr; Back to Admin
          </Link>
          <DocsHeaderNav accent="blue" />
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 w-full flex flex-col lg:flex-row">
        {/* Desktop Sidebar (hides itself on codebase route) */}
        <DesktopDocsSidebar />

        {/* Main content */}
        <main className="flex-1 min-w-0 p-6 sm:p-8 lg:p-10">{children}</main>
      </div>
    </div>
  )
}
