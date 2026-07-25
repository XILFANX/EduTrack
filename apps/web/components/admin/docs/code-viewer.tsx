'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { Loader2, AlertCircle, FileCode } from 'lucide-react'

const SyntaxHighlighter = dynamic(
  () => import('react-syntax-highlighter').then((mod) => ({ default: mod.Prism as any })),
  { ssr: false }
)

interface CodeViewerProps {
  repoPath: string // e.g. "XILFANX/EduTrack/main/apps/web/app/page.tsx"
  language?: string
}

export function CodeViewer({ repoPath, language = 'typescript' }: CodeViewerProps) {
  const [code, setCode] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCode() {
      try {
        setLoading(true)
        setError(null)
        
        // Use the raw GitHub API
        const url = `https://raw.githubusercontent.com/${repoPath}`
        
        const res = await fetch(url, {
          // If a PAT is provided via environment, use it to access private repos
          headers: process.env.NEXT_PUBLIC_GITHUB_PAT ? {
            Authorization: `token ${process.env.NEXT_PUBLIC_GITHUB_PAT}`
          } : undefined
        })

        if (!res.ok) {
          throw new Error(`Failed to fetch code: ${res.status} ${res.statusText}`)
        }

        const text = await res.text()
        setCode(text)
      } catch (err: any) {
        setError(err.message || 'An unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchCode()
  }, [repoPath])

  if (loading) {
    return (
      <div className="w-full h-64 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col items-center justify-center text-zinc-500 font-mono text-sm">
        <Loader2 className="w-6 h-6 animate-spin mb-3 text-zinc-400" />
        Loading source from GitHub...
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full bg-red-950/20 border border-red-900/50 rounded-xl p-6 flex flex-col items-center justify-center text-red-400 font-mono text-sm">
        <AlertCircle className="w-8 h-8 mb-3 opacity-50" />
        <p>Unable to load source code</p>
        <p className="text-xs opacity-70 mt-1">{error}</p>
      </div>
    )
  }

  return (
    <div className="w-full rounded-xl overflow-hidden border border-zinc-800 shadow-2xl my-6 bg-[#1E1E1E]">
      <div className="flex items-center px-4 py-2 border-b border-zinc-800 bg-zinc-900 text-xs font-mono text-zinc-400 select-none">
        <FileCode className="w-4 h-4 mr-2 text-zinc-500" />
        {repoPath.split('/').slice(-3).join('/')}
      </div>
      <div className="text-[13px] leading-relaxed max-h-[600px] overflow-auto custom-scrollbar">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1.5rem',
            background: 'transparent',
          }}
          showLineNumbers
          lineNumberStyle={{
            minWidth: '2.5em',
            paddingRight: '1em',
            color: '#858585',
            textAlign: 'right'
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}
