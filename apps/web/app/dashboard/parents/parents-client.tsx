'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Users, MessageSquare, UserCircle2, ChevronRight, Baby } from 'lucide-react'
import { getOrCreateConversation } from '@/app/actions/chat'
import { useState } from 'react'

interface ClassItem { id: string; name: string }
interface Parent { id: string; first_name?: string; last_name?: string; full_name?: string; salutation?: string | null; phone_number?: string; photo_url?: string | null; last_seen_at?: string | null }
interface StudentWithParents {
  id: string; first_name: string; last_name: string; admission_number: string; photo_url?: string | null; parents: Parent[]
}

interface Props {
  classes: ClassItem[]
  selectedClassId: string
  studentsWithParents: StudentWithParents[]
  currentUserId: string
}

export function ParentsDirectoryClient({ classes, selectedClassId, studentsWithParents, currentUserId }: Props) {
  const router = useRouter()
  const [messagingId, setMessagingId] = useState<string | null>(null)

  const allParents = studentsWithParents.flatMap(s =>
    s.parents.map(p => ({ ...p, student: { first_name: s.first_name, last_name: s.last_name, photo_url: s.photo_url } }))
  )
  // Deduplicate parents (a parent may have multiple children in same class)
  const uniqueParents = Array.from(new Map(allParents.map(p => [p.id, p])).values())

  async function handleMessage(parentId: string) {
    setMessagingId(parentId)
    try {
      const { conversationId } = await getOrCreateConversation(parentId)
      router.push(`/dashboard/messages?convo=${conversationId}`)
    } catch {
      setMessagingId(null)
    }
  }

  function getInitials(name: string) {
    return (name || '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-rose-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Parents Directory</h1>
          <p className="text-sm text-muted-foreground">Browse by class — see linked parents and message them directly.</p>
        </div>
      </div>

      {/* Class tabs */}
      <div className="flex gap-2 flex-wrap">
        {classes.map(cls => (
          <Link
            key={cls.id}
            href={`/dashboard/parents?class=${cls.id}`}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${
              selectedClassId === cls.id
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-card text-foreground border-border hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {cls.name}
          </Link>
        ))}
      </div>

      {/* Students with parents */}
      {studentsWithParents.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-3xl">
          <Baby className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No students or no linked parents in this class yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {studentsWithParents.map(student => (
            <div key={student.id} className="bg-card border border-border rounded-2xl overflow-hidden">
              {/* Student row */}
              <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950 flex items-center gap-3 border-b border-border">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">
                  {student.photo_url
                    ? <img src={student.photo_url} alt="" className="w-full h-full object-cover" />
                    : `${student.first_name[0]}${student.last_name[0]}`}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{student.first_name} {student.last_name}</p>
                  <p className="text-xs text-muted-foreground">{student.admission_number}</p>
                </div>
                <span className="text-xs text-muted-foreground">{student.parents.length} parent(s)</span>
              </div>

              {/* Parents list */}
              {student.parents.length === 0 ? (
                <div className="px-5 py-4 text-sm text-muted-foreground italic">No parents linked yet.</div>
              ) : (
                <div className="divide-y divide-border">
                  {student.parents.map((parent: any) => (
                    <div key={parent.id} className="flex items-center gap-4 px-5 py-4">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-sm font-bold text-rose-700 shrink-0">
                        {parent.photo_url
                          ? <img src={parent.photo_url} alt="" className="w-full h-full object-cover" />
                          : getInitials(parent.full_name || '')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm">{parent.salutation ? `${parent.salutation} ${parent.full_name}` : (parent.full_name || 'Parent')}</p>
                        <p className="text-xs text-muted-foreground">{parent.phone_number || 'No phone'}</p>
                      </div>
                      <button
                        onClick={() => handleMessage(parent.id)}
                        disabled={messagingId === parent.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors disabled:opacity-60"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        {messagingId === parent.id ? 'Opening…' : 'Message'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
