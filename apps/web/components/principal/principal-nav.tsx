'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, Users, BookOpen, Banknote, Menu,
  GraduationCap, Bus, Package, Settings, BarChart3,
  UserCog, Library, MessageSquare, CalendarRange, ClipboardList, HeartHandshake, FileText, CalendarDays
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'

const TABS = [
  { href: '/dashboard',          icon: Home,          label: 'Home'     },
  { href: '/dashboard/staff',    icon: UserCog,       label: 'Staff'    },
  { href: '/dashboard/parents',  icon: HeartHandshake,label: 'Parents'  },
  { href: '/dashboard/classes',  icon: GraduationCap, label: 'Classes'  },
  { href: '/dashboard/students', icon: Users,         label: 'Students' },
  { href: '/dashboard/messages', icon: MessageSquare, label: 'Msgs'     },
  { href: '/dashboard/finance',  icon: Banknote,      label: 'Finance'  },
]

const MENU_SECTIONS = [
  {
    label: 'Academic',
    items: [
      { href: '/dashboard/subjects',  label: 'Subjects',          icon: BookOpen      },
      { href: '/dashboard/library',   label: 'Library',           icon: Library       },
      { href: '/dashboard/exams',     label: 'Examinations',      icon: ClipboardList },
      { href: '/dashboard/timetable', label: 'Timetable',         icon: CalendarDays  },
      { href: '/dashboard/reports',   label: 'Report Cards',      icon: FileText      },
      { href: '/dashboard/sessions',  label: 'Academic Sessions', icon: CalendarRange },
    ],
  },
  {
    label: 'People',
    items: [
      { href: '/dashboard/parents',  label: 'Parents',  icon: HeartHandshake },
      { href: '/dashboard/messages', label: 'Messages', icon: MessageSquare  },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/dashboard/store',     label: 'Store',     icon: Package  },
      { href: '/dashboard/transport', label: 'Transport', icon: Bus      },
      { href: '/dashboard/settings',  label: 'Settings',  icon: Settings },
    ],
  },
]

export function PrincipalNav() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const isMenuActive = MENU_SECTIONS.some(sec =>
    sec.items.some(item => pathname.startsWith(item.href) && !TABS.some(t => t.href === item.href))
  )

  return (
    <>
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-[min(calc(100vw-2.5rem),30rem)]">
        <div className="absolute inset-0 bg-card/80 backdrop-blur-xl rounded-[1.75rem] shadow-xl shadow-black/10 dark:shadow-black/40 border border-border/60" />
        <div className="relative flex items-center justify-around p-2">
          {TABS.map((t) => {
            const active = pathname === t.href || (pathname.startsWith(`${t.href}/`) && t.href !== '/dashboard')
            const Icon = t.icon
            return (
              <Link
                key={t.href}
                href={t.href}
                className="relative py-2.5 px-1 rounded-2xl transition-all duration-300 group flex flex-col items-center flex-1 min-w-0"
              >
                {active && !menuOpen && (
                  <motion.div
                    layoutId="principal-active-tab"
                    className="absolute inset-0 rounded-2xl shadow-md"
                    style={{ background: 'linear-gradient(135deg, #1D6FEB 0%, #22D3EE 100%)', boxShadow: '0 4px 14px rgba(29,111,235,0.35)' }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  />
                )}
                <div className="relative z-10 flex flex-col items-center gap-1">
                  <Icon className={`w-5 h-5 stroke-[2.5] transition-colors duration-300 ${active && !menuOpen ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                    }`} />
                  <span className={`text-[9px] font-bold tracking-tight transition-colors duration-300 ${active && !menuOpen ? 'text-white/90' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                    }`}>
                    {t.label}
                  </span>
                </div>
              </Link>
            )
          })}

          <button
            onClick={() => setMenuOpen(true)}
            className="relative py-2.5 px-1 rounded-2xl transition-all duration-300 group flex flex-col items-center flex-1 min-w-0"
          >
            {(isMenuActive || menuOpen) && (
              <motion.div
                layoutId="principal-active-tab"
                className="absolute inset-0 rounded-2xl shadow-md"
                style={{ background: 'linear-gradient(135deg, #1D6FEB 0%, #22D3EE 100%)', boxShadow: '0 4px 14px rgba(29,111,235,0.35)' }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              />
            )}
            <div className="relative z-10 flex flex-col items-center gap-1">
              <Menu className={`w-5 h-5 stroke-[2.5] transition-colors duration-300 ${isMenuActive || menuOpen ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                }`} />
              <span className={`text-[9px] font-bold tracking-tight transition-colors duration-300 ${isMenuActive || menuOpen ? 'text-white/90' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                }`}>
                More
              </span>
            </div>
          </button>
        </div>
      </nav>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="bottom" className="rounded-t-[2rem] border-border bg-card/95 backdrop-blur-xl p-0 pb-28">
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
                          <div className={`relative w-14 h-14 rounded-[1.25rem] flex items-center justify-center transition-all duration-300 ${active
                              ? '-translate-y-1 text-white shadow-lg shadow-blue-500/30'
                              : 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/40 dark:to-cyan-900/20 border border-blue-100/50 dark:border-blue-800/50 text-[#1D6FEB] dark:text-[#22D3EE] group-hover:shadow-lg group-hover:shadow-blue-500/20 group-hover:-translate-y-1'
                            }`}
                            style={active ? { background: 'linear-gradient(135deg, #1D6FEB 0%, #22D3EE 100%)' } : {}}
                          >
                            <Icon className="w-7 h-7" strokeWidth={2.5} />
                          </div>
                          <span className={`text-xs font-bold text-center mt-1 transition-colors ${active ? 'text-[#1D6FEB] dark:text-[#22D3EE]' : 'text-foreground group-hover:text-[#1D6FEB]'}`}>
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
