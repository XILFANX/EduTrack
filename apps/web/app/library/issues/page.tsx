import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { IssuesClient } from './issues-client'

export default async function LibraryIssuesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return null

  // Fetch all issues with student and book info
  const { data: issues } = await supabase
    .from('library_issues')
    .select(`
      id,
      borrow_date,
      due_date,
      return_date,
      status,
      fine_amount,
      students ( id, first_name, last_name, admission_number ),
      library_books ( id, title, isbn )
    `)
    .eq('school_id', profile.school_id)
    .order('borrow_date', { ascending: false })

  const issuesList = (issues as any[]) || []

  return <IssuesClient issues={issuesList} />
}
