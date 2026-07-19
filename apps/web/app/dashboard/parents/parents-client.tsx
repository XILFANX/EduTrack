'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MessageSquare, UserCircle2, ChevronRight, Baby, Phone, UserPlus } from 'lucide-react'
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

export function ParentsDirectoryClient({ classes, selectedClassId, studentsWithParents, currentUserId }: Props) {
  const router = useRouter()
  const [messagingId, setMessagingId] = useState<string | null>(null)

  async function handleMessage(parentId: string) {
    setMessagingId(parentId)
    try {
      const { conversationId } = await getOrCreateConversation(parentId)
      router.push(`/dashboard/messages`)
    } catch {
      setMessagingId(null)
    }
  }

  function getInitials(name: string) {
    return (name || '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  }

  const totalParents = studentsWithParents.flatMap(s => s.parents).length
  const linkedStudents = studentsWithParents.filter(s => s.parents.length > 0).length

  if (studentsWithParents.length === 0) {
    return (
      <div className="text-center py-20 bg-[#121827] border border-slate-800 rounded-3xl">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/50 mx-auto flex items-center justify-center mb-4">
          <Baby className="w-8 h-8 text-slate-500" />
        </div>
        <h2 className="text-lg font-semibold text-slate-200">No students in this class</h2>
        <p className="text-sm text-slate-400 mt-2 mb-6 max-w-xs mx-auto">
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
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Students', value: studentsWithParents.length },
          { label: 'With Linked Parents', value: linkedStudents },
          { label: 'Total Parents', value: totalParents },
        ].map(stat => (
          <div key={stat.label} className="bg-[#121827] border border-slate-800 rounded-xl p-4">
            <p className="text-2xl font-bold text-slate-100">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Students with parents */}
      <div className="space-y-3">
        {studentsWithParents.map(student => (
          <div key={student.id} className="bg-[#121827] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            {/* Student header row */}
            <div className="px-5 py-3.5 bg-[#0b0f19] flex items-center gap-3 border-b border-slate-800/60">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0">
                {student.photo_url
                  ? <img src={student.photo_url} alt="" className="w-full h-full object-cover" />
                  : `${student.first_name[0]}${student.last_name[0]}`}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-200">{student.first_name} {student.last_name}</p>
                <p className="text-xs text-slate-500 font-mono">{student.admission_number}</p>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                student.parents.length > 0
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}>
                {student.parents.length > 0 ? `${student.parents.length} parent${student.parents.length > 1 ? 's' : ''}` : 'No parents'}
              </span>
            </div>

            {/* Parents list */}
            {student.parents.length === 0 ? (
              <div className="px-5 py-4 flex items-center justify-between">
                <p className="text-sm text-slate-500 italic">No parents linked to this student yet.</p>
                <Link
                  href={`/dashboard/students`}
                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Link Parent
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {student.parents.map((parent: any) => (
                  <div key={parent.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[#1a2133] transition-colors group">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-[#1a2133] border border-slate-700 flex items-center justify-center text-sm font-bold text-slate-300 shrink-0">
                      {parent.photo_url
                        ? <img src={parent.photo_url} alt="" className="w-full h-full object-cover" />
                        : getInitials(parent.full_name || '')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-200 text-sm">
                        {parent.salutation ? `${parent.salutation} ${parent.full_name}` : (parent.full_name || 'Parent')}
                      </p>
                      {parent.phone_number && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" /> {parent.phone_number}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleMessage(parent.id)}
                      disabled={messagingId === parent.id}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1a2133] hover:bg-blue-600 border border-slate-700 hover:border-blue-500 text-slate-300 hover:text-white text-xs font-semibold transition-all disabled:opacity-60 group-hover:shadow-sm"
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
    </div>
  )
}
