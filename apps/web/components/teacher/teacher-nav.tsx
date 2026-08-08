'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ClipboardList, PenTool, Users, BookOpen, MessageSquare, CalendarDays } from 'lucide-react'
import { motion } from 'framer-motion'

const CLASS_TEACHER_NAV = [
  { label: 'Home',       href: '/teacher/dashboard',  icon: Home          },
  { label: 'Attendance', href: '/teacher/attendance', icon: ClipboardList },
  { label: 'Grades',     href: '/teacher/grades',     icon: PenTool       },
  { label: 'Timetable',  href: '/teacher/timetable',  icon: CalendarDays  },
  { label: 'Students',   href: '/teacher/students',   icon: Users         },
  { label: 'Messages',   href: '/teacher/messages',   icon: MessageSquare },
]

const SUBJECT_TEACHER_NAV = [
  { label: 'Home',        href: '/teacher/dashboard', icon: Home          },
  { label: 'My Subjects', href: '/teacher/subjects',  icon: BookOpen      },
  { label: 'Grades',      href: '/teacher/grades',    icon: PenTool       },
  { label: 'Timetable',   href: '/teacher/timetable', icon: CalendarDays  },
  { label: 'Messages',    href: '/teacher/messages',  icon: MessageSquare },
]

export function TeacherNav({ role }: { role: string }) {
  const pathname = usePathname()
  const NAV_ITEMS = role === 'subject_teacher' ? SUBJECT_TEACHER_NAV : CLASS_TEACHER_NAV

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-[min(calc(100vw-2rem),34rem)]">
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
                  layoutId="teacher-active-tab"
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
