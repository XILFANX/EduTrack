'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, ArrowLeftRight, MessageSquare } from 'lucide-react'
import { motion } from 'framer-motion'

const NAV_ITEMS = [
  { label: 'Home',     href: '/library/dashboard', icon: LayoutDashboard },
  { label: 'Books',    href: '/library/books',     icon: BookOpen        },
  { label: 'Issues',   href: '/library/issues',    icon: ArrowLeftRight  },
  { label: 'Messages', href: '/library/messages',  icon: MessageSquare   },
]

export function LibraryNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-[min(calc(100vw-2rem),26rem)]">
      <div className="absolute inset-0 bg-card/80 backdrop-blur-xl rounded-[1.75rem] shadow-xl shadow-black/10 dark:shadow-black/40 border border-border/60" />
      <div className="relative flex items-center justify-around p-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative py-2.5 px-1 rounded-2xl transition-all duration-300 group flex flex-col items-center flex-1 min-w-0"
            >
              {isActive && (
                <motion.div
                  layoutId="library-active-tab"
                  className="absolute inset-0 rounded-2xl"
                  style={{ background: 'linear-gradient(135deg, #1D6FEB 0%, #22D3EE 100%)', boxShadow: '0 4px 14px rgba(29,111,235,0.35)' }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                />
              )}
              <div className="relative z-10 flex flex-col items-center gap-1">
                <Icon className={`w-5 h-5 stroke-[2.5] transition-colors duration-300 ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                }`} />
                <span className={`text-[9px] font-bold tracking-tight transition-colors duration-300 ${
                  isActive ? 'text-white/90' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                }`}>
                  {item.label}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
