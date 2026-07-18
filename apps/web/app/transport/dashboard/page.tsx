import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TransportDashboardClient } from './transport-dashboard-client'

export default async function TransportDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return null

  // Fetch routes and logs for the dashboard
  const [routesRes, logsRes, studentRoutesRes] = await Promise.all([
    supabase.from('transport_routes').select('*').eq('school_id', profile.school_id).order('name'),
    supabase.from('transport_logs').select('*').eq('school_id', profile.school_id).order('timestamp', { ascending: false }).limit(50),
    supabase.from('student_routes').select('route_id, students(id, first_name, last_name, admission_number)').eq('school_id', profile.school_id)
  ])

  const routes = (routesRes.data as any[]) || []
  const logs = (logsRes.data as any[]) || []
  const studentRoutes = (studentRoutesRes.data as any[]) || []

  // Metrics
  const activeRoutes = routes.length
  const totalCapacity = routes.reduce((acc, r) => acc + (r.capacity || 0), 0)
  const boardedToday = logs.filter(l => l.status === 'boarded' && new Date(l.timestamp).toDateString() === new Date().toDateString()).length

  const stats = {
    activeRoutes,
    totalCapacity,
    boardedToday
  }

  return <TransportDashboardClient stats={stats} recentLogs={logs} routes={routes} studentRoutes={studentRoutes} schoolId={profile.school_id} />
}
