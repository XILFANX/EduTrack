import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Truck, Users, MapPin, Plus, MoreVertical } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function TransportDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileResult } = await supabase
    .from('users').select('school_id').eq('id', user.id).single()
  const profile = profileResult as any
  if (!profile?.school_id) return null

  const { data: routes } = await supabase
    .from('bus_routes')
    .select('*')
    .eq('school_id', profile.school_id)
    .order('route_name')

  const totalRoutes = routes?.length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transport</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage school bus routes and fleet.</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700 gap-2">
          <Plus className="w-4 h-4" />
          Add Route
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-slate-200 dark:border-slate-800 bg-teal-50 dark:bg-teal-950/20">
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-600 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalRoutes}</p>
              <p className="text-xs text-muted-foreground font-medium">Active Routes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalRoutes}</p>
              <p className="text-xs text-muted-foreground font-medium">Vehicles</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Routes List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Bus Routes</h2>
        {!routes || routes.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
            <div className="w-16 h-16 rounded-2xl bg-teal-100 dark:bg-teal-900/40 mx-auto flex items-center justify-center mb-4">
              <Truck className="w-8 h-8 text-teal-600 dark:text-teal-400" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">No routes yet</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
              Add your first bus route to start tracking transport operations.
            </p>
          </div>
        ) : (
          (routes as any[]).map(route => (
            <Card key={route.id} className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 text-teal-600 flex items-center justify-center">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{route.route_name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {route.driver_name || 'No driver'} · {route.vehicle_registration || 'No reg'}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-slate-400">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
