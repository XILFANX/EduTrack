import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BookOpen, BookMarked, AlertCircle, Plus } from 'lucide-react'
import Link from 'next/link'

export default async function LibraryOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('school_id').eq('id', user.id).single()
  if (!profile?.school_id) return null

  // Fetch books using real columns
  const { data: booksRaw } = await supabase
    .from('library_books')
    .select('id, title, author, isbn, status')
    .eq('school_id', profile.school_id)
    .order('title')
    .limit(20)

  const books = (booksRaw as any[]) || []

  // Fetch active issues (cast to any[] to avoid complex join inference errors)
  const { data: issuesRaw } = await supabase
    .from('library_issues')
    .select('id, due_date, returned_at, status, students(first_name, last_name), library_books(title)')
    .eq('school_id', profile.school_id)
    .is('returned_at', null)
    .order('due_date', { ascending: true })
    .limit(10)

  const checkouts = (issuesRaw as any[]) || []

  const totalBooks = books.length
  const overdue = checkouts.filter(c => new Date(c.due_date) < new Date()).length
  const checkedOut = checkouts.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Library</h1>
          <p className="text-sm text-muted-foreground mt-1">Book inventory and borrowing overview.</p>
        </div>
        <Link
          href="/library/dashboard"
          className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          Full Portal →
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Books', value: totalBooks, icon: BookOpen, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
          { label: 'Checked Out', value: checkedOut, icon: BookMarked, color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' },
          { label: 'Overdue', value: overdue, icon: AlertCircle, color: overdue > 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          )
        })}
      </div>

      {/* Books Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-500" /> Book Inventory
          </h2>
          <Link href="/library/books" className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Book
          </Link>
        </div>
        {books.length === 0 ? (
          <div className="p-10 text-center">
            <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500">No books catalogued yet.</p>
            <p className="text-xs text-slate-400 mt-1">Head to the Library portal to add your catalogue.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Author</th>
                  <th className="px-6 py-3">ISBN</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {books.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-3 font-medium text-foreground">{b.title}</td>
                    <td className="px-6 py-3 text-muted-foreground">{b.author || '—'}</td>
                    <td className="px-6 py-3 text-muted-foreground font-mono text-xs">{b.isbn || '—'}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        b.status === 'available'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : b.status === 'issued'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {b.status ?? 'Unknown'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Active Checkouts */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <BookMarked className="w-4 h-4 text-slate-500" /> Active Checkouts
          </h2>
        </div>
        {checkouts.length === 0 ? (
          <div className="p-10 text-center">
            <BookMarked className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500">No active checkouts.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3">Book</th>
                  <th className="px-6 py-3">Due Date</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {checkouts.map(c => {
                  const student = c.students as any
                  const book = c.library_books as any
                  const isOverdue = new Date(c.due_date) < new Date()
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-3 font-medium text-foreground">
                        {student?.first_name} {student?.last_name}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">{book?.title || '—'}</td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {new Date(c.due_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          isOverdue
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                          {isOverdue ? 'Overdue' : 'On Loan'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
