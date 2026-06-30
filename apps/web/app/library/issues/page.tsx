import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeftRight } from 'lucide-react'

export default async function LibraryIssues() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileResult } = await supabase
    .from('users').select('school_id').eq('id', user.id).single()
  const profile = profileResult as any
  if (!profile?.school_id) return null

  const { data: issues } = await supabase
    .from('library_issues')
    .select('id, issued_at, due_date, returned_at, status, students(first_name, last_name, admission_number), library_books(title)')
    .eq('school_id', profile.school_id)
    .order('issued_at', { ascending: false })

  const allIssues = (issues as any[]) || []
  const active = allIssues.filter((i: any) => !i.returned_at)
  const overdue = active.filter((i: any) => new Date(i.due_date) < new Date())

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Book Issues</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {active.length} out · {overdue.length} overdue
        </p>
      </div>

      {/* Overdue section */}
      {overdue.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wider mb-2">Overdue</h2>
          <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/40 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {overdue.map((issue: any) => (
              <div key={issue.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{issue.library_books?.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {issue.students?.first_name} {issue.students?.last_name} · {issue.students?.admission_number}
                  </p>
                  <p className="text-xs text-red-500 mt-0.5">
                    Due: {new Date(issue.due_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  Overdue
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All issues */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">All Records</h2>
        {allIssues.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <ArrowLeftRight className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No books have been issued yet.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {allIssues.map((issue: any) => {
              const isOverdue = !issue.returned_at && new Date(issue.due_date) < new Date()
              return (
                <div key={issue.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{issue.library_books?.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {issue.students?.first_name} {issue.students?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Issued: {new Date(issue.issued_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })} ·
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
                    {issue.returned_at ? 'Returned' : isOverdue ? 'Overdue' : 'Issued'}
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
