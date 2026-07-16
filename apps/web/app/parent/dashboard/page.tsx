import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ParentDashboardClient } from './parent-dashboard-client'

export default async function ParentDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // In a full implementation, we would query the `student_parents` join table 
  // to get all students linked to this parent ID, and fetch their details.
  // For scaffolding purposes, we will mock this.
  
  const mockChildren = [
    { id: '1', first_name: 'John', last_name: 'Doe', admission_number: 'ADM-001', class_name: 'Form 1A' },
    { id: '2', first_name: 'Jane', last_name: 'Doe', admission_number: 'ADM-002', class_name: 'Form 3B' },
  ]

  return <ParentDashboardClient childrenList={mockChildren} />
}
