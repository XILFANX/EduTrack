'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Users, Plus, GraduationCap, ChevronRight, MoreVertical, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { AddClassModal } from './add-class-modal'
import { deleteClass } from './actions'
import { useConfirmDialog, ConfirmDialog } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'

interface ClassesClientProps {
  classes: any[]
  studentCountMap: Record<string, number>
  schoolId: string
  curriculumType: string
}

export function ClassesPageClient({ classes, studentCountMap, schoolId, curriculumType }: ClassesClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [classList, setClassList] = useState(classes)
  const { dialogProps, confirm, setLoading } = useConfirmDialog()

  async function handleDeleteClass(id: string, name: string) {
    const isConfirmed = await confirm({
      title: 'Delete Class',
      description: `Are you sure you want to delete "${name}"? Classes with enrolled students cannot be deleted.`,
      confirmLabel: 'Delete',
      variant: 'danger'
    })
    if (!isConfirmed) return
    setLoading(true)
    const res = await deleteClass(id)
    setLoading(false)
    if ('error' in res && res.error) {
      alert(res.error)
    } else {
      setClassList(prev => prev.filter(c => c.id !== id))
      toast.success(`"${name}" deleted`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Classes</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage class rosters and assign teachers.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Class</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {!classes || classes.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/40 mx-auto flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">No classes created</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
            Add your first class to start enrolling students and assigning teachers.
          </p>
      <Button className="mt-6 bg-blue-600 hover:bg-blue-700 gap-2" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" /> Add First Class
          </Button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {classList.map((cls) => {
              const teacherObj = Array.isArray(cls.users) ? cls.users[0] : cls.users
              const teacherName = teacherObj?.full_name
              const salutation = teacherObj?.salutation
              const displayTeacher = salutation && teacherName
                ? `${salutation} ${teacherName}`
                : teacherName || null
              const studentCount = studentCountMap[cls.id] || 0

              return (
                <div key={cls.id} className="relative flex items-center bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                  <Link
                    href={`/dashboard/classes/${cls.id}`}
                    className="flex-1 flex items-center gap-4 px-4 py-3.5"
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40 transition-colors">
                      <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                        {cls.name.substring(0, 2).toUpperCase()}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {cls.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
                        <GraduationCap className="w-3 h-3 shrink-0" />
                        <span className="truncate">{displayTeacher ?? 'No teacher assigned'}</span>
                      </p>
                    </div>

                    {/* Student count badge */}
                    <div className="shrink-0 flex items-center gap-1 mr-8">
                      <span className="hidden sm:flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <Users className="w-3.5 h-3.5" />
                        {studentCount}
                      </span>
                      <span className="sm:hidden text-xs font-medium text-slate-500 dark:text-slate-400">
                        {studentCount}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </Link>

                  {/* Delete button — positioned absolute on the right edge */}
                  <button
                    onClick={e => { e.stopPropagation(); handleDeleteClass(cls.id, cls.name) }}
                    className="absolute right-3 p-2 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Delete class"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>

          {/* Footer summary */}
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-muted-foreground">
              {classList.length} class{classList.length !== 1 ? 'es' : ''} · {Object.values(studentCountMap).reduce((a, b) => a + b, 0)} total students
            </p>
          </div>
        </div>
      )}

      <AddClassModal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        schoolId={schoolId} 
        curriculumType={curriculumType}
      />
      <ConfirmDialog {...dialogProps} />
    </div>
  )
}
