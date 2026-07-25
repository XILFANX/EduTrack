'use client'

import React, { useEffect, useState } from 'react'
import { Loader2, AlertCircle, FileCode, Copy, Check, ChevronDown, ChevronUp, X } from 'lucide-react'

interface CodeViewerProps {
  repoPath: string // e.g. "XILFANX/EstateTrack/main/apps/web/app/page.tsx"
  language?: string
}

export function CodeViewer({ repoPath, language = 'typescript' }: CodeViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [code, setCode] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!isExpanded || code || error) return // Only fetch when expanded and not already loaded

    async function fetchCode() {
      try {
        setLoading(true)
        setError(null)

        const url = `https://raw.githubusercontent.com/${repoPath}`
        const headers: Record<string, string> = {}
        if (process.env.NEXT_PUBLIC_GITHUB_PAT) {
          headers['Authorization'] = `token ${process.env.NEXT_PUBLIC_GITHUB_PAT}`
        }

        const res = await fetch(url, { headers })

        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`)
        }

        setCode(await res.text())
      } catch (err: any) {
        setError(err.message || 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchCode()
  }, [repoPath, isExpanded, code, error])

  async function handleCopy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const fileName = repoPath.split('/').slice(-3).join('/')

  if (!isExpanded) {
    return (
      <button 
        onClick={() => setIsExpanded(true)}
        className="my-8 w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-slate-700 dark:text-slate-300 font-mono text-sm group shadow-sm hover:shadow"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform">
            <FileCode className="w-5 h-5" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 mb-0.5 font-bold">Source Reference</span>
            <span className="font-medium text-slate-900 dark:text-slate-200">{fileName}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block text-xs text-slate-500 uppercase tracking-widest px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">View Source</span>
          <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-violet-500 transition-colors" />
        </div>
      </button>
    )
  }

  return (
    <div className="w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl my-8 bg-[#1E1E1E] flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/50 bg-[#252526] text-xs font-mono text-zinc-400 select-none">
        <div className="flex items-center gap-3">
          <FileCode className="w-4 h-4 text-violet-400" />
          <span className="text-zinc-200 font-medium">{fileName}</span>
          <span className="px-1.5 py-0.5 rounded bg-[#333333] text-zinc-400 text-[10px] uppercase tracking-wider hidden sm:inline-block">{language}</span>
        </div>
        <div className="flex items-center gap-2">
          {code && !error && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#333333] text-zinc-300 hover:text-white hover:bg-[#444444] transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          )}
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1.5 rounded bg-[#333333] text-zinc-400 hover:text-white hover:bg-[#444444] transition-colors"
            title="Close source view"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="relative w-full bg-[#1E1E1E] min-h-[12rem]">
        {loading && (
          <div className="absolute inset-0 z-10 bg-[#1E1E1E]/80 backdrop-blur-sm flex flex-col items-center justify-center text-violet-400 font-mono text-sm gap-3">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Fetching source from GitHub...</span>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-10 bg-[#1E1E1E] p-6 flex flex-col items-center justify-center text-red-400 font-mono text-sm gap-2">
            <AlertCircle className="w-8 h-8 opacity-60 mb-2" />
            <p className="font-bold text-base text-red-300">Unable to load source code</p>
            <p className="text-xs opacity-70 bg-red-950/30 px-3 py-1.5 rounded-md mt-2">{error}</p>
          </div>
        )}

        {/* Code block — pure CSS, zero dependencies */}
        {!loading && !error && code && (
          <div className="overflow-auto max-h-[600px] text-[13px] leading-relaxed font-mono">
            <table className="w-full border-collapse">
              <tbody>
                {code.split('\n').map((line, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors group">
                    <td className="select-none w-12 pr-4 pl-4 text-right text-zinc-600 border-r border-zinc-800/50 sticky left-0 bg-[#1E1E1E] group-hover:bg-[#2A2D2E] group-hover:text-zinc-400 transition-colors">
                      {i + 1}
                    </td>
                    <td className="pl-5 pr-6 py-0 text-zinc-300 whitespace-pre">
                      {line || ' '}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
