'use client'

import { useState } from 'react'
import { UserPlus, Search, GraduationCap, Copy, Check, Trash2, Link as LinkIcon } from 'lucide-react'
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
}

interface Invitation {
  id: string
  token: string
  target_name: string | null
  target_phone: string | null
  target_entity_id: string | null // student_id
  used_at: string | null
}

interface ParentLink {
  parent_id: string
  student_id: string
  users: {
    id: string
    full_name: string
    phone_number: string
  }
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
  const [selectedStudent, setSelectedStudent] = useState<{id: string, name: string} | null>(null)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  
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
      title: isUsed ? 'Revoke Parent Access' : 'Delete Invitation',
      description: isUsed 
        ? 'This will completely delete the parent account and revoke their access. Are you sure?'
        : 'This will invalidate the parent invite link. Are you sure?',
      confirmLabel: isUsed ? 'Revoke Access' : 'Delete',
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
    <div className="space-y-6">
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
              // Find parent links
              const parentLink = parentLinks.find(pl => pl.student_id === student.id)
              
              // Find pending invitations
              const pendingInvite = invitations.find(i => i.target_entity_id === student.id && !i.used_at)
              
              // Find used invitations (linked to the current parent)
              const usedInvite = invitations.find(i => i.target_entity_id === student.id && i.used_at)

              return (
                <div key={student.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                          {student.first_name[0]}{student.last_name[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {student.admission_number}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
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
                            setSelectedStudent({ id: student.id, name: `${student.first_name} ${student.last_name}` })
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

      {selectedStudent && (
        <InviteParentModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          studentId={selectedStudent.id}
          studentName={selectedStudent.name}
          schoolId={schoolId}
          onSuccess={() => router.refresh()}
        />
      )}
      <ConfirmDialog {...dialogProps} />
    </div>
  )
}
