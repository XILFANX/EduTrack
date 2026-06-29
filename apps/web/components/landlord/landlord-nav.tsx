'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Building2, Shield, Users, Banknote, Menu, Receipt, CreditCard, AlertTriangle, FileText, Wallet, Wrench, Settings, MessageSquare, BarChart3 } from 'lucide-react'
import { motion } from 'framer-motion'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { UnreadMessagesBadge } from '@/components/shared/unread-messages-badge'

const TABS = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/properties', icon: Building2, label: 'Properties' },
  { href: '/staff', icon: Shield, label: 'Caretaker' },
  { href: '/tenants', icon: Users, label: 'Tenants' },
  { href: '/rent/invoices', icon: Banknote, label: 'Finances' },
]

const MENU_SECTIONS = [
  {
    label: 'Finance',
    items: [
      { href: '/rent/invoices', label: 'Invoices', icon: Receipt },
      { href: '/rent/payments', label: 'Payments', icon: CreditCard },
      { href: '/rent/arrears', label: 'Arrears', icon: AlertTriangle },
      { href: '/rent/ledger', label: 'Ledger', icon: FileText },
      { href: '/expenses', label: 'Expenses', icon: Wallet },
      { href: '/reports', label: 'Reports', icon: BarChart3 },
      { href: '/billing', label: 'Subscription', icon: CreditCard },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/messages', label: 'Messages', icon: MessageSquare },
      { href: '/maintenance', label: 'Maintenance', icon: Wrench },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]

export function LandlordNav() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  // Check if any menu item is active
  const isMenuActive = MENU_SECTIONS.some(sec => 
    sec.items.some(item => pathname.startsWith(item.href) && !TABS.some(t => t.href === item.href))
  )

  return (
    <>
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-[min(calc(100vw-2.5rem),28rem)]">
        {/* Heavy glass blur backdrop */}
        <div className="absolute inset-0 bg-card/80 backdrop-blur-xl rounded-[1.75rem] shadow-xl shadow-black/10 dark:shadow-black/40 border border-border/60" />
        
        <div className="relative flex items-center justify-around p-2">
          {TABS.map((t) => {
            const active = pathname === t.href || (pathname.startsWith(`${t.href}/`) && t.href !== '/dashboard')
            const Icon = t.icon
            
            return (
              <Link
                key={t.href}
                href={t.href}
                className="relative py-2.5 px-2 sm:px-3 rounded-2xl transition-all duration-300 tap-highlight-transparent group flex flex-col items-center flex-1"
              >
                {active && !menuOpen && (
                  <motion.div
                    layoutId="landlord-active-tab"
                    className="absolute inset-0 bg-violet-600 dark:bg-violet-500 rounded-2xl shadow-md shadow-violet-500/20"
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}
                
                <div className="relative z-10 flex flex-col items-center gap-1">
                  <Icon className={`w-[1.125rem] h-[1.125rem] transition-colors duration-300 ${
                    active && !menuOpen
                      ? 'text-white' 
                      : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                  }`} />
                  <span className={`text-[9px] font-bold tracking-wide transition-colors duration-300 ${
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
            className="relative py-2.5 px-2 sm:px-3 rounded-2xl transition-all duration-300 tap-highlight-transparent group flex flex-col items-center flex-1"
          >
            {isMenuActive || menuOpen ? (
               <motion.div
                 layoutId="landlord-active-tab"
                 className="absolute inset-0 bg-violet-600 dark:bg-violet-500 rounded-2xl shadow-md shadow-violet-500/20"
                 transition={{ type: "spring", stiffness: 350, damping: 25 }}
               />
            ) : null}
            
            <div className="relative z-10 flex flex-col items-center gap-1">
              <Menu className={`w-[1.125rem] h-[1.125rem] transition-colors duration-300 ${
                isMenuActive || menuOpen
                  ? 'text-white' 
                  : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
              }`} />
              <span className={`text-[9px] font-bold tracking-wide transition-colors duration-300 ${
                isMenuActive || menuOpen
                  ? 'text-white/90' 
                  : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
              }`}>
                Menu
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
                          <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                            active 
                              ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30' 
                              : 'bg-muted text-foreground group-hover:bg-violet-100 group-hover:text-violet-600 dark:group-hover:bg-violet-900/30 dark:group-hover:text-violet-400'
                          }`}>
                            <Icon className="w-5 h-5" />
                            {item.href === '/messages' && <UnreadMessagesBadge />}
                          </div>
                          <span className={`text-[10px] font-semibold text-center ${active ? 'text-violet-600 dark:text-violet-400' : 'text-muted-foreground'}`}>
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
