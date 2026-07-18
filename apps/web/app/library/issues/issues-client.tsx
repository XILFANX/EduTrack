'use client'

import { useState } from 'react'
import { Search, BookOpen, Plus, CheckCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IssueBookModal } from './issue-book-modal'
import { ReturnBookButton } from './return-book-button'

export function IssuesClient({ 
  issues, 
  schoolId, 
  availableStudents, 
  availableBooks 
}: { 
  issues: any[]
  schoolId: string
  availableStudents: any[]
  availableBooks: any[]
}) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredIssues = issues.filter(issue => {
    const q = searchQuery.toLowerCase()
    const st = issue.students
    const bk = issue.library_books
    if (!st || !bk) return false
    return (
      st.first_name.toLowerCase().includes(q) ||
      st.last_name.toLowerCase().includes(q) ||
      st.admission_number.toLowerCase().includes(q) ||
      bk.title.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Circulation Desk</h1>
          <p className="text-sm text-muted-foreground mt-1">Track borrowed books and returns.</p>
        </div>
        <IssueBookModal 
          schoolId={schoolId} 
          availableStudents={availableStudents} 
          availableBooks={availableBooks} 
        />
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by student, admission number, or book title..." 
          className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
        />
      </div>

      {filteredIssues.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/40 mx-auto flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">No records found</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
            Click Issue Book to record a new checkout.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-muted-foreground uppercase tracking-wider text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">Book</th>
                  <th className="px-6 py-4">Borrower</th>
                  <th className="px-6 py-4">Borrowed Date</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredIssues.map((issue) => {
                  const isOverdue = new Date(issue.due_date) < new Date() && issue.status === 'borrowed'
                  return (
                    <tr key={issue.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">{issue.library_books?.title}</p>
                        <p className="text-xs text-muted-foreground font-mono">{issue.library_books?.isbn || 'No ISBN'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">{issue.students?.first_name} {issue.students?.last_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{issue.students?.admission_number}</p>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(issue.borrow_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={isOverdue ? 'text-red-600 font-semibold' : 'text-muted-foreground'}>
                          {new Date(issue.due_date).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider flex items-center w-fit gap-1 ${
                          issue.status === 'returned' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          issue.status === 'lost' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          isOverdue ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {issue.status === 'borrowed' && isOverdue ? 'Overdue' : issue.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {issue.status === 'borrowed' ? (
                          <ReturnBookButton 
                            issueId={issue.id} 
                            bookId={issue.library_books?.id}
                            schoolId={schoolId}
                            studentId={issue.students?.id}
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
