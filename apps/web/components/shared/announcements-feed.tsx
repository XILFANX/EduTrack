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
  } | null
}

export function AnnouncementsFeed({ announcements }: { announcements: Announcement[] }) {
  if (announcements.length === 0) {
    return (
      <div className="text-center py-12 bg-card border border-border rounded-2xl">
        <Megaphone className="w-8 h-8 text-slate-300 mx-auto mb-3" />
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
          <Card key={ann.id} className="border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-950/20 shadow-sm">
            <CardContent className="p-4 md:p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                <h3 className="font-bold text-foreground text-orange-900 dark:text-orange-200 text-lg">
                  {ann.title}
                </h3>
                <div className="flex items-center gap-3 text-xs font-medium text-orange-700/70 dark:text-orange-400">
                  <span className="bg-orange-100 dark:bg-orange-900/40 px-2 py-0.5 rounded-md">
                    From: {ann.users?.full_name || 'Admin'}
                  </span>
                  <span>{date}</span>
                </div>
              </div>
              <p className="text-sm text-orange-900/80 dark:text-orange-200/80 whitespace-pre-wrap leading-relaxed">
                {ann.body}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
