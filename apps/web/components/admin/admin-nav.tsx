'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BarChart3, Building2, ShieldCheck, MessageSquare, DatabaseZap, Terminal, CreditCard } from 'lucide-react'
import { motion } from 'framer-motion'
import { UnreadMessagesBadge } from '@/components/shared/unread-messages-badge'

const NAV_ITEMS = [
  { href: '/admin/dashboard',    label: 'Overview',       Icon: LayoutDashboard },
  { href: '/admin/analytics',    label: 'Analytics',      Icon: BarChart3       },
  { href: '/admin/schools',      label: 'Schools',        Icon: Building2       },
  { href: '/admin/billing',      label: 'Subscriptions',  Icon: CreditCard      },
  { href: '/admin/messages',     label: 'Messages',       Icon: MessageSquare   },
  { href: '/admin/admins',       label: 'Admins',         Icon: ShieldCheck,    rootOnly: true },
  { href: '/admin/optimization', label: 'Optimize',       Icon: DatabaseZap,    rootOnly: true },
  { href: '/admin/docs',         label: 'Docs',           Icon: Terminal,       rootOnly: true },
]

export function AdminNav({ isRoot }: { isRoot: boolean }) {
  const pathname = usePathname()
  const items = isRoot ? NAV_ITEMS : NAV_ITEMS.filter(i => !i.rootOnly)
  
  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50" style={{ width: 'min(calc(100vw - 1.5rem), 44rem)' }}>
      {/* Glass blur backdrop */}
      <div className="absolute inset-0 bg-card/80 backdrop-blur-xl rounded-[1.75rem] shadow-xl shadow-black/10 dark:shadow-black/40 border border-border/60" />
      
      <div className="relative flex items-center justify-around p-1.5">
        {items.map((t) => {
          const active = pathname === t.href || (pathname.startsWith(`${t.href}/`) && t.href !== '/admin/dashboard')
          const Icon = t.Icon
          
          return (
            <Link
              key={t.href}
              href={t.href}
              className="relative py-2 px-3 rounded-2xl transition-all duration-300 tap-highlight-transparent group flex flex-col items-center flex-1 min-w-0"
            >
              {active && (
                <motion.div
                  layoutId="admin-active-tab"
                  className="absolute inset-0 rounded-2xl shadow-md"
                  style={{ background: 'linear-gradient(135deg, #1D6FEB 0%, #22D3EE 100%)', boxShadow: '0 4px 14px rgba(29,111,235,0.35)' }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                />
              )}
              
              <div className="relative z-10 flex flex-col items-center gap-1">
                <div className="relative">
                  <Icon className={`w-5 h-5 stroke-[2.5] transition-colors duration-300 ${
                    active 
                      ? 'text-white' 
                      : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                  }`} />
                  {t.href === '/admin/messages' && (
                    <UnreadMessagesBadge />
                  )}
                </div>
                <span className={`text-[9px] font-bold tracking-tight transition-colors duration-300 ${
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
