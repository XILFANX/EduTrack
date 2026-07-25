'use client'

import React, { useEffect, useState } from 'react'
import { Loader2, AlertCircle, FileCode, Copy, Check } from 'lucide-react'

interface CodeViewerProps {
  repoPath: string // e.g. "XILFANX/EduTrack/main/apps/web/app/page.tsx"
  language?: string
}

export function CodeViewer({ repoPath, language = 'typescript' }: CodeViewerProps) {
  const [code, setCode] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
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
  }, [repoPath])

  async function handleCopy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="w-full h-48 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col items-center justify-center text-zinc-500 font-mono text-sm gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
        <span>Loading source from GitHub…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full bg-red-950/20 border border-red-900/50 rounded-xl p-6 flex flex-col items-center justify-center text-red-400 font-mono text-sm gap-2">
        <AlertCircle className="w-7 h-7 opacity-60" />
        <p>Unable to load source code</p>
        <p className="text-xs opacity-60">{error}</p>
      </div>
    )
  }

  const lines = code.split('\n')

  return (
    <div className="w-full rounded-xl overflow-hidden border border-zinc-800 shadow-2xl my-6 bg-[#1E1E1E]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900 text-xs font-mono text-zinc-400 select-none">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-zinc-500" />
          <span>{repoPath.split('/').slice(-3).join('/')}</span>
          <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 text-[10px] uppercase tracking-wider">{language}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-200 transition-colors"
          title="Copy to clipboard"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>

      {/* Code block — pure CSS, zero dependencies */}
      <div className="overflow-auto max-h-[600px] text-[13px] leading-relaxed font-mono">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, i) => (
              <tr key={i} className="hover:bg-white/5 transition-colors">
                <td className="select-none w-12 pr-4 pl-4 text-right text-zinc-600 border-r border-zinc-800 sticky left-0 bg-[#1E1E1E]">
                  {i + 1}
                </td>
                <td className="pl-5 pr-6 py-0 text-zinc-200 whitespace-pre">
                  {line || ' '}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
