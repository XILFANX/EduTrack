'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Receipt, BookOpen, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/bursar/dashboard', icon: Home },
  { label: 'Invoices', href: '/bursar/invoices', icon: Receipt },
  { label: 'Fee Structures', href: '/bursar/fee-structures', icon: BookOpen },
  { label: 'Settings', href: '/bursar/settings', icon: Settings },
]

export function BursarNav() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 z-50 pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around p-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className={`relative flex items-center justify-center w-8 h-8 rounded-full mb-0.5 transition-all ${isActive ? 'bg-emerald-100 dark:bg-emerald-900/40' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : 'scale-100'}`} />
              </div>
              <span className="text-[10px] tracking-wide">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
