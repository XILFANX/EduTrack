import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Root page — resolves the user's role and routes them to the correct portal.
export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, school_id')
    .eq('id', user.id)
    .single()

  // No profile yet — first-time signup, go to onboarding
  if (!profile) redirect('/onboarding')

  // Role-based routing
  switch (profile.role) {
    case 'admin':
      redirect('/admin/dashboard')
    case 'principal':
      if (!profile.school_id) redirect('/onboarding')
      redirect('/dashboard')
    case 'class_teacher':
    case 'subject_teacher':
      redirect('/teacher/dashboard')
    case 'bursar':
      redirect('/bursar/dashboard')
    case 'librarian':
      redirect('/library/dashboard')
    case 'storekeeper':
      redirect('/store/dashboard')
    case 'transport_matron':
      redirect('/transport/dashboard')
    case 'parent':
      redirect('/parent/dashboard')
    default:
      redirect('/onboarding')
  }
}
