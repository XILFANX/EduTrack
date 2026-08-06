'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Receipt, BookOpen, MessageSquare } from 'lucide-react'
import { UnreadMessagesBadge } from '@/components/shared/unread-messages-badge'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/parent/dashboard', icon: Home },
  { label: 'Fees', href: '/parent/payments', icon: Receipt },
  { label: 'Academics', href: '/parent/academics', icon: BookOpen },
  { label: 'Messages', href: '/parent/messages', icon: MessageSquare },
]

export function ParentNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-50">
      <div className="flex items-center justify-around p-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all duration-300 ${
                isActive 
                  ? 'text-cyan-600 dark:text-cyan-400' 
                  : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
              }`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-cyan-100 dark:bg-cyan-900/40 rounded-xl transition-all duration-300 -z-10" />
              )}
              <div className="relative">
                <Icon 
                  strokeWidth={isActive ? 2.5 : 2} 
                  className={`w-6 h-6 transition-all duration-300 ${isActive ? '-translate-y-0.5' : ''}`} 
                />
                {item.href === '/parent/messages' && !isActive && <UnreadMessagesBadge />}
              </div>
              <span className={`text-[10px] font-semibold mt-1 transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 absolute bottom-1'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
