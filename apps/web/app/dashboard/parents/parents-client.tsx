'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MessageSquare, ChevronRight, Baby, Phone, UserPlus, Users } from 'lucide-react'
import { getOrCreateConversation } from '@/app/actions/chat'
import { useState } from 'react'

interface ClassItem { id: string; name: string }
interface Parent {
  id: string
  full_name?: string
  salutation?: string | null
  phone_number?: string
  photo_url?: string | null
  last_seen_at?: string | null
}
interface StudentWithParents {
  id: string
  first_name: string
  last_name: string
  admission_number: string
  photo_url?: string | null
  parents: Parent[]
}

interface Props {
  classes: ClassItem[]
  selectedClassId: string
  studentsWithParents: StudentWithParents[]
  currentUserId: string
}

interface ParentWithStudents extends Parent {
  students: {
    id: string
    first_name: string
    last_name: string
    admission_number: string
    photo_url?: string | null
  }[]
}

export function ParentsDirectoryClient({ classes, selectedClassId, studentsWithParents, currentUserId }: Props) {
  const router = useRouter()
  const [messagingId, setMessagingId] = useState<string | null>(null)

  async function handleMessage(parentId: string) {
    setMessagingId(parentId)
    try {
      await getOrCreateConversation(parentId)
      router.push(`/dashboard/messages?contactId=${parentId}`)
    } catch {
      setMessagingId(null)
    }
  }

  function getInitials(name: string) {
    return (name || '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  }

  // Transform data: Group by Parent
  const parentsMap = new Map<string, ParentWithStudents>()
  const unlinkedStudents: typeof studentsWithParents = []

  studentsWithParents.forEach(student => {
    if (!student.parents || student.parents.length === 0) {
      unlinkedStudents.push(student)
      return
    }

    student.parents.forEach(parent => {
      if (!parentsMap.has(parent.id)) {
        parentsMap.set(parent.id, { ...parent, students: [] })
      }
      parentsMap.get(parent.id)!.students.push({
        id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        admission_number: student.admission_number,
        photo_url: student.photo_url
      })
    })
  })

  const uniqueParents = Array.from(parentsMap.values()).sort((a, b) => 
    (a.full_name || '').localeCompare(b.full_name || '')
  )

  if (studentsWithParents.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/50 mx-auto flex items-center justify-center mb-4">
          <Baby className="w-8 h-8 text-slate-500" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">No students in this class</h2>
        <p className="text-sm text-muted-foreground mt-2 mb-6 max-w-xs mx-auto">
          Enroll students in this class first, then invite their parents to connect.
        </p>
        <Link
          href="/dashboard/students"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          Enroll Students
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Directory List */}
      <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Users className="w-4 h-4 text-blue-500" />
            Linked Parents ({uniqueParents.length})
          </div>
        </div>
        
        {uniqueParents.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No parents have been linked to students in this class yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {uniqueParents.map(parent => (
              <div key={parent.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-sm font-bold text-slate-500 dark:text-slate-300 shrink-0 shadow-sm">
                    {parent.photo_url
                      ? <img src={parent.photo_url} alt="" className="w-full h-full object-cover" />
                      : getInitials(parent.full_name || '')}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-foreground text-base truncate">
                      {parent.salutation ? `${parent.salutation} ${parent.full_name}` : (parent.full_name || 'Parent')}
                    </p>
                    {parent.phone_number && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3" /> {parent.phone_number}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 shrink-0 pl-16 sm:pl-0">
                  {/* Attached Students Badges */}
                  <div className="flex flex-wrap gap-1.5 justify-start sm:justify-end">
                    {parent.students.map(student => (
                      <div key={student.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 max-w-[150px]">
                        <div className="w-4 h-4 rounded-full overflow-hidden bg-blue-100 dark:bg-blue-500/20 shrink-0">
                          {student.photo_url ? (
                            <img src={student.photo_url} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <Baby className="w-full h-full p-0.5 text-blue-500" />
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 truncate">
                          {student.first_name}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleMessage(parent.id)}
                    disabled={messagingId === parent.id}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-blue-600 dark:hover:bg-blue-600 border border-slate-200 dark:border-slate-700 hover:border-blue-600 dark:hover:border-blue-500 text-slate-600 dark:text-slate-300 hover:text-white text-xs font-bold transition-all disabled:opacity-60 shadow-sm"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {messagingId === parent.id ? 'Opening…' : 'Message'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Unlinked Students Section */}
      {unlinkedStudents.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-500/5 border border-orange-200 dark:border-orange-500/20 rounded-3xl overflow-hidden">
          <div className="px-5 py-3 border-b border-orange-200/50 dark:border-orange-500/10 flex items-center justify-between bg-orange-100/50 dark:bg-orange-500/10">
            <h3 className="text-sm font-bold text-orange-800 dark:text-orange-400">
              Action Needed: {unlinkedStudents.length} Student{unlinkedStudents.length !== 1 ? 's' : ''} Missing Parent Links
            </h3>
            <Link href="/dashboard/students" className="text-xs font-bold text-orange-600 hover:text-orange-700 dark:text-orange-500 dark:hover:text-orange-400 transition-colors">
              Manage in Students Module &rarr;
            </Link>
          </div>
          <div className="px-5 py-4 flex flex-wrap gap-2">
            {unlinkedStudents.map(student => (
              <div key={student.id} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-orange-100 dark:border-orange-500/20 shadow-sm">
                <span className="text-xs font-semibold text-foreground">{student.first_name} {student.last_name}</span>
                <span className="text-[10px] text-muted-foreground font-mono">{student.admission_number}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
