'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  BookMarked, Plus, ChevronRight, ArrowLeft,
  Trash2, GraduationCap, Users, UserCheck,
  X, Check, TrendingUp, BarChart3
} from 'lucide-react'
import { AddSubjectModal } from './add-subject-modal'
import { deleteSubject, assignSubjectTeacher } from './actions'
import { useConfirmDialog, ConfirmDialog } from '@/components/ui/confirm-dialog'
import { getTeachers } from '../classes/actions'
import { toast } from 'sonner'

interface SubjectClientProps {
  subjects: any[]
  classes: any[]
  schoolId: string
}

type View = 'classes' | 'subjects' | 'detail'

export function SubjectClient({ subjects, classes, schoolId }: SubjectClientProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [subjectList, setSubjectList] = useState(subjects)
  const [selectedClass, setSelectedClass] = useState<any | null>(null)
  const [selectedSubject, setSelectedSubject] = useState<any | null>(null)
  const [view, setView] = useState<View>('classes')
  const { dialogProps, confirm, setLoading } = useConfirmDialog()

  // Teacher assign state (for subject detail)
  const [teachers, setTeachers] = useState<any[]>([])
  const [assignMode, setAssignMode] = useState(false)
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [currentTeacher, setCurrentTeacher] = useState<any>(null)

  function handleSubjectAdded(newSubject: any) {
    setSubjectList(prev => [newSubject, ...prev])
    router.refresh() // also sync any pre-existing subjects that were missed
  }

  // Subjects belonging to the selected class
  const classSubjects = selectedClass
    ? subjectList.filter(s => (s as any).class_id === selectedClass.id)
    : []

  // Unassigned subjects (no class_id)
  const unassignedSubjects = subjectList.filter(s => !(s as any).class_id)

  async function handleSelectClass(cls: any) {
    setSelectedClass(cls)
    setView('subjects')
  }

  function handleSelectSubject(sub: any) {
    const teacherObj = Array.isArray(sub.users) ? sub.users[0] : sub.users
    setCurrentTeacher(teacherObj ?? null)
    setSelectedTeacherId(teacherObj?.id ?? '')
    setSelectedSubject(sub)
    setView('detail')
    setAssignMode(false)
  }

  async function openAssignMode() {
    if (teachers.length === 0) {
      const list = await getTeachers(schoolId)
      setTeachers(list)
    }
    setAssignMode(true)
  }

  async function handleAssignTeacher() {
    setAssigning(true); setAssignError(null)
    const res = await assignSubjectTeacher(selectedSubject.id, selectedTeacherId || null)
    setAssigning(false)
    if ('error' in res) { setAssignError(res.error ?? null) }
    else {
      const t = teachers.find(t => t.id === selectedTeacherId)
      setCurrentTeacher(t ?? null)
      setSubjectList(prev => prev.map(s => s.id === selectedSubject.id ? { ...s, teacher_id: selectedTeacherId || null, users: t ?? null } : s))
      setAssignMode(false)
      toast.success(t ? `Assigned ${t.full_name} to ${selectedSubject.name}` : 'Teacher removed')
    }
  }

  async function handleDelete(id: string) {
    const ok = await confirm({
      title: 'Delete Subject',
      description: 'Are you sure you want to delete this subject? This cannot be undone.',
      confirmLabel: 'Delete', variant: 'danger'
    })
    if (!ok) return
    setLoading(true)
    const res = await deleteSubject(id)
    setLoading(false)
    if ('success' in res) {
      const deleted = subjectList.find(s => s.id === id)
      setSubjectList(prev => prev.filter(s => s.id !== id))
      if (view === 'detail') { setView('subjects'); setSelectedSubject(null) }
      toast.success(deleted ? `"${deleted.name}" deleted` : 'Subject deleted')
    } else { alert(res.error) }
  }

  // ── VIEW: CLASSES ──
  if (view === 'classes') {
    const allClassesWithSubjects = classes.filter(c =>
      subjectList.some(s => (s as any).class_id === c.id)
    )

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Subjects</h1>
            <p className="text-sm text-muted-foreground mt-1">Select a class to view and manage its subjects.</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 gap-2" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Subject</span>
          </Button>
        </div>

        {/* Guide hint */}
        <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-500/20 rounded-xl">
          <BookMarked className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>How it works:</strong> Select a class below to view the subjects assigned to it. You can add a new subject and assign it to any class at any time.
          </p>
        </div>

        {classes.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/40 mx-auto flex items-center justify-center mb-4">
              <BookMarked className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">No classes yet</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
              Create classes first, then add subjects to each one.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {classes.map(cls => {
                const count = subjectList.filter(s => (s as any).class_id === cls.id).length
                return (
                  <button
                    key={cls.id}
                    onClick={() => handleSelectClass(cls)}
                    className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 group-hover:bg-blue-200 transition-colors">
                      <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                        {cls.name.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate">{cls.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {count > 0 ? `${count} subject${count !== 1 ? 's' : ''}` : 'No subjects yet'}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors shrink-0" />
                  </button>
                )
              })}
            </div>

            {/* Unassigned subjects row */}
            {unassignedSubjects.length > 0 && (
              <button
                onClick={() => { setSelectedClass(null); setView('subjects') }}
                className="w-full flex items-center gap-4 px-4 py-3.5 border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                  <BookMarked className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">Unassigned Subjects</p>
                  <p className="text-xs text-muted-foreground">{unassignedSubjects.length} subject{unassignedSubjects.length !== 1 ? 's' : ''} not yet linked to a class</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-amber-500 transition-colors shrink-0" />
              </button>
            )}
          </div>
        )}

        <AddSubjectModal open={isModalOpen} onClose={() => setIsModalOpen(false)} schoolId={schoolId} onSuccess={handleSubjectAdded} />
        <ConfirmDialog {...dialogProps} />
      </div>
    )
  }

  // ── VIEW: SUBJECTS (within a class) ──
  if (view === 'subjects') {
    const displaySubjects = selectedClass ? classSubjects : unassignedSubjects

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => { setView('classes'); setSelectedClass(null) }}
            className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground truncate">
              {selectedClass ? selectedClass.name : 'Unassigned Subjects'}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {displaySubjects.length} subject{displaySubjects.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 gap-2 shrink-0" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Subject</span>
          </Button>
        </div>

        {displaySubjects.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/40 mx-auto flex items-center justify-center mb-4">
              <BookMarked className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">No subjects for this class</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2 mb-6">
              Add a subject and assign it to <strong>{selectedClass?.name}</strong>.
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700 gap-2" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4" /> Add First Subject
            </Button>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {displaySubjects.map(sub => {
                const teacherObj = Array.isArray(sub.users) ? sub.users[0] : sub.users
                const teacherName = teacherObj?.full_name ?? null
                return (
                  <div key={sub.id} className="relative flex items-center hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                    <button
                      onClick={() => handleSelectSubject(sub)}
                      className="flex-1 flex items-center gap-4 px-4 py-3.5 text-left"
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                        <BookMarked className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm truncate group-hover:text-blue-600 transition-colors">{sub.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <GraduationCap className="w-3 h-3 shrink-0" />
                          {teacherName ?? 'No teacher assigned'}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors mr-8 shrink-0" />
                    </button>
                    <button
                      onClick={() => handleDelete(sub.id)}
                      className="absolute right-3 p-2 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Delete subject"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <AddSubjectModal open={isModalOpen} onClose={() => setIsModalOpen(false)} schoolId={schoolId} onSuccess={handleSubjectAdded} />
        <ConfirmDialog {...dialogProps} />
      </div>
    )
  }

  // ── VIEW: SUBJECT DETAIL ──
  const sub = selectedSubject
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => { setView('subjects'); setSelectedSubject(null) }}
          className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 transition-colors shrink-0">
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-foreground truncate">{sub.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{selectedClass?.name ?? 'Unassigned'}</p>
        </div>
        <button onClick={() => handleDelete(sub.id)}
          className="shrink-0 p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Info card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Subject Details</h2>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Subject Teacher</p>
              {currentTeacher?.full_name
                ? <p className="font-semibold text-foreground text-sm">{currentTeacher.full_name}</p>
                : <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">Not assigned</p>
              }
            </div>
          </div>

          {!assignMode ? (
            <Button
              variant={currentTeacher ? 'outline' : 'default'}
              size="sm"
              className={currentTeacher ? 'gap-1.5' : 'bg-blue-600 hover:bg-blue-700 gap-1.5'}
              onClick={openAssignMode}
            >
              <UserCheck className="w-3.5 h-3.5" />
              {currentTeacher ? 'Change Teacher' : 'Assign Teacher'}
            </Button>
          ) : (
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <select
                value={selectedTeacherId}
                onChange={e => setSelectedTeacherId(e.target.value)}
                className="flex-1 sm:w-52 bg-background border border-input text-foreground rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="">— None —</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
              </select>
              <div className="flex gap-1.5">
                <button onClick={handleAssignTeacher} disabled={assigning}
                  className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors disabled:opacity-50">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => { setAssignMode(false); setAssignError(null) }}
                  className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 flex items-center justify-center transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {assignError && <p className="w-full text-xs text-red-600 mt-1">{assignError}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Students', value: '—', icon: Users, color: 'blue' },
          { label: 'Avg. Score', value: '—', icon: TrendingUp, color: 'emerald' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <div className={`w-9 h-9 rounded-xl bg-${color}-100 dark:bg-${color}-900/30 flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 text-${color}-600 dark:text-${color}-400`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Subject performance */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 mx-auto flex items-center justify-center mb-4">
          <BarChart3 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-base font-semibold text-foreground">See Subject Performance</h2>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
          Ranked student results for <strong>{sub.name}</strong> will appear here once exam scores are recorded.
        </p>
      </div>

      <ConfirmDialog {...dialogProps} />
    </div>
  )
}
