'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Terminal, Code2 } from 'lucide-react'

export function DocsHeaderNav({ accent = 'blue' }: { accent?: 'violet' | 'blue' }) {
  const pathname = usePathname()
  const isCodebase = pathname === '/admin/docs/codebase'

  const activeClass = accent === 'violet' 
    ? 'text-violet-600 dark:text-violet-400' 
    : 'text-blue-600 dark:text-blue-400'

  return (
    <div className="flex flex-1 items-center gap-6 border-l border-slate-200 dark:border-slate-700 pl-4 ml-2">
      <Link
        href="/admin/docs"
        className={`flex items-center gap-2 transition-colors ${
          !isCodebase ? activeClass : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
        }`}
      >
        <Terminal className="w-5 h-5" />
        <span className="font-bold tracking-tight">internal_docs</span>
      </Link>

      <Link
        href="/admin/docs/codebase"
        className={`flex items-center gap-2 transition-colors ${
          isCodebase ? activeClass : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
        }`}
      >
        <Code2 className="w-5 h-5" />
        <span className="font-bold tracking-tight">codebase</span>
      </Link>
    </div>
  )
}
