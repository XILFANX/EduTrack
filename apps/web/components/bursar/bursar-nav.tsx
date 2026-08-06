'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Receipt, BookOpen, Settings, MessageSquare, Banknote, CheckCircle2, Menu } from 'lucide-react'
import { motion } from 'framer-motion'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { UnreadMessagesBadge } from '@/components/shared/unread-messages-badge'

const TABS = [
  { href: '/bursar/dashboard', icon: Home, label: 'Home' },
  { href: '/bursar/payments', icon: CheckCircle2, label: 'Fees' },
  { href: '/bursar/invoices', icon: Receipt, label: 'Invoices' },
  { href: '/bursar/messages', icon: MessageSquare, label: 'Messages' },
]

const MENU_SECTIONS = [
  {
    label: 'Academics & Finance',
    items: [
      { href: '/bursar/fee-structures', label: 'Fee Structures', icon: BookOpen },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/bursar/billing', label: 'Subscription', icon: Banknote },
      { href: '/bursar/settings', label: 'Settings', icon: Settings },
    ],
  },
]

export function BursarNav() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  // Check if any menu item is active
  const isMenuActive = MENU_SECTIONS.some(sec => 
    sec.items.some(item => pathname.startsWith(item.href) && !TABS.some(t => t.href === item.href))
  )

  return (
    <>
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-[min(calc(100vw-2rem),32rem)]">
        {/* Heavy glass blur backdrop */}
        <div className="absolute inset-0 bg-card/80 backdrop-blur-xl rounded-[1.75rem] shadow-xl shadow-black/10 dark:shadow-black/40 border border-border/60" />
        
        <div className="relative flex items-center justify-around p-2">
          {TABS.map((t) => {
            const active = pathname === t.href || (pathname.startsWith(`${t.href}/`) && t.href !== '/bursar/dashboard')
            const Icon = t.icon
            
            return (
              <Link
                key={t.href}
                href={t.href}
                className="relative py-2.5 px-1 rounded-2xl transition-all duration-300 tap-highlight-transparent group flex flex-col items-center flex-1 min-w-0"
              >
                {active && !menuOpen && (
                  <motion.div
                    layoutId="bursar-active-tab"
                    className="absolute inset-0 bg-cyan-600 dark:bg-cyan-500 rounded-2xl shadow-md shadow-cyan-500/20"
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}
                
                <div className="relative z-10 flex flex-col items-center gap-1">
                  <div className="relative">
                    <Icon className={`w-5 h-5 stroke-[2.5] transition-colors duration-300 ${
                      active && !menuOpen
                        ? 'text-white' 
                        : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                    }`} />
                    {t.href === '/bursar/messages' && !active && <UnreadMessagesBadge />}
                  </div>
                  <span className={`text-[9px] font-extrabold uppercase tracking-tight transition-colors duration-300 ${
                    active && !menuOpen
                      ? 'text-white/90' 
                      : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                  }`}>
                    {t.label}
                  </span>
                </div>
              </Link>
            )
          })}

          {/* Menu Button */}
          <button
            onClick={() => setMenuOpen(true)}
            className="relative py-2.5 px-1 rounded-2xl transition-all duration-300 tap-highlight-transparent group flex flex-col items-center flex-1 min-w-0"
          >
            {isMenuActive || menuOpen ? (
               <motion.div
                 layoutId="bursar-active-tab"
                 className="absolute inset-0 bg-cyan-600 dark:bg-cyan-500 rounded-2xl shadow-md shadow-cyan-500/20"
                 transition={{ type: "spring", stiffness: 350, damping: 25 }}
               />
            ) : null}
            
            <div className="relative z-10 flex flex-col items-center gap-1">
              <Menu className={`w-5 h-5 stroke-[2.5] transition-colors duration-300 ${
                isMenuActive || menuOpen
                  ? 'text-white' 
                  : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
              }`} />
              <span className={`text-[9px] font-extrabold uppercase tracking-tight transition-colors duration-300 ${
                isMenuActive || menuOpen
                  ? 'text-white/90' 
                  : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
              }`}>
                More
              </span>
            </div>
          </button>
        </div>
      </nav>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="bottom" className="rounded-t-[2rem] border-border bg-card/95 backdrop-blur-xl p-0 pb-24">
          <SheetTitle className="sr-only">More Options</SheetTitle>
          <div className="max-w-md mx-auto w-full px-6 py-6">
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-8" />
            
            <div className="space-y-8">
              {MENU_SECTIONS.map((section) => (
                <div key={section.label}>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 px-2">
                    {section.label}
                  </p>
                  <div className="grid grid-cols-4 gap-y-6 gap-x-2">
                    {section.items.map((item) => {
                      const active = pathname.startsWith(item.href)
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMenuOpen(false)}
                          className="flex flex-col items-center gap-2 group"
                        >
                          <div className={`relative w-14 h-14 rounded-[1.25rem] flex items-center justify-center transition-all duration-300 ${
                            active 
                              ? 'bg-gradient-to-br from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/30 -translate-y-1' 
                              : 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/40 dark:to-cyan-900/20 border border-blue-100/50 dark:border-blue-800/50 text-cyan-600 dark:text-cyan-400 group-hover:shadow-lg group-hover:shadow-cyan-500/20 group-hover:-translate-y-1'
                          }`}>
                            <Icon className="w-7 h-7" strokeWidth={2.5} />
                          </div>
                          <span className={`text-xs font-bold text-center mt-1 transition-colors ${active ? 'text-cyan-600 dark:text-cyan-400' : 'text-foreground group-hover:text-cyan-600'}`}>
                            {item.label}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
