import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Library, BookOpen, ArrowLeftRight, AlertTriangle } from 'lucide-react'

export default async function LibraryDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileResult } = await supabase
    .from('users').select('school_id').eq('id', user.id).single()
  const profile = profileResult as any
  if (!profile?.school_id) return null

  const { data: books } = await supabase
    .from('library_books')
    .select('id, status')
    .eq('school_id', profile.school_id)

  const allBooks = (books as any[]) || []
  const totalBooks = allBooks.length
  const issued = allBooks.filter((b: any) => b.status === 'issued').length
  const available = allBooks.filter((b: any) => b.status === 'available').length
  const lost = allBooks.filter((b: any) => b.status === 'lost').length

  // Recent issues
  const { data: recentIssues } = await supabase
    .from('library_issues')
    .select('id, issued_at, due_date, returned_at, status, students(first_name, last_name), library_books(title)')
    .eq('school_id', profile.school_id)
    .order('issued_at', { ascending: false })
    .limit(10)

  const issues = (recentIssues as any[]) || []
  const overdue = issues.filter((i: any) =>
    !i.returned_at && new Date(i.due_date) < new Date()
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Library</h1>
        <p className="text-sm text-muted-foreground mt-1">Book inventory and issue tracking.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-violet-700 dark:text-violet-400">{totalBooks}</p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Total Books</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-emerald-600">{available}</p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Available</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{issued}</p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Issued Out</p>
        </div>
        <div className={`${lost > 0 ? 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'} border rounded-2xl p-4 text-center`}>
          <p className={`text-3xl font-bold ${lost > 0 ? 'text-red-600' : 'text-foreground'}`}>{lost}</p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Lost/Written Off</p>
        </div>
      </div>

      {/* Overdue alert */}
      {overdue.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-orange-800 dark:text-orange-400 text-sm">
              {overdue.length} Overdue Return{overdue.length > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-500 mt-0.5">
              Flag these students to add a library fine to their next invoice.
            </p>
          </div>
        </div>
      )}

      {/* Recent issues */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Recent Issues</h2>
        {issues.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <ArrowLeftRight className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No books issued yet.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {issues.map((issue: any) => {
              const isOverdue = !issue.returned_at && new Date(issue.due_date) < new Date()
              return (
                <div key={issue.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {issue.library_books?.title ?? 'Unknown Book'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {issue.students?.first_name} {issue.students?.last_name} ·
                      Due: {new Date(issue.due_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    issue.returned_at
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : isOverdue
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {issue.returned_at ? 'Returned' : isOverdue ? 'Overdue' : 'Out'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
