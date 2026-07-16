import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ParentDashboardClient } from './parent-dashboard-client'

export const dynamic = 'force-dynamic'

export default async function ParentDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return null

  // Fetch all students linked to this parent
  const { data: links } = await supabase
    .from('student_parents' as any)
    .select(`
      student_id,
      students (
        id,
        first_name,
        last_name,
        admission_number,
        class_id,
        photo_url,
        status,
        classes ( name )
      )
    `)
    .eq('parent_id', user.id)

  const childrenList = ((links as any[]) || []).map((l: any) => ({
    id: l.students?.id,
    first_name: l.students?.first_name,
    last_name: l.students?.last_name,
    admission_number: l.students?.admission_number,
    class_name: l.students?.classes?.name || 'Unassigned',
    photo_url: l.students?.photo_url || null,
    status: l.students?.status || 'Active',
  })).filter((c: any) => c.id)

  // Fetch latest fee payments for these students
  const studentIds = childrenList.map((c: any) => c.id)
  let recentPayments: any[] = []
  if (studentIds.length > 0) {
    const { data: payments } = await supabase
      .from('fee_payments')
      .select('amount, payment_date, student_id, mpesa_receipt')
      .eq('school_id', profile.school_id)
      .in('student_id', studentIds)
      .order('payment_date', { ascending: false })
      .limit(5)
    recentPayments = (payments as any[]) || []
  }

  return <ParentDashboardClient childrenList={childrenList} recentPayments={recentPayments} />
}
