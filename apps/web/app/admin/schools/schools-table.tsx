'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Globe, Search, Filter } from 'lucide-react'

type SchoolData = {
  id: string
  name: string
  domain: string | null
  subscription_tier: string
  curriculum_type: string
  created_at: string | null
  studentCount: number
}

export function SchoolsTable({ initialData }: { initialData: SchoolData[] }) {
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState<string>('all')

  const filteredData = initialData.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || (s.domain && s.domain.toLowerCase().includes(search.toLowerCase()))
    const matchesTier = tierFilter === 'all' || s.subscription_tier === tierFilter
    return matchesSearch && matchesTier
  })

  return (
    <div className="bg-white dark:bg-slate-900/50 border border-border rounded-3xl shadow-sm overflow-hidden flex flex-col">
      {/* ── Filters ── */}
      <div className="p-4 md:p-5 border-b border-border bg-slate-50/50 dark:bg-slate-800/20 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search schools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all font-medium"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 mr-1" />
          {['all', 'premium', 'standard', 'basic'].map(tier => (
            <button
              key={tier}
              onClick={() => setTierFilter(tier)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                tierFilter === tier 
                  ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400' 
                  : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table Header ── */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-border bg-muted/20">
        <div className="col-span-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">School Name</div>
        <div className="col-span-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Enrollment</div>
        <div className="col-span-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Tier</div>
        <div className="col-span-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Joined On</div>
      </div>

      {/* ── Table Body ── */}
      {!filteredData || filteredData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
            <Globe className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-foreground font-extrabold text-lg">No schools found</p>
          <p className="text-sm font-medium text-muted-foreground mt-1 max-w-sm">
            {initialData.length > 0 ? 'Try adjusting your search or filters to find what you are looking for.' : 'There are currently no active schools on the platform.'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {filteredData.map((s) => (
            <Link
              href={`/admin/schools/${s.id}`}
              key={s.id}
              className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group items-center cursor-pointer"
            >
              <div className="md:col-span-5 flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 text-lg font-black flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                  {s.name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground truncate transition-colors group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                      {s.name}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground font-semibold truncate mt-0.5">{s.domain || 'no-domain'}</p>
                </div>
              </div>
              
              <div className="md:col-span-2 flex items-center justify-between md:justify-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest md:hidden">Enrollment</span>
                <div className="flex flex-col items-end md:items-center">
                  <span className="text-base font-black text-foreground">{s.studentCount}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Students</span>
                </div>
              </div>

              <div className="md:col-span-3 flex items-center justify-between md:justify-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest md:hidden">Tier</span>
                <span className={`text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-wider shadow-sm ${
                  s.subscription_tier === 'premium' ? 'bg-cyan-50 text-cyan-600 border border-cyan-200 dark:bg-cyan-900/20 dark:border-cyan-800/50' :
                  s.subscription_tier === 'standard' ? 'bg-cyan-50 text-cyan-600 border border-cyan-200 dark:bg-cyan-900/20 dark:border-cyan-800/50' :
                  'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                }`}>
                  {s.subscription_tier}
                </span>
              </div>

              <div className="md:col-span-2 flex items-center justify-between md:justify-end">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest md:hidden">Joined</span>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold text-foreground group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    {s.created_at ? new Date(s.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }) : '—'}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {s.created_at ? new Date(s.created_at).getFullYear() : ''}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
