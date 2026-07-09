'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { UserPlus, ArrowLeft, MoreVertical, GraduationCap, Edit, Trash2, UserCheck, X, Check } from 'lucide-react'
import Link from 'next/link'
import { EnrollStudentModal } from '@/app/dashboard/students/enroll-student-modal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { deleteStudent } from '@/app/dashboard/students/actions'
import { assignTeacher, deleteClass } from '../actions'
import { useConfirmDialog, ConfirmDialog } from '@/components/ui/confirm-dialog'

interface Teacher {
  id: string
  full_name: string
  role: string
  salutation?: string | null
}

interface ClassDetailClientProps {
  cls: { id: string; name: string }
  initialStudents: any[]
  teacherName: string | null
  teacherSalutation: string | null
  teacherId: string | null
  teachers: Teacher[]
  schoolId: string
}

export function ClassDetailClient({ cls, initialStudents, teacherName, teacherSalutation, teacherId, teachers, schoolId }: ClassDetailClientProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [students, setStudents] = useState(initialStudents)
  const { dialogProps, confirm, setLoading: setConfirmLoading } = useConfirmDialog()

  // Teacher assignment state
  const [currentTeacherId, setCurrentTeacherId] = useState(teacherId)
  const [currentTeacherName, setCurrentTeacherName] = useState(teacherName)
  const [currentTeacherSalutation, setCurrentTeacherSalutation] = useState(teacherSalutation)
  const [assignMode, setAssignMode] = useState(false)
  const [selectedTeacherId, setSelectedTeacherId] = useState(teacherId ?? '')
  const [assigning, setAssigning] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)

  const displayTeacherName = currentTeacherSalutation && currentTeacherName
    ? `${currentTeacherSalutation} ${currentTeacherName}`
    : currentTeacherName

  async function handleDeleteClass() {
    const isConfirmed = await confirm({
      title: 'Delete Class',
      description: `Are you sure you want to delete "${cls.name}"? This cannot be undone. Classes with enrolled students cannot be deleted.`,
      confirmLabel: 'Delete Class',
      variant: 'danger'
    })
    if (!isConfirmed) return
    setConfirmLoading(true)
    const res = await deleteClass(cls.id)
    setConfirmLoading(false)
    if ('error' in res && res.error) {
      alert(res.error)
    } else {
      router.push('/dashboard/classes')
      router.refresh()
    }
  }

  async function handleDelete(id: string) {
    const isConfirmed = await confirm({
      title: 'Remove Student',
      description: 'Are you sure you want to remove this student? This action cannot be undone.',
      confirmLabel: 'Remove',
      variant: 'danger'
    })
    if (!isConfirmed) return
    setConfirmLoading(true)
    const res = await deleteStudent(id)
    setConfirmLoading(false)
    if ('success' in res) {
      setStudents(students.filter(s => s.id !== id))
    } else {
      alert(res.error)
    }
  }

  async function handleAssignTeacher() {
    setAssigning(true)
    setAssignError(null)
    const res = await assignTeacher(cls.id, selectedTeacherId || null)
    setAssigning(false)
    if ('error' in res) {
      setAssignError(res.error ?? null)
    } else {
      const teacher = teachers.find(t => t.id === selectedTeacherId)
      setCurrentTeacherId(selectedTeacherId || null)
      setCurrentTeacherName(teacher?.full_name ?? null)
      setCurrentTeacherSalutation((teacher as any)?.salutation ?? null)
      setAssignMode(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/classes" className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0">
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-foreground truncate">{cls.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {students.length} student{students.length !== 1 ? 's' : ''} enrolled
          </p>
        </div>
        <button
          onClick={handleDeleteClass}
          className="shrink-0 p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Delete class"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Class Info Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Class Details</h2>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          {/* Teacher info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Class Teacher</p>
              {displayTeacherName ? (
                <p className="font-semibold text-foreground text-sm">{displayTeacherName}</p>
              ) : (
                <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">Not assigned</p>
              )}
            </div>
          </div>

          {/* Assign button or inline picker */}
          {!assignMode ? (
            <Button
              variant={currentTeacherId ? 'outline' : 'default'}
              size="sm"
              className={currentTeacherId ? 'gap-1.5' : 'bg-blue-600 hover:bg-blue-700 gap-1.5'}
              onClick={() => { setSelectedTeacherId(currentTeacherId ?? ''); setAssignMode(true) }}
            >
              <UserCheck className="w-3.5 h-3.5" />
              {currentTeacherId ? 'Change Teacher' : 'Assign Teacher'}
            </Button>
          ) : (
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <select
                value={selectedTeacherId}
                onChange={e => setSelectedTeacherId(e.target.value)}
                className="flex-1 sm:w-52 bg-background border border-input text-foreground rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="">— None —</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>
                    {(t as any).salutation ? `${(t as any).salutation} ${t.full_name}` : t.full_name}
                  </option>
                ))}
              </select>
              <div className="flex gap-1.5">
                <button
                  onClick={handleAssignTeacher}
                  disabled={assigning}
                  className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setAssignMode(false); setAssignError(null) }}
                  className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {assignError && (
                <p className="w-full text-xs text-red-600 mt-1">{assignError}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Student Roster */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Student Roster ({students.length})</h2>
        <Button className="bg-blue-600 hover:bg-blue-700 gap-2" onClick={() => setIsModalOpen(true)}>
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Enroll Student</span>
          <span className="sm:hidden">Enroll</span>
        </Button>
      </div>

      {!students || students.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/40 mx-auto flex items-center justify-center mb-4">
            <GraduationCap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">No students enrolled</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
            Start enrolling students into this class to build the roster.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {students.map((student) => (
              <div key={student.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    {student.first_name?.[0]}{student.last_name?.[0]}
                  </span>
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">
                    {student.first_name} {student.middle_name ? student.middle_name + ' ' : ''}{student.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">{student.admission_number}</p>
                </div>
                {/* Status + actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                    Active
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-foreground">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 rounded-xl">
                      <DropdownMenuItem className="text-slate-600 dark:text-slate-300 gap-2 cursor-pointer">
                        <Edit className="w-4 h-4" /> Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 gap-2 cursor-pointer"
                        onClick={() => handleDelete(student.id)}
                      >
                        <Trash2 className="w-4 h-4" /> Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <EnrollStudentModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        classes={[cls]}
        onSuccess={() => {
          setTimeout(() => window.location.reload(), 1500)
        }}
      />
      <ConfirmDialog {...dialogProps} />
    </div>
  )
}
