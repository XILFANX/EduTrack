'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ChevronRight, GraduationCap } from 'lucide-react'

interface ClassInfo {
  id: string
  name: string
  countLabel?: string
}

interface Props {
  title: string
  description: string
  classes: ClassInfo[]
  basePath: string // e.g., '/dashboard/subjects'
  actionButton?: React.ReactNode
}

export function ClassDirectory({ title, description, classes, basePath, actionButton }: Props) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = classes.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{title}</h1>
          <p className="text-sm text-slate-400 mt-1">{description}</p>
        </div>
        {actionButton && <div className="shrink-0">{actionButton}</div>}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search class by name..." 
          className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-800 bg-[#0b0f19] text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
        />
      </div>

      {classes.length === 0 ? (
        <div className="text-center py-20 bg-[#121827] border border-slate-800 rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 mx-auto flex items-center justify-center mb-4">
            <GraduationCap className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-200">No classes found</h2>
          <p className="text-sm text-slate-400 max-w-sm mx-auto mt-2">
            You need to create classes first before managing this section.
          </p>
        </div>
      ) : (
        <div className="bg-[#121827] border border-slate-800 rounded-2xl overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No classes matched your search.</div>
          ) : (
            <div className="divide-y divide-slate-800/50">
              {filtered.map(cls => (
                <button
                  key={cls.id}
                  onClick={() => router.push(`${basePath}/${cls.id}`)}
                  className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-[#1a2133] transition-colors group text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                    <span className="text-sm font-bold text-blue-400">
                      {cls.name.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-200 text-sm truncate">{cls.name}</p>
                    <p className="text-xs text-slate-400">
                      {cls.countLabel || 'Manage module'}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
