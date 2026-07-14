'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { BookMarked, Plus, ChevronRight, ArrowLeft, Trash2, Users, UserCheck, X } from 'lucide-react'
import { AddSubjectModal } from './add-subject-modal'
import { deleteGlobalSubject, assignSubjectTeacher, removeSubjectFromClass } from './actions'
import { useConfirmDialog, ConfirmDialog } from '@/components/ui/confirm-dialog'
import { getTeachers } from '../classes/actions'
import { toast } from 'sonner'

interface SubjectClientProps {
  globalSubjects: any[]
  classSubjects: any[]
  classes: any[]
  schoolId: string
}

type View = 'classes' | 'subjects' | 'detail'

export function SubjectClient({ globalSubjects, classSubjects, classes, schoolId }: SubjectClientProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [globalList, setGlobalList] = useState(globalSubjects)
  const [mappings, setMappings] = useState(classSubjects)
  const [selectedClass, setSelectedClass] = useState<any | null>(null)
  
  // The subject selected for viewing/editing details
  // Can be a global subject OR a specific class-subject mapping
  const [selectedMapping, setSelectedMapping] = useState<any | null>(null)
  const [selectedGlobal, setSelectedGlobal] = useState<any | null>(null)

  const [view, setView] = useState<View>('classes')
  const { dialogProps, confirm, setLoading } = useConfirmDialog()

  const [teachers, setTeachers] = useState<any[]>([])
  const [assignMode, setAssignMode] = useState(false)
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)

  useEffect(() => {
    setGlobalList(globalSubjects)
    setMappings(classSubjects)
  }, [globalSubjects, classSubjects])

  function handleSubjectAdded() {
    router.refresh()
  }

  // Derived data
  const currentClassMappings = selectedClass 
    ? mappings.filter(m => m.class_id === selectedClass.id) 
    : []

  const unassignedGlobals = globalList.filter(g => 
    !mappings.some(m => m.subject_id === g.id)
  )

  async function handleSelectClass(cls: any) {
    setSelectedClass(cls)
    setView('subjects')
  }

  function handleSelectMapping(mapping: any) {
    const globalSub = globalList.find(g => g.id === mapping.subject_id)
    setSelectedMapping(mapping)
    setSelectedGlobal(globalSub)
    setSelectedTeacherId(mapping.teacher_id || '')
    setView('detail')
    setAssignMode(false)
  }

  function handleSelectGlobal(globalSub: any) {
    setSelectedMapping(null)
    setSelectedGlobal(globalSub)
    setView('detail')
  }

  async function openAssignMode() {
    if (teachers.length === 0) {
      const list = await getTeachers(schoolId)
      setTeachers(list)
    }
    setAssignMode(true)
  }

  async function handleAssignTeacher() {
    if (!selectedMapping) return;
    setAssigning(true); setAssignError(null)
    const res = await assignSubjectTeacher(selectedMapping.id, selectedTeacherId || null)
    setAssigning(false)
    if (res.error) { setAssignError(res.error) }
    else {
      const t = teachers.find(t => t.id === selectedTeacherId)
      setMappings(prev => prev.map(m => m.id === selectedMapping.id ? { ...m, teacher_id: selectedTeacherId || null, users: t || null } : m))
      setSelectedMapping((prev: any) => ({ ...prev, teacher_id: selectedTeacherId || null, users: t || null }))
      setAssignMode(false)
      toast.success(t ? `Assigned ${t.full_name} to ${selectedGlobal?.name}` : 'Teacher removed')
    }
  }

  async function handleRemoveFromClass(mappingId: string) {
    const ok = await confirm({
      title: 'Remove from Class',
      description: 'Are you sure you want to remove this subject from this class? (It will still exist globally).',
      confirmLabel: 'Remove', variant: 'danger'
    })
    if (!ok) return
    setLoading(true)
    const res = await removeSubjectFromClass(mappingId)
    setLoading(false)
    if (res.error) alert(res.error)
    else {
      setMappings(prev => prev.filter(m => m.id !== mappingId))
      setView('subjects')
      toast.success('Removed from class')
    }
  }

  async function handleDeleteGlobal(globalId: string) {
    const ok = await confirm({
      title: 'Delete Globally',
      description: 'This will delete the subject ENTIRELY from all classes. This cannot be undone.',
      confirmLabel: 'Delete Permanently', variant: 'danger'
    })
    if (!ok) return
    setLoading(true)
    const res = await deleteGlobalSubject(globalId)
    setLoading(false)
    if (res.error) alert(res.error)
    else {
      setGlobalList(prev => prev.filter(g => g.id !== globalId))
      setMappings(prev => prev.filter(m => m.subject_id !== globalId))
      setView('classes')
      toast.success('Subject deleted globally')
    }
  }

  // ── VIEW: CLASSES ──
  if (view === 'classes') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Subject Management</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage global curriculum and class assignments.</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 gap-2" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Subject</span>
          </Button>
        </div>

        {classes.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
            <h2 className="text-lg font-semibold text-foreground">No classes yet</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
              Create classes first, then add subjects to each one.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {classes.map(cls => {
                const count = mappings.filter(m => m.class_id === cls.id).length
                return (
                  <button
                    key={cls.id}
                    onClick={() => handleSelectClass(cls)}
                    className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                        {cls.name.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate">{cls.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {count > 0 ? `${count} subject${count !== 1 ? 's' : ''} assigned` : 'No subjects assigned'}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors shrink-0" />
                  </button>
                )
              })}
            </div>

            {/* Unassigned subjects */}
            {unassignedGlobals.length > 0 && (
              <button
                onClick={() => { setSelectedClass(null); setView('subjects') }}
                className="w-full flex items-center gap-4 px-4 py-3.5 border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                  <BookMarked className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">Unassigned Global Subjects</p>
                  <p className="text-xs text-muted-foreground">{unassignedGlobals.length} subject(s) not linked to any class</p>
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

  // ── VIEW: SUBJECTS LIST (INSIDE A CLASS) ──
  if (view === 'subjects') {
    const listToRender = selectedClass ? currentClassMappings : unassignedGlobals;

    return (
      <div className="space-y-6">
        <button onClick={() => setView('classes')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group w-fit">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Back to Classes
        </button>

        <div>
          <h1 className="text-2xl font-bold text-foreground">{selectedClass ? `${selectedClass.name} Subjects` : 'Unassigned Subjects'}</h1>
        </div>

        {listToRender.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
            <h2 className="text-lg font-semibold text-foreground">No subjects found</h2>
            <p className="text-sm text-muted-foreground mt-2 mb-6">
              Get started by adding a subject for this class.
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700 gap-2" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4" /> Add Subject
            </Button>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {listToRender.map((item: any) => {
                const globalSub = selectedClass ? globalList.find(g => g.id === item.subject_id) : item;
                if (!globalSub) return null;
                const teacherName = selectedClass ? item.users?.full_name : null;

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <BookMarked className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{globalSub.name}</p>
                        {selectedClass && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Teacher: <span className="font-medium text-foreground">{teacherName || 'None assigned'}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => selectedClass ? handleSelectMapping(item) : handleSelectGlobal(globalSub)}>
                      Manage
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        <ConfirmDialog {...dialogProps} />
      </div>
    )
  }

  // ── VIEW: DETAIL ──
  if (view === 'detail') {
    return (
      <div className="space-y-6">
        <button onClick={() => setView('subjects')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group w-fit">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Back to {selectedClass ? selectedClass.name : 'Subjects'}
        </button>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                <BookMarked className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">{selectedGlobal?.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedClass ? `Assigned to ${selectedClass.name}` : 'Unassigned Global Subject'}
                </p>
              </div>
            </div>
            {selectedMapping ? (
              <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleRemoveFromClass(selectedMapping.id)}>
                <Trash2 className="w-4 h-4 mr-2" /> Remove from Class
              </Button>
            ) : (
              <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDeleteGlobal(selectedGlobal.id)}>
                <Trash2 className="w-4 h-4 mr-2" /> Delete Global Subject
              </Button>
            )}
          </div>

          <hr className="my-8 border-slate-100 dark:border-slate-800" />

          {selectedMapping && (
            <div>
              <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-widest text-muted-foreground">Subject Teacher</h3>
              <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
                {assignMode ? (
                  <div className="space-y-4">
                    <div>
                      <select
                        value={selectedTeacherId}
                        onChange={e => setSelectedTeacherId(e.target.value)}
                        className="w-full bg-background border border-input rounded-xl px-3 py-2.5 text-sm"
                      >
                        <option value="">Select a teacher...</option>
                        <option value="">(Remove current teacher)</option>
                        {teachers.map(t => (
                          <option key={t.id} value={t.id}>{t.full_name}</option>
                        ))}
                      </select>
                    </div>
                    {assignError && <p className="text-xs text-red-500">{assignError}</p>}
                    <div className="flex gap-2">
                      <Button onClick={handleAssignTeacher} disabled={assigning} className="bg-blue-600 hover:bg-blue-700">Save</Button>
                      <Button variant="ghost" onClick={() => setAssignMode(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold">
                        {selectedMapping.users ? selectedMapping.users.full_name.substring(0, 2).toUpperCase() : '??'}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{selectedMapping.users?.full_name || 'No teacher assigned'}</p>
                      </div>
                    </div>
                    <Button variant="secondary" onClick={openAssignMode}>
                      {selectedMapping.users ? 'Change Teacher' : 'Assign Teacher'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <ConfirmDialog {...dialogProps} />
      </div>
    )
  }

  return null
}
