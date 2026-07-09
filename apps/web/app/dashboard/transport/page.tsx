import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Bus, MapPin, Plus, Users } from 'lucide-react'
import Link from 'next/link'

export default async function TransportOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('school_id').eq('id', user.id).single()
  if (!profile?.school_id) return null

  // Fetch vehicles and routes from transport portal tables
  const { data: vehiclesRaw } = await supabase
    .from('transport_vehicles')
    .select('id, plate_number, make, capacity, status')
    .eq('school_id', profile.school_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const { data: routesRaw } = await supabase
    .from('transport_routes')
    .select('id, name, area_covered, estimated_fare')
    .eq('school_id', profile.school_id)
    .is('deleted_at', null)
    .order('name')

  const vehicles = (vehiclesRaw as any[]) || []
  const routes = (routesRaw as any[]) || []
  const fleetCount = vehicles.length
  const routeCount = routes.length
  const activeVehicles = vehicles.filter((v: any) => v.status === 'active').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transport</h1>
          <p className="text-sm text-muted-foreground mt-1">Fleet management and route overview.</p>
        </div>
        <Link
          href="/transport/dashboard"
          className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          Full Portal →
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Vehicles', value: fleetCount, icon: Bus, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
          { label: 'Active', value: activeVehicles, icon: Bus, color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' },
          { label: 'Routes', value: routeCount, icon: MapPin, color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          )
        })}
      </div>

      {/* Fleet Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold text-foreground flex items-center gap-2"><Bus className="w-4 h-4 text-slate-500" /> Fleet</h2>
          <Link href="/transport/fleet" className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Vehicle
          </Link>
        </div>
        {!vehicles || vehicles.length === 0 ? (
          <div className="p-10 text-center">
            <Bus className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500">No vehicles registered yet.</p>
            <p className="text-xs text-slate-400 mt-1">Head to the Transport portal to add your fleet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3">Plate</th>
                  <th className="px-6 py-3">Make</th>
                  <th className="px-6 py-3">Capacity</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {vehicles.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-3 font-mono font-medium text-foreground">{v.plate_number}</td>
                    <td className="px-6 py-3 text-muted-foreground">{v.make || '—'}</td>
                    <td className="px-6 py-3 text-muted-foreground">{v.capacity ? `${v.capacity} seats` : '—'}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${v.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                        {v.status ?? 'Unknown'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Routes Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold text-foreground flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-500" /> Routes</h2>
          <Link href="/transport/routes" className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Route
          </Link>
        </div>
        {!routes || routes.length === 0 ? (
          <div className="p-10 text-center">
            <MapPin className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500">No routes defined yet.</p>
            <p className="text-xs text-slate-400 mt-1">Head to the Transport portal to define bus routes.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3">Route Name</th>
                  <th className="px-6 py-3">Area Covered</th>
                  <th className="px-6 py-3">Est. Fare</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {routes.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-3 font-medium text-foreground">{r.name}</td>
                    <td className="px-6 py-3 text-muted-foreground">{r.area_covered || '—'}</td>
                    <td className="px-6 py-3 text-muted-foreground">{r.estimated_fare ? `KES ${Number(r.estimated_fare).toLocaleString()}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
