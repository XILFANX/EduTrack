import React from 'react'
import Link from 'next/link'
import { Info, AlertTriangle, Monitor, ArrowRight } from 'lucide-react'

export interface Heading {
  id: string
  title: string
}

export function parseMarkdown(content: string): { elements: React.ReactNode[], headings: Heading[] } {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  const headings: Heading[] = []
  let listItems: React.ReactNode[] = []
  
  const pushList = () => {
    if (listItems.length > 0) {
      elements.push(<ul className="list-none space-y-3 mb-8 ml-2" key={`list-${elements.length}`}>{listItems}</ul>)
      listItems = []
    }
  }

  const generateId = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('# ')) {
      pushList()
      elements.push(<h1 key={i} className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mt-4 mb-8 tracking-tight">{line.substring(2)}</h1>)
    } else if (line.startsWith('## ')) {
      pushList()
      const title = line.substring(3)
      const id = generateId(title)
      headings.push({ id, title })
      elements.push(<h2 id={id} key={i} className="text-2xl font-bold text-slate-900 dark:text-white mt-12 mb-6 scroll-mt-24">{title}</h2>)
    } else if (line.startsWith('> DRAFT')) {
      pushList()
      elements.push(
        <div key={i} className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 dark:bg-orange-950/30 dark:border-orange-800/50 dark:text-orange-300 text-sm mb-8 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>{line.substring(2)}</div>
        </div>
      )
    } else if (line.startsWith('> Note:') || line.startsWith('> Tip:')) {
      pushList()
      elements.push(
        <div key={i} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 dark:bg-slate-900/50 dark:border-slate-800 dark:text-slate-300 text-sm mb-8 flex items-start gap-3 shadow-sm">
          <Info className="w-5 h-5 shrink-0 text-violet-600 dark:text-violet-400 mt-0.5" />
          <div className="leading-relaxed"><strong className="text-violet-700 dark:text-violet-300">Note:</strong> {line.substring(line.indexOf(':') + 1).trim()}</div>
        </div>
      )
    } else if (line.startsWith('> Warning:')) {
      pushList()
      elements.push(
        <div key={i} className="p-5 rounded-2xl bg-red-50 border border-red-100 text-red-900 dark:bg-red-950/30 dark:border-red-900/30 dark:text-red-200 text-sm mb-8 flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
          <div className="leading-relaxed"><strong className="text-red-700 dark:text-red-400">Warning:</strong> {line.substring(line.indexOf(':') + 1).trim()}</div>
        </div>
      )
    } else if (line.match(/^\d+\.\s/)) {
      listItems.push(
        <li key={i} className="flex gap-4 text-slate-700 dark:text-slate-300">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-xs font-bold flex items-center justify-center mt-0.5">
            {line.match(/^\d+/)?.[0]}
          </span>
          <span className="leading-relaxed flex-1">{line.replace(/^\d+\.\s/, '').replace(/\*\*/g, '')}</span>
        </li>
      )
    } else if (line.startsWith('- ')) {
      listItems.push(
        <li key={i} className="flex gap-4 text-slate-700 dark:text-slate-300">
          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 mt-2.5"></span>
          <span className="leading-relaxed flex-1">{line.substring(2).replace(/\*\*/g, '')}</span>
        </li>
      )
    } else if (line.includes('[SCREENSHOT:')) {
      pushList()
      const desc = line.replace('[SCREENSHOT: ', '').replace(']', '')
      elements.push(
        <div key={i} className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden mb-10 mt-6">
          <div className="h-10 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400 dark:bg-red-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-amber-400 dark:bg-amber-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-green-400 dark:bg-green-500/50"></div>
            </div>
          </div>
          <div className="h-48 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 bg-slate-50/50 dark:bg-slate-900/50 p-6 text-center">
            <Monitor className="w-10 h-10 mb-3 opacity-50 text-violet-500" />
            <span className="text-sm font-medium">{desc}</span>
          </div>
        </div>
      )
    } else if (line.startsWith('**Q:')) {
      pushList()
      elements.push(<p key={i} className="font-semibold text-slate-900 dark:text-white mt-8 mb-2 text-lg">{line.replace('**Q: ', 'Q: ').replace(/\*\*/g, '')}</p>)
    } else if (line.startsWith('A:')) {
      pushList()
      elements.push(<p key={i} className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">{line.replace('A: ', '')}</p>)
    } else if (line.trim() !== '') {
      pushList()
      let content = line
      const linkRegex = /\[Link:\s([^\]]+)\]/g
      if (linkRegex.test(content)) {
        const parts = content.split(linkRegex)
        elements.push(
          <p key={i} className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed text-lg">
            {parts.map((part, idx) => {
              if (part.startsWith('/')) {
                // Smart link behavior: Direct unauthenticated users to signup when hitting a protected portal route
                const isProtectedRoute = part.startsWith('/dashboard') || part.startsWith('/tenant') || part.startsWith('/caretaker') || part.startsWith('/admin')
                const href = isProtectedRoute ? `/signup?next=${encodeURIComponent(part)}` : part
                
                return (
                  <Link key={idx} href={href} className="inline-flex items-center gap-1 text-violet-600 dark:text-violet-400 font-medium hover:text-violet-700 dark:hover:text-violet-300 transition-colors bg-violet-50 dark:bg-violet-500/10 px-2 py-0.5 rounded-md mx-1">
                    {part}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )
              }
              return part.replace(/\*\*/g, '')
            })}
          </p>
        )
      } else {
        elements.push(<p key={i} className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed text-lg">{content.replace(/\*\*/g, '')}</p>)
      }
    }
  }
  pushList()
  return { elements, headings }
}
