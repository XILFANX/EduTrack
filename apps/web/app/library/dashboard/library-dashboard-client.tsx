'use client'

import Link from 'next/link'
import {
  Library, BookMarked, BookOpen, AlertOctagon, ChevronRight,
  Search, ScanBarcode, Clock, CheckCircle2, XCircle
} from 'lucide-react'

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

function daysSince(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

interface BorrowedBook {
  id: string
  student?: { first_name: string; last_name: string; classes?: { name: string } | null }
  book?: { title: string; isbn: string | null }
  issued_at: string
  due_date: string | null
  status: string
}

export function LibraryDashboardClient({ stats, borrowedBooks }: {
  stats: { totalBooks: number; availableBooks: number; borrowedBooks: number; lostBooks: number }
  borrowedBooks: BorrowedBook[]
}) {
  return (
    <div className="space-y-6 pb-24">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-900 rounded-3xl p-6 overflow-hidden text-white shadow-xl">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-indigo-400/10 blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
              <Library className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Library Management</h1>
              <p className="text-indigo-200 text-sm">Book inventory and lending records</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Books', value: stats.totalBooks, color: 'bg-white/10' },
              { label: 'Available', value: stats.availableBooks, color: 'bg-emerald-400/20' },
              { label: 'Borrowed', value: stats.borrowedBooks, color: 'bg-amber-400/20' },
              { label: 'Lost/Missing', value: stats.lostBooks, color: 'bg-red-400/20' },
            ].map((s, i) => (
              <div key={i} className={`${s.color} backdrop-blur-sm rounded-2xl px-3 py-3 text-center`}>
                <p className="text-2xl font-extrabold text-white">{s.value}</p>
                <p className="text-[10px] text-indigo-200 font-semibold uppercase tracking-wide mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick search bar (visual) */}
      <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3 shadow-sm">
        <Search className="w-5 h-5 text-muted-foreground shrink-0" />
        <input
          type="text"
          placeholder="Search for a book by title, author, or ISBN..."
          className="flex-1 bg-transparent text-foreground placeholder-muted-foreground text-sm outline-none"
        />
        <div className="flex items-center gap-2 shrink-0">
          <ScanBarcode className="w-4 h-4 text-indigo-500" />
          <span className="text-xs text-muted-foreground hidden sm:block">Scan ISBN</span>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Issue Book', href: '/library/issues', icon: BookMarked, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-100 dark:border-indigo-800/30' },
          { label: 'Return Book', href: '/library/issues', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-800/30' },
          { label: 'All Books', href: '/library/books', icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-100 dark:border-purple-800/30' },
          { label: 'Overdue', href: '/library/issues', icon: AlertOctagon, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-100 dark:border-red-800/30' },
        ].map((a, i) => {
          const Icon = a.icon
          return (
            <Link key={i} href={a.href}
              className={`flex flex-col items-center gap-2 p-4 ${a.bg} border ${a.border} rounded-2xl hover:scale-[1.02] transition-all text-center group`}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-slate-900 shadow-sm">
                <Icon className={`w-5 h-5 ${a.color}`} />
              </div>
              <span className="text-xs font-semibold text-foreground">{a.label}</span>
            </Link>
          )
        })}
      </div>

      {/* Currently Borrowed */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <h2 className="font-bold text-foreground">Currently Borrowed</h2>
          </div>
          <Link href="/library/issues" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            View all <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {borrowedBooks.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No books currently borrowed.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {borrowedBooks.slice(0, 8).map((issue, i) => {
              const days = daysSince(issue.issued_at)
              const isOverdue = issue.due_date && new Date(issue.due_date) < new Date()
              return (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/60 dark:hover:bg-slate-900/30 transition-colors">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isOverdue ? 'bg-red-50 dark:bg-red-900/20' : 'bg-indigo-50 dark:bg-indigo-900/20'}`}>
                    <BookMarked className={`w-4 h-4 ${isOverdue ? 'text-red-500' : 'text-indigo-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{issue.book?.title || 'Unknown Book'}</p>
                    <p className="text-xs text-muted-foreground">
                      {issue.student?.first_name} {issue.student?.last_name} · {issue.student?.classes?.name || '—'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">{days}d out</p>
                    {isOverdue
                      ? <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">Overdue</span>
                      : issue.due_date
                        ? <span className="text-[10px] text-muted-foreground">Due {fmtDate(issue.due_date)}</span>
                        : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
