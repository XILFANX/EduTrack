'use client'

import { Book, CheckCircle, Clock, AlertTriangle } from 'lucide-react'

export function LibraryDashboardClient({ stats }: { stats: any }) {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-[40px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Book className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black">Library Overview</h1>
            <p className="text-sm text-blue-100">Monitor book inventory and circulation</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Books */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <Book className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground font-medium mb-1">Total Books</p>
          <h3 className="text-2xl font-bold text-foreground">{stats.totalBooks}</h3>
        </div>

        {/* Available */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground font-medium mb-1">Available on Shelves</p>
          <h3 className="text-2xl font-bold text-foreground">{stats.availableBooks}</h3>
        </div>

        {/* Borrowed */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground font-medium mb-1">Currently Borrowed</p>
          <h3 className="text-2xl font-bold text-foreground">{stats.borrowedBooks}</h3>
        </div>

        {/* Lost / Overdue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-red-500/10 dark:bg-red-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
          <div className="flex items-center justify-between mb-4 relative">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground font-medium mb-1 relative">Lost Books</p>
          <h3 className="text-2xl font-bold text-foreground relative">{stats.lostBooks}</h3>
        </div>
      </div>
    </div>
  )
}
