import { Card, CardContent } from '@/components/ui/card'
import { Megaphone } from 'lucide-react'

export interface Announcement {
  id: string
  title: string
  body: string
  target_audience: string
  created_at: string
  users: {
    full_name: string
    salutation?: string | null
  } | null
}

export function AnnouncementsFeed({ announcements }: { announcements: Announcement[] }) {
  if (announcements.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/50 mx-auto flex items-center justify-center mb-4">
          <Megaphone className="w-8 h-8 text-slate-500" />
        </div>
        <h3 className="font-semibold text-foreground">No Announcements</h3>
        <p className="text-sm text-muted-foreground mt-1">You're all caught up!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {announcements.map((ann) => {
        const date = new Date(ann.created_at).toLocaleDateString(undefined, { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        })
        return (
          <div key={ann.id} className="relative bg-white dark:bg-slate-900/50 border border-blue-500/20 rounded-2xl p-5 overflow-hidden group hover:border-blue-500/40 transition-colors shadow-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full pointer-events-none group-hover:bg-blue-500/10 transition-colors" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
              <h3 className="font-bold text-blue-600 dark:text-blue-400 text-lg group-hover:text-blue-500 dark:group-hover:text-blue-300 transition-colors">
                {ann.title}
              </h3>
              <div className="flex items-center gap-3 text-xs font-semibold text-blue-900/60 dark:text-blue-200/60">
                <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-lg">
                  From: {ann.users ? (ann.users.salutation ? `${ann.users.salutation} ${ann.users.full_name}` : ann.users.full_name) : 'Admin'}
                </span>
                <span className="text-slate-500">{date}</span>
              </div>
            </div>
            <p className="relative z-10 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {ann.body}
            </p>
          </div>
        )
      })}
    </div>
  )
}
