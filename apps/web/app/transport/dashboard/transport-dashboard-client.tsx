'use client'

import Link from 'next/link'
import {
  Bus, Users, MapPin, Activity, Navigation,
  ChevronRight, CheckCircle2, Clock, AlertCircle
} from 'lucide-react'

const fmtTime = (ts: string) => new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
const fmtDate = (ts: string) => new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })

const LOG_STATUS: Record<string, { icon: any; color: string; bg: string }> = {
  boarded: { icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  departed: { icon: Navigation, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  arrived: { icon: Activity, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  absent: { icon: AlertCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
}

export function TransportDashboardClient({
  stats, recentLogs, routes, studentRoutes, schoolId
}: {
  stats: { activeRoutes: number; totalCapacity: number; boardedToday: number }
  recentLogs: any[]
  routes: any[]
  studentRoutes: any[]
  schoolId: string
}) {
  const today = new Date().toDateString()
  const todayLogs = recentLogs.filter(l => new Date(l.timestamp).toDateString() === today)

  return (
    <div className="space-y-6 pb-24">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-cyan-700 via-blue-700 to-cyan-900 rounded-3xl p-6 overflow-hidden text-white shadow-xl">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-blue-300/10 blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
              <Bus className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Transport Control</h1>
              <p className="text-cyan-200 text-sm">Fleet routes and student boarding</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Active Routes', value: stats.activeRoutes },
              { label: 'Total Capacity', value: stats.totalCapacity },
              { label: 'Boarded Today', value: stats.boardedToday },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl px-3 py-3 text-center">
                <p className="text-2xl font-extrabold text-white">{s.value}</p>
                <p className="text-[10px] text-cyan-200 font-semibold uppercase tracking-wide mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Manage Routes', href: '/transport/routes', icon: MapPin, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-900/20', border: 'border-cyan-100 dark:border-cyan-800/30' },
          { label: 'Log Boarding', href: '/transport/logs', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-800/30' },
          { label: 'Fleet', href: '/transport/fleet', icon: Bus, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-100 dark:border-blue-800/30' },
          { label: 'Assigned Students', href: '/transport/routes', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-100 dark:border-purple-800/30' },
        ].map((a, i) => {
          const Icon = a.icon
          return (
            <Link key={i} href={a.href}
              className={`flex flex-col items-center gap-2 p-4 ${a.bg} border ${a.border} rounded-2xl hover:scale-[1.02] transition-all text-center`}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-slate-900 shadow-sm">
                <Icon className={`w-5 h-5 ${a.color}`} />
              </div>
              <span className="text-xs font-semibold text-foreground">{a.label}</span>
            </Link>
          )
        })}
      </div>

      {/* Routes overview */}
      {routes.length > 0 && (
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bus className="w-4 h-4 text-cyan-500" />
              <h2 className="font-bold text-foreground">Active Routes</h2>
            </div>
            <Link href="/transport/routes" className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 flex items-center gap-1">
              Manage <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {routes.slice(0, 5).map((route: any, i: number) => {
              const assigned = studentRoutes.filter(sr => sr.route_id === route.id).length
              const pct = route.capacity > 0 ? Math.min(100, (assigned / route.capacity) * 100) : 0
              return (
                <div key={i} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/60 dark:hover:bg-slate-900/20 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center shrink-0">
                    <Bus className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-sm text-foreground">{route.name}</p>
                      <span className="text-xs text-muted-foreground">{assigned}/{route.capacity || '—'} students</span>
                    </div>
                    {route.capacity > 0 && (
                      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${pct >= 90 ? 'bg-red-400' : pct >= 70 ? 'bg-amber-400' : 'bg-cyan-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                    {route.vehicle_plate && (
                      <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                        <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">{route.vehicle_plate}</span>
                        {route.driver_name && <span>· {route.driver_name}</span>}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Live Boarding Feed */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-500" />
          <h2 className="font-bold text-foreground">Today's Boarding Log</h2>
          <span className="ml-auto text-xs text-muted-foreground">{todayLogs.length} events</span>
        </div>

        {todayLogs.length === 0 ? (
          <div className="text-center py-10">
            <Clock className="w-7 h-7 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No boarding activity logged today.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {todayLogs.slice(0, 8).map((log: any, i: number) => {
              const cfg = LOG_STATUS[log.status] || LOG_STATUS.boarded
              const Icon = cfg.icon
              return (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/60 dark:hover:bg-slate-900/20 transition-colors">
                  <div className={`w-8 h-8 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">
                      {log.students?.first_name} {log.students?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Route: {routes.find(r => r.id === log.route_id)?.name || '—'} · {log.notes || ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">{fmtTime(log.timestamp)}</p>
                    <span className={`text-[10px] font-bold capitalize ${cfg.color}`}>{log.status}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
