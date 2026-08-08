import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Map, Users } from 'lucide-react'
import { AddRouteModal } from './add-route-modal'

export const dynamic = 'force-dynamic'

export default async function TransportRoutes() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileResult } = await supabase
    .from('users').select('school_id').eq('id', user.id).single()
  const profile = profileResult as any
  if (!profile?.school_id) return null

  // Fetch transport routes
  const { data: routes } = await supabase
    .from('transport_routes')
    .select('*')
    .eq('school_id', profile.school_id)
    .order('name')

  // Fetch count of students per route using the new student_routes table
  const { data: studentRoutes } = await supabase
    .from('student_routes')
    .select('route_id')
    .eq('school_id', profile.school_id)

  const allRoutes = (routes as any[]) || []
  const allStudentRoutes = (studentRoutes as any[]) || []

  // Calculate assigned students per route
  const assignedCounts = allStudentRoutes.reduce((acc, curr) => {
    acc[curr.route_id] = (acc[curr.route_id] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fleet & Routes</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage school transport routes and capacity</p>
        </div>
        <AddRouteModal schoolId={profile.school_id} />
      </div>

      {allRoutes.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/40 mx-auto flex items-center justify-center mb-4">
            <Map className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">No routes defined</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
            Click "Add Route" to start defining transport routes for the school.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allRoutes.map((route: any) => {
            const assigned = assignedCounts[route.id] || 0
            const capacity = route.capacity || 0
            const isFull = capacity > 0 && assigned >= capacity
            
            return (
              <div key={route.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                
                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Map className="w-6 h-6" />
                  </div>
                  {isFull && (
                    <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-bold uppercase tracking-wider">
                      Full
                    </span>
                  )}
                </div>

                <div className="relative z-10">
                  <h3 className="font-bold text-lg text-foreground mb-1">{route.name}</h3>
                  <div className="space-y-1.5 mb-4">
                    <p className="text-sm text-muted-foreground flex justify-between">
                      <span>Driver:</span> 
                      <span className="font-medium text-foreground">{route.driver_name || 'Unassigned'}</span>
                    </p>
                    <p className="text-sm text-muted-foreground flex justify-between">
                      <span>Vehicle:</span> 
                      <span className="font-medium text-foreground font-mono">{route.vehicle_plate || 'Unassigned'}</span>
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span className="text-sm font-medium">Assigned</span>
                    </div>
                    <div className="text-sm font-bold text-foreground">
                      {assigned} <span className="text-muted-foreground font-normal">/ {capacity > 0 ? capacity : '∞'}</span>
                    </div>
                  </div>
                  
                  {capacity > 0 && (
                    <div className="mt-3 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${isFull ? 'bg-red-500' : 'bg-blue-500'}`} 
                        style={{ width: `${Math.min((assigned / capacity) * 100, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
