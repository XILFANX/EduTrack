'use client'

import React from 'react'
import { FileCode } from 'lucide-react'
import { useDocsContext } from './docs-context'

interface CodeLinkProps {
  repoPath: string
  accent?: 'violet' | 'blue'
}

export function CodeLink({ repoPath, accent = 'blue' }: CodeLinkProps) {
  const { openRepo } = useDocsContext()

  const shortName = repoPath.split('/').slice(-2).join('/')

  const colorCls =
    accent === 'violet'
      ? 'border-blue-200 dark:border-blue-800/60 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:border-blue-400 dark:hover:border-blue-600'
      : 'border-blue-200 dark:border-blue-800/60 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:border-blue-400 dark:hover:border-blue-600'

  return (
    <button
      onClick={() => openRepo(repoPath)}
      className={`inline-flex items-center gap-2 my-6 w-full px-4 py-3 rounded-xl border font-mono text-sm transition-all duration-200 group shadow-sm hover:shadow ${colorCls}`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${
        accent === 'violet' ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-blue-100 dark:bg-blue-900/40'
      }`}>
        <FileCode className="w-4 h-4" />
      </div>
      <div className="flex flex-col items-start min-w-0">
        <span className="text-[10px] uppercase tracking-widest opacity-60 font-bold mb-0.5">Source Reference</span>
        <span className="font-semibold truncate text-sm">{shortName}</span>
      </div>
      <span className="ml-auto text-[10px] px-2 py-1 rounded border border-current opacity-60 uppercase tracking-wider shrink-0">
        View in Codebase →
      </span>
    </button>
  )
}
