'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Wrench, Users, MessageSquare } from 'lucide-react'
import { motion } from 'framer-motion'
import { UnreadMessagesBadge } from '@/components/shared/unread-messages-badge'

const TABS = [
  { href: '/caretaker/dashboard', icon: Home, label: 'Home' },
  { href: '/caretaker/maintenance', icon: Wrench, label: 'Maintenance' },
  { href: '/caretaker/messages', icon: MessageSquare, label: 'Messages' },
  { href: '/caretaker/tenants', icon: Users, label: 'Occupancy' },
]

export function CaretakerNav() {
  const pathname = usePathname()
  
  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-[min(calc(100vw-2.5rem),24rem)]">
      {/* Heavy glass blur backdrop */}
      <div className="absolute inset-0 bg-card/80 backdrop-blur-xl rounded-[1.75rem] shadow-xl shadow-black/10 dark:shadow-black/40 border border-border/60" />
      
      <div className="relative flex items-center justify-around p-2">
        {TABS.map((t) => {
          const active = pathname === t.href || pathname.startsWith(`${t.href}/`)
          const Icon = t.icon
          
          return (
            <Link
              key={t.href}
              href={t.href}
              className="relative py-2.5 px-4 rounded-2xl transition-all duration-300 tap-highlight-transparent group flex flex-col items-center"
            >
              {active && (
                <motion.div
                  layoutId="caretaker-active-tab"
                  className="absolute inset-0 bg-violet-600 dark:bg-violet-500 rounded-2xl shadow-md shadow-violet-500/20"
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                />
              )}
              
              <div className="relative z-10 flex flex-col items-center gap-1">
                <div className="relative">
                  <Icon className={`w-[1.125rem] h-[1.125rem] transition-colors duration-300 ${
                    active 
                      ? 'text-white' 
                      : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                  }`} />
                  {t.href === '/caretaker/messages' && !active && <UnreadMessagesBadge />}
                </div>
                <span className={`text-[9px] font-bold tracking-wide transition-colors duration-300 ${
                  active 
                    ? 'text-white/90' 
                    : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                }`}>
                  {t.label}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
