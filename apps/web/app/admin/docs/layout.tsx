import React from 'react'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Terminal, Database, Shield, Lock, ChevronRight, Activity, Cpu, KeyRound } from 'lucide-react'
import { PinForm } from './pin-form'
import { SetupPinForm } from './setup-pin-form'
import { createClient } from '@/lib/supabase/server'

import type { LucideIcon } from 'lucide-react'

type DevGuideItem = { slug: string; title: string; icon?: LucideIcon }
type DevGuideGroup = { category: string; items: DevGuideItem[] }

const devGuides: DevGuideGroup[] = [
  {
    category: 'Core',
    items: [
      { slug: '00-mission-and-overview', title: 'Mission & Overview', icon: Terminal },
      { slug: '01-architecture', title: 'Architecture', icon: Cpu },
      { slug: '03-api-reference', title: 'API Reference', icon: Activity },
      { slug: '04-data-model', title: 'Data Model', icon: Database },
      { slug: '05-multi-tenancy-and-security', title: 'Multi-Tenancy', icon: Shield },
    ]
  },
  {
    category: 'Modules',
    items: [
      { slug: '02-modules/01-admin-portal', title: 'Admin Portal' },
      { slug: '02-modules/02-principal-dashboard', title: 'Principal Dashboard' },
      { slug: '02-modules/03-teacher-portal', title: 'Teacher Portal' },
      { slug: '02-modules/04-bursar-portal', title: 'Bursar Portal' },
      { slug: '02-modules/05-parent-portal', title: 'Parent Portal' },
      { slug: '02-modules/06-ancillary-services', title: 'Ancillary Services' },
    ]
  },
  {
    category: 'Meta',
    items: [
      { slug: '06-decisions/01-single-users-table', title: 'ADR: Single Users Table' },
      { slug: '07-known-issues-and-tech-debt', title: 'Tech Debt' },
      { slug: '08-onboarding', title: 'Onboarding' },
      { slug: '09-glossary', title: 'Glossary' },
    ]
  }
]

export default async function AdminDocsLayout({ children }: { children: React.ReactNode }) {
  // 1. Ensure the visitor is a logged-in admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/admin/docs')
  }

  // 2. Fetch their profile to check if a PIN has been set
  const { data: profile } = await (supabase
    .from('users') as any)
    .select('role, dev_docs_pin_hash')
    .eq('id', user.id)
    .single() as { data: { role: string; dev_docs_pin_hash: string | null } | null }

  // Only allow admins
  const isAdmin = profile?.role === 'admin' || 
    user.email?.toLowerCase() === (process.env.PRODUCT_ADMINISTRATOR_EMAIL ?? '').toLowerCase()
    
  if (!isAdmin) {
    redirect('/admin/dashboard')
  }

  const hasPinSetup = !!profile?.dev_docs_pin_hash

  // 3. Check if session cookie is present (unlocked this session)
  const cookieStore = await cookies()
  const isSessionUnlocked = cookieStore.has('dev_docs_session')

  // 4a. No PIN set yet → show PIN creation screen
  if (!hasPinSetup) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 selection:bg-emerald-900 selection:text-emerald-400">
        <div className="max-w-md w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center text-emerald-500 mb-6 border border-zinc-800 shadow-inner">
              <KeyRound className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-mono font-bold text-white mb-2 tracking-tight">Set Up Developer PIN</h1>
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

  // 4b. PIN exists but session not unlocked → show lock screen
  if (!isSessionUnlocked) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 selection:bg-emerald-900 selection:text-emerald-400">
        <div className="max-w-md w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 mb-6 border border-zinc-800 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-mono font-bold text-white mb-2 tracking-tight">Developer Mode</h1>
            <p className="text-sm font-mono text-zinc-500">Internal Architectural Docs are locked. Enter your PIN to proceed.</p>
          </div>
          <PinForm />
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 flex flex-col font-mono selection:bg-emerald-900 selection:text-emerald-400">
      
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur flex-none">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard" className="text-zinc-500 hover:text-white transition-colors">
                &larr; Back to Admin
              </Link>
              <div className="w-px h-6 bg-zinc-800"></div>
              <Link href="/admin/docs" className="flex items-center gap-2 text-white hover:text-emerald-400 transition-colors">
                <Terminal className="w-5 h-5" />
                <span className="font-bold tracking-tight">internal_docs</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Docs Layout */}
      <div className="flex-1 w-full max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row">
        
        {/* Left Sidebar */}
        <aside className="hidden lg:block w-72 shrink-0 py-8 pr-8 border-r border-zinc-800">
          <nav className="sticky top-24 space-y-8">
            {devGuides.map((group) => (
              <div key={group.category}>
                <h3 className="font-bold text-white mb-3 text-xs tracking-widest uppercase">[{group.category}]</h3>
                <ul className="space-y-1.5">
                  {group.items.map((guide) => {
                    const Icon = guide.icon || ChevronRight
                    return (
                      <li key={guide.slug}>
                        <Link 
                          href={`/admin/docs/${guide.slug}`} 
                          className="flex items-center gap-3 px-3 py-2 text-sm rounded border border-transparent hover:bg-zinc-900 hover:border-zinc-800 hover:text-emerald-400 transition-all text-zinc-400 group"
                        >
                          <Icon className="w-4 h-4 opacity-50 group-hover:opacity-100" />
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

        {/* Main Content */}
        <main className="flex-1 min-w-0 py-8 lg:pl-10">
          {children}
        </main>
      </div>
    </div>
  )
}
