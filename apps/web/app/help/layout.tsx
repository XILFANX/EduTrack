import React from 'react'
import Link from 'next/link'
import { BookOpen, Settings, Users, CreditCard, Wrench, HelpCircle, FileText, ArrowLeft, Home } from 'lucide-react'

const guides = [
  { slug: '00-getting-started', title: 'Getting Started', icon: BookOpen },
  { slug: '01-property-setup', title: 'Property Setup', icon: Settings },
  { slug: '02-tenant-management', title: 'Tenant Management', icon: Users },
  { slug: '03-rent-and-payments', title: 'Rent & Payments', icon: CreditCard },
  { slug: '04-maintenance', title: 'Maintenance', icon: Wrench },
  { slug: '05-faq-and-troubleshooting', title: 'FAQs', icon: HelpCircle },
  { slug: '06-account-and-billing', title: 'Account & Billing', icon: FileText },
]

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col selection:bg-violet-200 dark:selection:bg-violet-900">
      
      {/* Premium Docs Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur flex-none">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-800"></div>
              <Link href="/help" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white shadow-sm">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">EduTrack Docs</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 hidden sm:block">
                Sign In
              </Link>
              <Link href="/signup" className="text-sm font-medium px-4 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 transition-all hover:bg-slate-800 dark:hover:bg-slate-200">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </header>

        {/* Mobile Navigation (Scrollable Tabs) */}
        <div className="lg:hidden w-full border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 sticky top-16 z-30 overflow-x-auto no-scrollbar">
          <nav className="flex px-4 py-3 gap-2 min-w-max">
            <Link href="/help" className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-sm whitespace-nowrap active:scale-95 transition-transform">
              <Home className="w-4 h-4" />
              Home
            </Link>
            {guides.map((guide) => {
              const Icon = guide.icon
              return (
                <Link 
                  key={guide.slug} 
                  href={`/help/${guide.slug}`}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-sm whitespace-nowrap active:scale-95 transition-transform"
                >
                  <Icon className="w-4 h-4" />
                  {guide.title}
                </Link>
              )
            })}
          </nav>
        </div>

      {/* Docs Layout */}
      <div className="flex-1 w-full max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row">
        
        {/* Left Sidebar (Desktop) */}
        <aside className="hidden lg:block w-64 shrink-0 py-10 pr-8 border-r border-slate-200 dark:border-slate-800">
          <nav className="sticky top-28 space-y-8">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4 px-3 text-sm tracking-wide uppercase">User Guide</h3>
              <ul className="space-y-1">
                <li>
                  <Link href="/help" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white transition-colors">
                    <Home className="w-4 h-4" />
                    Help Center Home
                  </Link>
                </li>
                {guides.map((guide) => {
                  const Icon = guide.icon
                  return (
                    <li key={guide.slug}>
                      <Link 
                        href={`/help/${guide.slug}`} 
                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                      >
                        <Icon className="w-4 h-4" />
                        {guide.title}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4 px-3 text-sm tracking-wide uppercase">Legal</h3>
              <ul className="space-y-1">
                <li>
                  <Link href="/terms" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 py-10 lg:pl-10">
          {children}
        </main>
      </div>
    </div>
  )
}
