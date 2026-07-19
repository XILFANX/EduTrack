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
      <div className="text-center py-12 bg-[#121827] border border-slate-800 rounded-2xl">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/50 mx-auto flex items-center justify-center mb-4">
          <Megaphone className="w-8 h-8 text-slate-500" />
        </div>
        <h3 className="font-semibold text-slate-200">No Announcements</h3>
        <p className="text-sm text-slate-400 mt-1">You're all caught up!</p>
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
          <div key={ann.id} className="relative bg-[#0b0f19] border border-orange-500/20 rounded-2xl p-5 overflow-hidden group hover:border-orange-500/40 transition-colors shadow-lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl rounded-full pointer-events-none group-hover:bg-orange-500/10 transition-colors" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
              <h3 className="font-bold text-orange-400 text-lg group-hover:text-orange-300 transition-colors">
                {ann.title}
              </h3>
              <div className="flex items-center gap-3 text-xs font-semibold text-orange-200/60">
                <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2.5 py-1 rounded-lg">
                  From: {ann.users ? (ann.users.salutation ? `${ann.users.salutation} ${ann.users.full_name}` : ann.users.full_name) : 'Admin'}
                </span>
                <span className="text-slate-500">{date}</span>
              </div>
            </div>
            <p className="relative z-10 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
              {ann.body}
            </p>
          </div>
        )
      })}
    </div>
  )
}
