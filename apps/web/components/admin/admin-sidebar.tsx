'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { 
  LayoutDashboard, 
  GraduationCap, 
  Shield, 
  MessageSquare, 
  BookOpen,
  LogOut,
  DatabaseZap
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Overview', Icon: LayoutDashboard },
  { href: '/admin/schools', label: 'Schools', Icon: GraduationCap },
  { href: '/admin/messages', label: 'Messages', Icon: MessageSquare },
  { href: '/admin/docs', label: 'Developer Docs', Icon: BookOpen },
  { href: '/admin/admins', label: 'Team', Icon: Shield },
  { href: '/admin/optimization', label: 'System Health', Icon: DatabaseZap },
]

export function AdminSidebar() {
  const pathname = usePathname()
  
  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-slate-950 border-r border-slate-800 flex flex-col z-50">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/50 shrink-0">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 relative rounded-full overflow-hidden shrink-0 border border-slate-700 bg-white">
            <Image src="/logo.png" alt="EduTrack" fill className="object-cover" />
          </div>
          <div>
            <span className="font-bold text-white text-sm block leading-tight">EduTrack</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">
              Platform Admin
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-4 no-scrollbar flex flex-col gap-1">
        <div className="px-2 mb-2">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Main Menu</p>
        </div>
        
        {NAV_ITEMS.map((t) => {
          const active = pathname === t.href || (pathname.startsWith(`${t.href}/`) && t.href !== '/admin/dashboard')
          const Icon = t.Icon
          
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                active 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-500 group-hover:text-slate-400'}`} />
              {t.label}
            </Link>
          )
        })}
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-800/50">
        <Link
          href="/api/auth/signout"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-900 hover:text-red-400 transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0 text-slate-500" />
          Sign Out
        </Link>
      </div>
    </aside>
  )
}
