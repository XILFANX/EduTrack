'use client'

import { useState } from 'react'
import { Bus, Users, Map, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logTransport } from '../actions'

interface Route {
  id: string
  name: string
  driver_name: string | null
  vehicle_plate: string | null
  capacity: number
}

interface StudentRoute {
  route_id: string
  students: {
    id: string
    first_name: string
    last_name: string
    admission_number: string
  } | null
}

export function TransportDashboardClient({ 
  stats, 
  recentLogs, 
  routes, 
  studentRoutes, 
  schoolId 
}: { 
  stats: any
  recentLogs: any[]
  routes: Route[]
  studentRoutes: StudentRoute[]
  schoolId: string
}) {
  const [selectedRouteId, setSelectedRouteId] = useState<string>(routes[0]?.id || '')
  const [loggingStudentId, setLoggingStudentId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'boarded' | 'dropped' | 'absent'>('all')

  const currentRoute = routes.find(r => r.id === selectedRouteId)
  
  // Find students assigned to the selected route
  const assignedStudents = studentRoutes
    .filter(sr => sr.route_id === selectedRouteId && sr.students)
    .map(sr => sr.students!)

  async function handleLogStatus(studentId: string, status: 'boarded' | 'dropped' | 'absent') {
    setLoggingStudentId(studentId)
    const res = await logTransport({
      schoolId,
      studentId,
      routeId: selectedRouteId,
      status
    })
    setLoggingStudentId(null)
    
    if (res.error) {
      alert(res.error)
    }
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-[40px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Bus className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black">Transport Dashboard</h1>
            <p className="text-sm text-blue-100">Real-time overview of school fleet and boarding logs</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <Map className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground font-medium mb-1">Active Routes</p>
          <h3 className="text-2xl font-bold text-foreground">{stats.activeRoutes}</h3>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
              <Bus className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground font-medium mb-1">Total Fleet Capacity</p>
          <h3 className="text-2xl font-bold text-foreground">{stats.totalCapacity}</h3>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground font-medium mb-1">Boarded Today</p>
          <h3 className="text-2xl font-bold text-foreground">{stats.boardedToday}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Manifest Logging */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">Daily Manifest Logging</h2>
                <p className="text-sm text-muted-foreground">Select a route to log student boarding status.</p>
              </div>

              {/* Route Selector */}
              <select
                value={selectedRouteId}
                onChange={(e) => setSelectedRouteId(e.target.value)}
                className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full sm:w-56 shrink-0"
              >
                <option value="" disabled>Select Route...</option>
                {routes.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            {currentRoute && (
              <div className="mb-6 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Bus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">{currentRoute.name}</h3>
                    <p className="text-xs text-muted-foreground">Vehicle Plate: <span className="font-mono text-foreground font-semibold">{currentRoute.vehicle_plate || 'N/A'}</span></p>
                  </div>
                </div>
                <div className="text-xs sm:text-right">
                  <p className="text-muted-foreground">Driver</p>
                  <p className="font-bold text-foreground">{currentRoute.driver_name || 'N/A'}</p>
                </div>
              </div>
            )}

            {/* Students Manifest List */}
            {assignedStudents.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <Users className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">No students assigned to this route</p>
                <p className="text-xs text-muted-foreground mt-1">Assign students in the Fleet & Routes module.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignedStudents.map((student) => {
                  const isLogging = loggingStudentId === student.id
                  return (
                    <div 
                      key={student.id} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-100 dark:border-slate-800 rounded-2xl hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center font-bold text-sm">
                          {student.first_name[0]}{student.last_name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-foreground">{student.first_name} {student.last_name}</p>
                          <p className="text-xs text-muted-foreground">Adm: <span className="font-mono">{student.admission_number}</span></p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button 
                          onClick={() => handleLogStatus(student.id, 'boarded')}
                          disabled={isLogging}
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-lg text-xs font-semibold hover:bg-emerald-50 hover:text-emerald-700 border-slate-200 dark:border-slate-800"
                        >
                          {isLogging ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                          Boarded
                        </Button>
                        <Button 
                          onClick={() => handleLogStatus(student.id, 'dropped')}
                          disabled={isLogging}
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-lg text-xs font-semibold hover:bg-blue-50 hover:text-blue-700 border-slate-200 dark:border-slate-800"
                        >
                          Dropped
                        </Button>
                        <Button 
                          onClick={() => handleLogStatus(student.id, 'absent')}
                          disabled={isLogging}
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-lg text-xs font-semibold hover:bg-red-50 hover:text-red-700 border-slate-200 dark:border-slate-800"
                        >
                          Absent
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Boarding Activity */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm h-[500px] flex flex-col">
          <h2 className="text-lg font-bold text-foreground mb-4">Recent Boarding Activity</h2>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {recentLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No boarding logs recorded yet.</p>
            ) : (
              recentLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0 last:pb-0 gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      log.status === 'boarded' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' :
                      log.status === 'dropped' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' :
                      'bg-red-100 text-red-600 dark:bg-red-900/30'
                    }`}>
                      <Bus className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{log.status}</p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">Route ID: {log.route_id.substring(0,8)}...</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground shrink-0">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
