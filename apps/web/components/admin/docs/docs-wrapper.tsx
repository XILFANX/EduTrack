'use client'

import React from 'react'
import { FileCode, BookOpen, GitBranch } from 'lucide-react'
import { useDocsContext } from './docs-context'
import { CodeViewer } from './code-viewer'
import type { Heading } from '@/lib/markdown'

interface DocsWrapperProps {
  elements: React.ReactNode[]
  headings: Heading[]
  repoPaths: string[]
  accent?: 'violet' | 'blue'
}

export function DocsWrapper({ elements, headings, repoPaths, accent = 'blue' }: DocsWrapperProps) {
  const { activeTab: _activeTab, activeRepoPath, setTab, openRepo } = useDocsContext()
  const activeTab = _activeTab as string

  const accentActive =
    accent === 'violet'
      ? 'bg-blue-600 text-white shadow-blue-500/30'
      : 'bg-blue-600 text-white shadow-blue-500/30'

  const accentHover =
    accent === 'violet'
      ? 'hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
      : 'hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'

  const accentIndicator =
    accent === 'violet' ? 'bg-blue-500' : 'bg-blue-500'

  const displayRepoPath = activeRepoPath ?? repoPaths[0] ?? null

  return (
    <div className="flex flex-col h-full gap-0">
      {/* ── Tab bar ── */}
      <div className="flex items-center gap-1 mb-6 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 w-fit">
        <button
          onClick={() => setTab('docs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
            activeTab === 'docs'
              ? `${accentActive} shadow-md`
              : `text-slate-500 dark:text-slate-400 ${accentHover}`
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Documentation
        </button>
        {repoPaths.length > 0 && (
          <button
            onClick={() => setTab('repo')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'repo'
                ? `${accentActive} shadow-md`
                : `text-slate-500 dark:text-slate-400 ${accentHover}`
            }`}
          >
            <GitBranch className="w-4 h-4" />
            Source Files
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              activeTab === 'repo'
                ? 'bg-white/20 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              {repoPaths.length}
            </span>
          </button>
        )}
      </div>

      {/* ── Content area ── */}
      <div className="flex xl:gap-16 lg:gap-10 pb-20 font-sans flex-1">
        {activeTab === 'docs' ? (
          <>
            <article className="flex-1 min-w-0 max-w-4xl">
              <div className="prose prose-invert prose-blue max-w-none dark">
                {elements}
              </div>
              <div className="mt-20 pt-8 border-t border-zinc-800 flex items-center justify-between text-sm text-zinc-500 font-mono">
                <p>INTERNAL_CONFIDENTIAL</p>
                <p>Updated: {new Date().toISOString().split('T')[0]}</p>
              </div>
            </article>

            <div className="hidden xl:block w-64 shrink-0 font-mono">
              <div className="sticky top-24">
                <h4 className="font-bold text-white mb-4 text-xs tracking-widest uppercase">[TOC]</h4>
                {headings.length > 0 ? (
                  <ul className="space-y-2">
                    {headings.map((heading) => (
                      <li key={heading.id}>
                        <a
                          href={`#${heading.id}`}
                          className="text-xs text-zinc-500 hover:text-blue-400 transition-colors line-clamp-2"
                        >
                          &gt; {heading.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-zinc-600 italic">No headings found.</p>
                )}

                {repoPaths.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-zinc-800/60">
                    <h4 className="font-bold text-zinc-500 mb-3 text-xs tracking-widest uppercase">Source Files</h4>
                    <ul className="space-y-1.5">
                      {repoPaths.map((rp) => {
                        const shortName = rp.split('/').slice(-2).join('/')
                        const isActive = activeRepoPath === rp && _activeTab === 'repo'
                        return (
                          <li key={rp}>
                            <button
                              onClick={() => openRepo(rp)}
                              className={`w-full text-left flex items-center gap-2 text-[11px] px-2 py-1.5 rounded-md transition-all ${
                                isActive
                                  ? `${accentIndicator} text-white`
                                  : `text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50`
                              }`}
                            >
                              <FileCode className="w-3 h-3 shrink-0" />
                              <span className="truncate font-mono">{shortName}</span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            {repoPaths.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {repoPaths.map((rp) => {
                  const shortName = rp.split('/').slice(-2).join('/')
                  const isActive = displayRepoPath === rp
                  return (
                    <button
                      key={rp}
                      onClick={() => openRepo(rp)}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-mono border transition-all ${
                        isActive
                          ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                          : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                      }`}
                    >
                      <FileCode className="w-3 h-3" />
                      {shortName}
                    </button>
                  )
                })}
              </div>
            )}

            {displayRepoPath ? (
              <CodeViewer key={displayRepoPath} repoPath={displayRepoPath} standalone />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-32 text-zinc-600 font-mono">
                <GitBranch className="w-12 h-12 mb-4 opacity-30" />
                <p className="text-sm">No source files referenced in this document.</p>
                <p className="text-xs mt-2 opacity-60">Add a <code>[CODE: owner/repo/branch/path]</code> tag to the markdown.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
