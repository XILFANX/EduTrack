'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ChevronRight, GraduationCap } from 'lucide-react'

interface ClassInfo {
  id: string
  name: string
  countLabel?: string
  studentCount?: number
}

interface Props {
  title: string
  description: string
  classes: ClassInfo[]
  /** 
   * Base path for navigation.
   * - If it ends with "?class" (e.g. "/dashboard/timetable?class"),
   *   routing uses query params: ?class=id
   * - Otherwise uses path routing: basePath/id
   */
  basePath: string
  actionButton?: React.ReactNode
}

export function ClassDirectory({ title, description, classes, basePath, actionButton }: Props) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = classes.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))

  function handleClassClick(classId: string) {
    // Detect query-param style basePath (ends with ?class)
    if (basePath.includes('?')) {
      // e.g. "/dashboard/timetable?class" → "/dashboard/timetable?class=<id>"
      router.push(`${basePath}=${classId}`)
    } else {
      // path routing
      router.push(`${basePath}/${classId}`)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
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
          className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/20 text-foreground focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm placeholder:text-muted-foreground"
        />
      </div>

      {classes.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 mx-auto flex items-center justify-center mb-4">
            <GraduationCap className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">No classes found</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
            You need to create classes first before managing this section.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No classes matched your search.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {filtered.map(cls => (
                <button
                  key={cls.id}
                  onClick={() => handleClassClick(cls.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 active:bg-slate-100 dark:active:bg-slate-800 transition-colors group text-left"
                >
                  <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 group-hover:border-blue-500/30 transition-colors">
                    <span className="text-sm font-bold text-blue-400">
                      {cls.name.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{cls.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cls.countLabel || 'Manage module'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden sm:block text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      Open
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-600 group-hover:text-blue-500 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
