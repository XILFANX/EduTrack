'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { devGuides } from './docs-config'

export function DesktopDocsSidebar() {
  const pathname = usePathname()
  
  // Hide this sidebar when viewing the codebase explorer
  if (pathname === '/admin/docs/codebase') {
    return null
  }

  return (
    <aside className="hidden lg:block w-72 shrink-0 py-8 px-6 border-r border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20 overflow-y-auto">
      <nav className="space-y-8">
        {devGuides.map((group) => (
          <div key={group.category}>
            <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-xs tracking-widest uppercase">
              [{group.category}]
            </h3>
            <ul className="space-y-1.5">
              {group.items.map((guide) => {
                const Icon = guide.icon ?? ChevronRight
                const href = `/admin/docs/${guide.slug}`
                const isActive = pathname === href
                return (
                  <li key={guide.slug}>
                    <Link
                      href={href}
                      className={`flex items-center gap-3 px-3 py-2 text-sm rounded border transition-all group ${
                        isActive 
                          ? 'bg-slate-100 border-slate-200 dark:bg-slate-800/80 dark:border-slate-700 text-cyan-600 dark:text-cyan-400'
                          : 'border-transparent hover:bg-slate-100 hover:border-slate-200 dark:hover:bg-slate-800/50 dark:hover:border-slate-700 hover:text-cyan-600 dark:hover:text-cyan-400 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'}`} />
                      <span className="truncate">{guide.title}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}
