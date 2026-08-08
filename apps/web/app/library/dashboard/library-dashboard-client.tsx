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
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 via-blue-500 to-blue-600 p-6 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[50px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
              <Library className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Library Management</h1>
              <p className="text-blue-100 text-sm">Book inventory and lending records</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Books', value: stats.totalBooks, color: 'bg-white/10' },
              { label: 'Available', value: stats.availableBooks, color: 'bg-blue-500/20' },
              { label: 'Borrowed', value: stats.borrowedBooks, color: 'bg-blue-400/20' },
              { label: 'Lost/Missing', value: stats.lostBooks, color: 'bg-blue-400/20' },
            ].map((s, i) => (
              <div key={i} className={`${s.color} backdrop-blur-sm rounded-2xl px-3 py-3 text-center`}>
                <p className="text-2xl font-extrabold text-white">{s.value}</p>
                <p className="text-[10px] text-blue-100 font-semibold uppercase tracking-wide mt-0.5">{s.label}</p>
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
          <ScanBarcode className="w-4 h-4 text-blue-600" />
          <span className="text-xs text-muted-foreground hidden sm:block">Scan ISBN</span>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 mt-2">QUICK ACTIONS</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Issue Book', sublabel: 'Lend out', href: '/library/issues', icon: BookMarked },
            { label: 'Return Book', sublabel: 'Check in', href: '/library/issues', icon: CheckCircle2 },
            { label: 'All Books', sublabel: 'Inventory', href: '/library/books', icon: BookOpen },
            { label: 'Overdue', sublabel: 'Follow ups', href: '/library/issues', icon: AlertOctagon },
          ].map((a, i) => {
            const Icon = a.icon
            return (
              <Link
                key={i}
                href={a.href}
                className="flex flex-col items-center gap-2 p-4 bg-card hover:bg-slate-50 dark:hover:bg-[#060d1a]/80 border border-border hover:border-blue-500/50 rounded-2xl hover:scale-[1.02] transition-all text-center shadow-sm group"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 group-hover:bg-blue-100 dark:group-hover:bg-cyan-800/40 transition-colors">
                  <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-center min-w-0 w-full mt-1">
                  <p className="font-bold text-xs text-foreground truncate">{a.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate hidden sm:block mt-0.5">{a.sublabel}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Currently Borrowed */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-500" />
            <h2 className="font-bold text-foreground">Currently Borrowed</h2>
          </div>
          <Link href="/library/issues" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
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
            {borrowedBooks.slice(0, 3).map((issue, i) => {
              const days = daysSince(issue.issued_at)
              const isOverdue = issue.due_date && new Date(issue.due_date) < new Date()
              return (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/60 dark:hover:bg-slate-900/30 transition-colors">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isOverdue ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                    <BookMarked className={`w-4 h-4 ${isOverdue ? 'text-red-500' : 'text-blue-600'}`} />
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
                      ? <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">Overdue</span>
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
