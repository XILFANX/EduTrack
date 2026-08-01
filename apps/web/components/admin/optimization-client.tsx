'use client'
import { UX } from '@/lib/ux'

import { useState } from 'react'
import { purgeCategory, getOptimizationStats, RetentionCategory } from '@/app/actions/optimization'
import {
  Loader2, DatabaseZap, MessageSquare, Bell, FileText,
  Search, UserPlus, RefreshCw, Trash2, ShieldCheck,
  AlertTriangle, UserX, Clock
} from 'lucide-react'

interface DormantStats { warning_phase: number, final_phase: number, deletion_phase: number }
interface Stats {
  communications: number
  notifications: number
  audit_logs: number
  search_queries_log: number
  invitations: number
  policies: Record<RetentionCategory, number>
  dormant: DormantStats
}

const DATA_SECTIONS: { key: RetentionCategory, title: string, Icon: any, desc: string, color: string, bg: string }[] = [
  { key: 'communications', title: 'Chat Messages', Icon: MessageSquare, desc: 'Historical chat across all portals.', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20' },
  { key: 'notifications', title: 'Notifications', Icon: Bell, desc: 'System & activity notifications.', color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/20' },
  { key: 'audit_logs', title: 'Activity Logs', Icon: FileText, desc: 'Audit trail & compliance records.', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20' },
  { key: 'search_queries_log', title: 'Search Analytics', Icon: Search, desc: 'Portal search logs.', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20' },
  { key: 'invitations', title: 'Used Invitations', Icon: UserPlus, desc: 'Accepted or expired invitations.', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20' },
]

const DORMANT_PHASES = [
  { key: 'warning_phase' as const, label: 'Warning Phase', sublabel: '60–84 days inactive', Icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/10', border: 'border-orange-200 dark:border-orange-800/40' },
  { key: 'final_phase' as const, label: 'Final Notice', sublabel: '85–89 days inactive', Icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/10', border: 'border-orange-200 dark:border-orange-800/40' },
  { key: 'deletion_phase' as const, label: 'Pending Deletion', sublabel: '90+ days inactive', Icon: UserX, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/10', border: 'border-orange-200 dark:border-orange-800/40' },
]

export function OptimizationClient({ initialStats }: { initialStats: Stats }) {
  const [stats, setStats] = useState<Stats>(initialStats)
  const [purging, setPurging] = useState<RetentionCategory | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [purgingAll, setPurgingAll] = useState(false)

  const totalDormant = stats.communications + stats.notifications + stats.audit_logs + stats.search_queries_log + stats.invitations

  const refreshStats = async () => {
    setRefreshing(true)
    const result = await getOptimizationStats()
    if (result.success && result.stats) setStats(result.stats as Stats)
    setRefreshing(false)
  }

  const handlePurge = async (category: RetentionCategory) => {
    const section = DATA_SECTIONS.find(s => s.key === category)!
    if (!confirm(`Permanently delete all ${section.title.toLowerCase()} older than ${stats.policies[category]} days? This cannot be undone.`)) return
    setPurging(category)
    const result = await purgeCategory(category)
    if (!result.success) UX.errorModal(`Failed to purge: ${result.error}`)
    else { UX.successModal({ title: `${section.title} purged` }); await refreshStats() }
    setPurging(null)
  }

  const handlePurgeAll = async () => {
    if (!confirm('Permanently delete ALL dormant records across all categories?')) return
    setPurgingAll(true)
    for (const s of DATA_SECTIONS) await purgeCategory(s.key)
    UX.successModal({ title: 'All dormant records purged' })
    await refreshStats()
    setPurgingAll(false)
  }

  return (
    <div className="space-y-10">
      {/* ── Summary Banner ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-6 text-white shadow-xl">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -bottom-12 -left-6 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
              <DatabaseZap className="w-7 h-7" />
            </div>
            <div>
              <p className="text-blue-200 text-sm font-medium">Total dormant records</p>
              <p className="text-5xl font-bold tracking-tight">{totalDormant.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={refreshStats} disabled={refreshing} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button onClick={handlePurgeAll} disabled={purgingAll || totalDormant === 0} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 text-sm font-bold disabled:opacity-50">
              {purgingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {purgingAll ? 'Purging...' : 'Purge All'}
            </button>
          </div>
        </div>
        {totalDormant === 0 && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <ShieldCheck className="w-4 h-4 text-blue-300" />
            <span className="text-blue-300 font-medium">Database is fully optimized.</span>
          </div>
        )}
      </div>

      {/* ── Dormant Accounts ─────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-1">Dormant Account Lifecycle</h2>
        <p className="text-sm text-muted-foreground mb-4">Accounts are automatically warned at 60 days, given a final notice at 85 days, and deleted at 90 days of inactivity.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {DORMANT_PHASES.map(({ key, label, sublabel, Icon, color, bg, border }) => (
            <div key={key} className={`rounded-2xl border ${border} ${bg} p-5`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className={`text-3xl font-bold ${color}`}>{stats.dormant[key]}</p>
              </div>
              <p className="font-semibold text-foreground text-sm">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Data Category Cards ───────────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-1">Data Retention</h2>
        <p className="text-sm text-muted-foreground mb-4">Records older than the retention period are eligible for purging. Use the button to immediately delete them.</p>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {DATA_SECTIONS.map(({ key, title, Icon, desc, color, bg }) => {
            const count = stats[key]
            const isLoading = purging === key || purgingAll
            return (
              <div key={key} className="group bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md transition-all duration-300">
                <div className="flex items-start justify-between">
                  <div className={`w-11 h-11 rounded-xl ${bg} ${color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${count > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>{count.toLocaleString()}</p>
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">rows</p>
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-foreground text-[15px] mb-1">{title}</p>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{desc}</p>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-border/60 mt-auto">
                  <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                    <span>Retention: <strong className="text-foreground">{stats.policies[key]}d</strong></span>
                  </div>
                  <button
                    onClick={() => handlePurge(key)}
                    disabled={isLoading || count === 0}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                      count === 0 ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-muted hover:bg-destructive/10 hover:text-destructive border border-transparent text-foreground'
                    } disabled:opacity-50`}
                  >
                    {isLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Purging...</> : <><Trash2 className="w-3.5 h-3.5" /> Purge</>}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
