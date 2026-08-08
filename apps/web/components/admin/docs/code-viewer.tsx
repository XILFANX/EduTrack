'use client'

import React, { useEffect, useState } from 'react'
import { Loader2, AlertCircle, FileCode, Copy, Check, ChevronDown, X, ExternalLink } from 'lucide-react'

interface CodeViewerProps {
  repoPath: string
  language?: string
  standalone?: boolean
}

export function CodeViewer({ repoPath, language = 'typescript', standalone = false }: CodeViewerProps) {
  const [isExpanded, setIsExpanded] = useState(standalone)
  const [code, setCode] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
    if (standalone) setIsExpanded(true)
  }, [standalone])

  useEffect(() => {
    if (!isExpanded || code || error) return
    async function fetchCode() {
      try {
        setLoading(true)
        setError(null)
        // Fetch via the secure server-side proxy — the GitHub PAT stays on the server
        const res = await fetch(`/api/admin/github-source?path=${encodeURIComponent(repoPath)}`)
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || `Error ${res.status}: ${res.statusText}`)
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

  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
    setCode('')
    setError(null)
    setLoading(false)
  }, [repoPath])

  async function handleCopy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const fileName = repoPath.split('/').slice(-3).join('/')
  const githubUrl = `https://github.com/${repoPath.replace('/main/', '/blob/main/')}`

  if (!isExpanded && !standalone) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="my-8 w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-[#1a2744] bg-white dark:bg-[#060d1a]/80 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-slate-700 dark:text-slate-300 font-mono text-sm group shadow-sm hover:shadow"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
            <FileCode className="w-5 h-5" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 mb-0.5 font-bold">Source Reference</span>
            <span className="font-medium text-slate-900 dark:text-slate-200">{fileName}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block text-xs text-slate-500 uppercase tracking-widest px-2.5 py-1 rounded-md bg-slate-100 dark:bg-[#0d1b2e] border border-slate-200 dark:border-[#1a2744]">View Source</span>
          <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
        </div>
      </button>
    )
  }

  return (
    <div className={`w-full rounded-xl overflow-hidden border border-slate-200 dark:border-[#1a2744] shadow-xl bg-[#1E1E1E] flex flex-col ${standalone ? 'flex-1 min-h-[500px]' : 'my-8'}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/50 bg-[#252526] text-xs font-mono text-zinc-400 select-none shrink-0">
        <div className="flex items-center gap-3">
          <FileCode className="w-4 h-4 text-blue-500" />
          <span className="text-zinc-200 font-medium truncate max-w-[200px] sm:max-w-none">{fileName}</span>
          <span className="px-1.5 py-0.5 rounded bg-[#333333] text-zinc-400 text-[10px] uppercase tracking-wider hidden sm:inline-block">{language}</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#333333] text-zinc-300 hover:text-white hover:bg-[#444444] transition-colors"
            title="Open in GitHub"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          {code && !error && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#333333] text-zinc-300 hover:text-white hover:bg-[#444444] transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-blue-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          )}
          {!standalone && (
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1.5 rounded bg-[#333333] text-zinc-400 hover:text-white hover:bg-[#444444] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className={`relative w-full bg-[#1E1E1E] ${standalone ? 'flex-1 overflow-auto' : 'min-h-[12rem]'}`}>
        {loading && (
          <div className="absolute inset-0 z-10 bg-[#1E1E1E]/90 backdrop-blur-sm flex flex-col items-center justify-center text-blue-500 font-mono text-sm gap-3">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Fetching live source from GitHub...</span>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 z-10 bg-[#1E1E1E] p-6 flex flex-col items-center justify-center text-red-400 font-mono text-sm gap-2">
            <AlertCircle className="w-8 h-8 opacity-60 mb-2" />
            <p className="font-bold text-base text-blue-600">Unable to load source code</p>
            <p className="text-xs opacity-70 bg-orange-950/30 px-3 py-1.5 rounded-md mt-2">{error}</p>
          </div>
        )}
        {!loading && !error && code && (
          <div className="overflow-auto text-[13px] leading-relaxed font-mono">
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
