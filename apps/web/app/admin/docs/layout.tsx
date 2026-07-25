import React from 'react'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Terminal, Lock, KeyRound, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PinForm } from './pin-form'
import { SetupPinForm } from './setup-pin-form'
import { MobileDocsSidebar } from './mobile-sidebar'
import { devGuides } from './docs-config'

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
  const isSessionUnlocked = cookieStore.has('dev_docs_session')

  // 5. First-time setup
  if (!hasPinSetup) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center text-blue-500 mb-6 border border-zinc-800">
              <KeyRound className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-mono font-bold text-white mb-2 tracking-tight">
              Set Up Developer PIN
            </h1>
            <p className="text-sm font-mono text-zinc-500 leading-relaxed">
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
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 mb-6 border border-zinc-800">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-mono font-bold text-white mb-2 tracking-tight">
              Developer Mode
            </h1>
            <p className="text-sm font-mono text-zinc-500">
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
    <div className="min-h-screen bg-zinc-950 text-zinc-300 flex flex-col font-mono">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/90 backdrop-blur flex-none">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center gap-4">
            <MobileDocsSidebar />
            <Link
              href="/admin/dashboard"
              className="hidden sm:block text-zinc-500 hover:text-white transition-colors text-sm"
            >
              &larr; Back to Admin
            </Link>
            <div className="hidden sm:block w-px h-5 bg-zinc-800" />
            <Link
              href="/admin/docs"
              className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors"
            >
              <Terminal className="w-5 h-5" />
              <span className="font-bold tracking-tight">internal_docs</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 w-full max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-72 shrink-0 py-8 pr-8 border-r border-zinc-800">
          <nav className="sticky top-24 space-y-8">
            {devGuides.map((group) => (
              <div key={group.category}>
                <h3 className="font-bold text-white mb-3 text-xs tracking-widest uppercase">
                  [{group.category}]
                </h3>
                <ul className="space-y-1.5">
                  {group.items.map((guide) => {
                    const Icon = guide.icon ?? ChevronRight
                    return (
                      <li key={guide.slug}>
                        <Link
                          href={`/admin/docs/${guide.slug}`}
                          className="flex items-center gap-3 px-3 py-2 text-sm rounded border border-transparent hover:bg-zinc-900 hover:border-zinc-800 hover:text-blue-400 transition-all text-zinc-400 group"
                        >
                          <Icon className="w-4 h-4 opacity-50 group-hover:opacity-100 shrink-0" />
                          <span className="truncate">{guide.title}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 py-8 lg:pl-10">{children}</main>
      </div>
    </div>
  )
}
