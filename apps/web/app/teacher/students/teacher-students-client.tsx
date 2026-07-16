'use client'

import { useState } from 'react'
import { UserPlus, Search, GraduationCap, Copy, Check, Trash2, Link as LinkIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InviteParentModal } from './invite-parent-modal'
import { useRouter } from 'next/navigation'
import { useConfirmDialog, ConfirmDialog } from '@/components/ui/confirm-dialog'
import { deleteParentInviteAndAccount } from './actions'

interface Student {
  id: string
  first_name: string
  last_name: string
  admission_number: string
  class_id: string | null
  photo_url?: string | null
  status?: string
}

interface Invitation {
  id: string
  token: string
  target_name: string | null
  target_phone: string | null
  target_entity_id: string | null
  used_at: string | null
}

interface ParentLink {
  parent_id: string
  student_id: string
  users: { id: string; full_name: string; phone_number: string }
}

interface TeacherStudentsClientProps {
  students: Student[]
  invitations: Invitation[]
  parentLinks: ParentLink[]
  schoolId: string
  className?: string
}

export function TeacherStudentsClient({ students, invitations, parentLinks, schoolId, className }: TeacherStudentsClientProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedStudentForInvite, setSelectedStudentForInvite] = useState<{id: string, name: string} | null>(null)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [quickViewStudent, setQuickViewStudent] = useState<Student | null>(null)
  
  const { dialogProps, confirm, setLoading } = useConfirmDialog()

  const filteredStudents = students.filter(s => {
    const q = search.toLowerCase()
    return (
      s.first_name.toLowerCase().includes(q) ||
      s.last_name.toLowerCase().includes(q) ||
      s.admission_number.toLowerCase().includes(q)
    )
  })

  function handleCopyLink(token: string) {
    const link = `${window.location.origin}/invite/${token}`
    navigator.clipboard.writeText(link)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  async function handleDeleteInvite(inviteId: string, isUsed: boolean) {
    const ok = await confirm({
      title: isUsed ? 'Permanently Revoke Parent Access' : 'Delete Invitation',
      description: isUsed 
        ? 'This will permanently delete the parent account and revoke all their access. This cannot be undone.'
        : 'This will invalidate the parent invite link. Are you sure?',
      confirmLabel: isUsed ? 'Permanently Revoke' : 'Delete',
      variant: 'danger'
    })
    
    if (!ok) return
    
    setLoading(true)
    const res = await deleteParentInviteAndAccount(inviteId)
    setLoading(false)
    
    if (res.error) alert(res.error)
    else router.refresh()
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main List */}
      <div className={`flex-1 space-y-6 ${quickViewStudent ? 'hidden lg:block' : ''}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Class Students</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {className ? `Managing students in ${className}` : 'Your assigned students'}
            </p>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {filteredStudents.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/40 mx-auto flex items-center justify-center mb-4">
              <GraduationCap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">No students found</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
              You don't have any students assigned to your class yet.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {filteredStudents.map(student => {
                const parentLink = parentLinks.find(pl => pl.student_id === student.id)
                const pendingInvite = invitations.find(i => i.target_entity_id === student.id && !i.used_at)
                const usedInvite = invitations.find(i => i.target_entity_id === student.id && i.used_at)
                const initials = `${student.first_name[0]}${student.last_name[0]}`
                const isSuspended = student.status?.toLowerCase() === 'suspended'

                return (
                  <div key={student.id} className={`p-4 transition-colors ${quickViewStudent?.id === student.id ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/20'}`}>
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex items-center gap-3 cursor-pointer group flex-1"
                        onClick={() => setQuickViewStudent(student)}
                      >
                        {student.photo_url ? (
                          <img src={student.photo_url} alt="" className={`w-10 h-10 rounded-full object-cover shrink-0 ${isSuspended ? 'opacity-50 grayscale' : ''}`} />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isSuspended ? 'bg-slate-100 text-slate-400 dark:bg-slate-800' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                            <span className="text-xs font-bold">{initials}</span>
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-foreground text-sm group-hover:text-blue-600 transition-colors">
                            {student.first_name} {student.last_name}
                            {isSuspended && <span className="ml-2 text-[10px] uppercase tracking-wider bg-red-100 text-red-700 px-1.5 py-0.5 rounded-sm">Suspended</span>}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {student.admission_number}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 ml-4">
                        {parentLink ? (
                          <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                              <p className="text-sm font-medium text-foreground">{parentLink.users?.full_name}</p>
                              <p className="text-xs text-muted-foreground">Parent • {parentLink.users?.phone_number}</p>
                            </div>
                            {usedInvite && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={() => handleDeleteInvite(usedInvite.id, true)}
                                title="Revoke Access"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ) : pendingInvite ? (
                          <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                              <p className="text-sm font-medium text-amber-600 dark:text-amber-500">Invite Sent</p>
                              <p className="text-xs text-muted-foreground">Waiting for {pendingInvite.target_name}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="gap-1.5 h-8 text-xs"
                                onClick={() => handleCopyLink(pendingInvite.token)}
                              >
                                {copiedToken === pendingInvite.token ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <LinkIcon className="w-3.5 h-3.5" />}
                                <span className="hidden sm:inline">{copiedToken === pendingInvite.token ? 'Copied' : 'Link'}</span>
                              </Button>
                              <a
                                href={`https://wa.me/?text=${encodeURIComponent(`Hello ${pendingInvite.target_name}! 👋\n\nYou have been invited to join EduTrack to track your child's progress. Click the link below to set up your account:\n${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${pendingInvite.token}\n\n_This link is permanent and does not expire._`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-1.5 h-8 px-3 text-xs font-medium bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-md transition-colors hidden sm:flex"
                              >
                                WhatsApp
                              </a>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={() => handleDeleteInvite(pendingInvite.id, false)}
                                title="Delete Invite"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="gap-1.5"
                            onClick={() => {
                              setSelectedStudentForInvite({ id: student.id, name: `${student.first_name} ${student.last_name}` })
                              setModalOpen(true)
                            }}
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Invite Parent</span>
                            <span className="sm:hidden">Invite</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Quick View Panel */}
      {quickViewStudent && (
        <div className="w-full lg:w-80 shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm sticky top-6 h-fit">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-foreground">Quick View</h3>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600" onClick={() => setQuickViewStudent(null)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="text-center mb-6">
            {quickViewStudent.photo_url ? (
              <img src={quickViewStudent.photo_url} alt="" className="w-24 h-24 rounded-full object-cover mx-auto mb-3 shadow-sm border-2 border-white dark:border-slate-800" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-2xl font-bold flex items-center justify-center mx-auto mb-3">
                {quickViewStudent.first_name[0]}{quickViewStudent.last_name[0]}
              </div>
            )}
            <h2 className="text-lg font-bold text-foreground">{quickViewStudent.first_name} {quickViewStudent.last_name}</h2>
            <p className="text-sm font-mono text-muted-foreground mt-1">{quickViewStudent.admission_number}</p>
            
            <div className={`mt-3 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
              (!quickViewStudent.status || quickViewStudent.status.toLowerCase() === 'active') 
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {quickViewStudent.status || 'Active'}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
              <p className="text-xs text-muted-foreground font-medium mb-1">Class</p>
              <p className="text-sm font-semibold">{className}</p>
            </div>
            
            {/* Show parent status */}
            {(() => {
              const pl = parentLinks.find(l => l.student_id === quickViewStudent.id)
              const pending = invitations.find(i => i.target_entity_id === quickViewStudent.id && !i.used_at)
              
              if (pl) {
                return (
                  <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-3 border border-blue-100 dark:border-blue-900/30">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Linked Parent</p>
                    <p className="text-sm font-semibold">{pl.users.full_name}</p>
                    <p className="text-xs text-muted-foreground">{pl.users.phone_number}</p>
                  </div>
                )
              } else if (pending) {
                return (
                  <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-3 border border-amber-100 dark:border-amber-900/30">
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">Pending Invite</p>
                    <p className="text-sm font-semibold">{pending.target_name}</p>
                  </div>
                )
              } else {
                return (
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 flex flex-col items-center text-center gap-2">
                    <p className="text-xs text-muted-foreground">No parent linked</p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full text-xs h-8"
                      onClick={() => {
                        setSelectedStudentForInvite({ id: quickViewStudent.id, name: `${quickViewStudent.first_name} ${quickViewStudent.last_name}` })
                        setModalOpen(true)
                      }}
                    >
                      Invite Now
                    </Button>
                  </div>
                )
              }
            })()}
          </div>
        </div>
      )}

      {selectedStudentForInvite && (
        <InviteParentModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          studentId={selectedStudentForInvite.id}
          studentName={selectedStudentForInvite.name}
          schoolId={schoolId}
          onSuccess={() => router.refresh()}
        />
      )}
      <ConfirmDialog {...dialogProps} />
    </div>
  )
}
