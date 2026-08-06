'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Terminal, Code2 } from 'lucide-react'

export function DocsHeaderNav({ accent = 'blue' }: { accent?: 'violet' | 'blue' }) {
  const pathname = usePathname()
  const isCodebase = pathname === '/admin/docs/codebase'

  const activePill =
    accent === 'violet'
      ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/30'
      : 'bg-cyan-600 text-white shadow-md shadow-cyan-500/30'

  const inactivePill =
    accent === 'violet'
      ? 'text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20'
      : 'text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20'

  return (
    <div className="flex flex-1 items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-4 ml-2">
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
        <Link
          href="/admin/docs"
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
            !isCodebase ? activePill : inactivePill
          }`}
        >
          <Terminal className="w-4 h-4" />
          internal_docs
        </Link>

        <Link
          href="/admin/docs/codebase"
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
            isCodebase ? activePill : inactivePill
          }`}
        >
          <Code2 className="w-4 h-4" />
          codebase
        </Link>
      </div>
    </div>
  )
}
