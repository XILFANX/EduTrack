import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LibraryDashboardClient } from './library-dashboard-client'

export default async function LibraryDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return null

  // Fetch quick stats
  const [booksRes, issuesRes] = await Promise.all([
    supabase.from('library_books').select('id, status').eq('school_id', profile.school_id),
    supabase.from('library_issues').select('status').eq('school_id', profile.school_id)
  ])

  const books = (booksRes.data as any[]) || []
  const issues = (issuesRes.data as any[]) || []

  const totalBooks = books.length
  const availableBooks = books.filter(b => b.status === 'available').length
  const borrowedBooks = issues.filter(i => i.status === 'borrowed').length
  const lostBooks = issues.filter(i => i.status === 'lost').length

  const stats = {
    totalBooks,
    availableBooks,
    borrowedBooks,
    lostBooks
  }

  return <LibraryDashboardClient stats={stats} />
}
