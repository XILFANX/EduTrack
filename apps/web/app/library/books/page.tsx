import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BookOpen, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function LibraryBooks() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileResult } = await supabase
    .from('users').select('school_id').eq('id', user.id).single()
  const profile = profileResult as any
  if (!profile?.school_id) return null

  const { data: books } = await supabase
    .from('library_books')
    .select('id, title, author, isbn, status, created_at')
    .eq('school_id', profile.school_id)
    .order('title')

  const allBooks = (books as any[]) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Books</h1>
          <p className="text-sm text-muted-foreground mt-1">{allBooks.length} books in library</p>
        </div>
        {/* Add Book — wire up modal in next iteration */}
        <Button className="bg-violet-600 hover:bg-violet-700 gap-2">
          <Plus className="w-4 h-4" />
          Add Book
        </Button>
      </div>

      {allBooks.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/40 mx-auto flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-violet-600 dark:text-violet-400" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">No books catalogued yet</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
            Click "Add Book" to start building your library inventory.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-muted-foreground uppercase tracking-wider text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Author</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {allBooks.map((book: any) => (
                  <tr key={book.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">{book.title}</p>
                      {book.isbn && <p className="text-xs text-muted-foreground font-mono">{book.isbn}</p>}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{book.author ?? '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        book.status === 'available'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : book.status === 'issued'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {book.status === 'available' ? 'Available' : book.status === 'issued' ? 'Issued' : 'Lost'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
