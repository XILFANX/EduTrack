'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Megaphone, Trash2, Loader2 } from 'lucide-react'
import { UX } from '@/lib/ux'
import { useConfirm } from '@/components/providers/ux-provider'
import { deleteAnnouncement } from '@/app/actions/chat'

export interface Announcement {
  id: string
  title: string
  body: string
  target_audience: string
  created_at: string
  author_id?: string
  users: {
    full_name: string
    salutation?: string | null
  } | null
}

export function AnnouncementsFeed({ announcements, currentUserId }: { announcements: Announcement[], currentUserId?: string }) {
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const confirm = useConfirm()
  
  const items = announcements.filter(a => !deletedIds.has(a.id))

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Announcement',
      description: 'Are you sure you want to delete this announcement? This action cannot be undone.',
      variant: 'destructive',
      confirmText: 'Delete'
    })
    
    if (!isConfirmed) return

    setDeletingId(id)
    try {
      await deleteAnnouncement(id)
      setDeletedIds(prev => new Set(prev).add(id))
      UX.toast('Announcement deleted successfully')
    } catch (err: any) {
      UX.errorModal(err.message || 'Failed to delete announcement')
    } finally {
      setDeletingId(null)
    }
  }

  if (items.length === 0) {
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
      {items.map((ann) => {
        const date = new Date(ann.created_at).toLocaleDateString(undefined, { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        })
        const isAuthor = currentUserId && ann.author_id === currentUserId

        return (
          <div key={ann.id} className="relative bg-white dark:bg-slate-900/50 border border-cyan-500/20 rounded-2xl p-5 overflow-hidden group hover:border-cyan-500/40 transition-colors shadow-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full pointer-events-none group-hover:bg-cyan-500/10 transition-colors" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="font-bold text-cyan-600 dark:text-cyan-400 text-lg group-hover:text-cyan-500 dark:group-hover:text-cyan-300 transition-colors">
                  {ann.title}
                </h3>
                <div className="flex items-center gap-3 text-xs font-semibold text-cyan-900/60 dark:text-cyan-200/60 mt-1">
                  <span className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 px-2.5 py-1 rounded-lg">
                    From: {ann.users?.salutation ? `${ann.users.salutation} ${ann.users.full_name}` : (ann.users?.full_name || 'School Admin')}
                  </span>
                  <span className="text-slate-500">{date}</span>
                </div>
              </div>
              
              {isAuthor && (
                <button
                  onClick={() => handleDelete(ann.id)}
                  disabled={deletingId === ann.id}
                  className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-full transition-colors disabled:opacity-50"
                  title="Delete Announcement"
                >
                  {deletingId === ann.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              )}
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
