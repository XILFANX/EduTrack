import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LibraryDashboardClient } from './library-dashboard-client'

export const dynamic = 'force-dynamic'

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

  const [booksRes, issuesRes] = await Promise.all([
    supabase.from('library_books').select('id, status').eq('school_id', profile.school_id),
    supabase
      .from('library_issues')
      .select('id, status, issued_at, due_date, students(first_name, last_name, classes(name)), library_books(title, isbn)')
      .eq('school_id', profile.school_id)
      .order('issued_at', { ascending: false })
      .limit(50)
  ])

  const books = (booksRes.data as any[]) || []
  const issues = (issuesRes.data as any[]) || []

  const totalBooks = books.length
  const availableBooks = books.filter(b => b.status === 'available').length
  const borrowedBooks = issues.filter(i => i.status === 'borrowed').length
  const lostBooks = issues.filter(i => i.status === 'lost').length

  const stats = { totalBooks, availableBooks, borrowedBooks, lostBooks }

  return (
    <LibraryDashboardClient
      stats={stats}
      borrowedBooks={issues.filter(i => i.status === 'borrowed').map(i => ({
        id: i.id,
        student: i.students,
        book: i.library_books,
        issued_at: i.issued_at,
        due_date: i.due_date,
        status: i.status,
      }))}
    />
  )
}
