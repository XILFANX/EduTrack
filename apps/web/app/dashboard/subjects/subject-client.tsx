'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { BookMarked, Plus, MoreVertical, Edit, Trash2 } from 'lucide-react'
import { AddSubjectModal } from './add-subject-modal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { deleteSubject } from './actions'
import { useConfirmDialog, ConfirmDialog } from '@/components/ui/confirm-dialog'

interface SubjectClientProps {
  subjects: any[]
  schoolId: string
}

export function SubjectClient({ subjects, schoolId }: SubjectClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [subjectList, setSubjectList] = useState(subjects)
  const { dialogProps, confirm, setLoading } = useConfirmDialog()

  async function handleDelete(id: string) {
    const isConfirmed = await confirm({
      title: "Delete Subject",
      description: "Are you sure you want to delete this subject? This action cannot be undone.",
      confirmLabel: "Delete",
      variant: "danger"
    })
    if (!isConfirmed) return
    
    setLoading(true)
    const res = await deleteSubject(id)
    setLoading(false)
    if ('success' in res) {
      setSubjectList(subjectList.filter(s => s.id !== id))
    } else {
      alert(res.error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Subjects</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage the global curriculum and assign teachers.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Subject
        </Button>
      </div>

      {!subjectList || subjectList.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/40 mx-auto flex items-center justify-center mb-4">
            <BookMarked className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">No subjects added</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
            Add subjects to your curriculum to enable grading and class scheduling.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-muted-foreground uppercase tracking-wider text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">Subject Name</th>
                  <th className="px-6 py-4">Default Teacher</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {subjectList.map((subject) => {
                  const teacherName = Array.isArray(subject.users) ? subject.users[0]?.full_name : (subject.users as any)?.full_name

                  return (
                    <tr key={subject.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 font-bold text-foreground">{subject.name}</td>
                      <td className="px-6 py-4 text-muted-foreground">{teacherName || 'Unassigned'}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium">Active</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-foreground">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 rounded-xl">
                            <DropdownMenuItem className="text-slate-600 dark:text-slate-300 gap-2 cursor-pointer">
                              <Edit className="w-4 h-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 gap-2 cursor-pointer"
                              onClick={() => handleDelete(subject.id)}
                            >
                              <Trash2 className="w-4 h-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AddSubjectModal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        schoolId={schoolId}
      />
      <ConfirmDialog {...dialogProps} />
    </div>
  )
}
