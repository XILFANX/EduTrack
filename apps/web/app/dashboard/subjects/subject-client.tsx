'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BookMarked, Plus, ChevronRight, ArrowLeft, Trash2, Loader2 } from 'lucide-react'
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
  initialClassId?: string
  isBulkMode?: boolean
}

type View = 'subjects' | 'detail'

export function SubjectClient({ globalSubjects, classSubjects, classes, schoolId, initialClassId, isBulkMode }: SubjectClientProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [globalList, setGlobalList] = useState(globalSubjects)
  const [mappings, setMappings] = useState(classSubjects)
  const [selectedClass, setSelectedClass] = useState<any | null>(initialClassId ? classes.find(c => c.id === initialClassId) : null)
  const [selectedMapping, setSelectedMapping] = useState<any | null>(null)
  const [selectedGlobal, setSelectedGlobal] = useState<any | null>(null)
  const [view, setView] = useState<View>(isBulkMode ? 'subjects' : 'subjects')
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

  const currentClassMappings = selectedClass
    ? mappings.filter(m => m.class_id === selectedClass.id)
    : []

  const unassignedGlobals = globalList.filter(g =>
    !mappings.some(m => m.subject_id === g.id)
  )

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
    if (!selectedMapping) return
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
      description: 'Are you sure you want to remove this subject from the class? This action cannot be undone.',
      confirmLabel: 'Remove',
      variant: 'danger'
    })
    if (!ok) return
    
    setLoading(true)
    const res = await removeSubjectFromClass(mappingId)
    setLoading(false)
    
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Subject removed from class')
      setMappings(prev => prev.filter(m => m.id !== mappingId))
      setView('subjects')
    }
  }

  async function handleDeleteGlobal(globalId: string) {
    const ok = await confirm({
      title: 'Delete Global Subject',
      description: 'Are you sure? This will remove the subject from ALL classes and delete associated data.',
      confirmLabel: 'Delete Everywhere',
      variant: 'danger'
    })
    if (!ok) return

    setLoading(true)
    const res = await deleteGlobalSubject(globalId)
    setLoading(false)
    
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Global subject deleted')
      setGlobalList(prev => prev.filter(g => g.id !== globalId))
      setMappings(prev => prev.filter(m => m.subject_id !== globalId))
      setView('subjects')
    }
  }

  const sharedOverlays = (
    <>
      <AddSubjectModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        schoolId={schoolId}
        onSuccess={handleSubjectAdded}
        preSelectedClassId={selectedClass?.id ?? null}
      />
      <ConfirmDialog {...dialogProps} />
    </>
  )

  // ── VIEW: SUBJECTS LIST ──
  if (view === 'subjects') {
    const listToRender = selectedClass ? currentClassMappings : unassignedGlobals

    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-24">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard/subjects')} className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#121827] border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">
                {selectedClass ? `Subjects / ${selectedClass.name}` : 'Global Subject Engine'}
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                {selectedClass ? 'Manage subjects mapped to this class.' : 'Manage all unassigned subjects.'}
              </p>
            </div>
          </div>
          <button 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-4 h-4" /> Add Subject
          </button>
        </div>

        {listToRender.length === 0 ? (
          <div className="text-center py-20 bg-[#121827] border border-slate-800 rounded-3xl">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 mx-auto flex items-center justify-center mb-4">
              <BookMarked className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-200">No subjects found</h2>
            <p className="text-sm text-slate-400 mt-2 mb-6 max-w-xs mx-auto">
              Add a subject {selectedClass && `to ${selectedClass.name}`} to get started.
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors" onClick={() => setIsModalOpen(true)}>
              Assign Subjects
            </button>
          </div>
        ) : (
          <div className="bg-[#121827] border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/50 shadow-sm">
            {listToRender.map((item: any) => {
              const globalSub = selectedClass ? globalList.find(g => g.id === item.subject_id) : item
              if (!globalSub) return null
              const teacherName = selectedClass ? item.users?.full_name : null

              return (
                <button
                  key={item.id}
                  onClick={() => selectedClass ? handleSelectMapping(item) : handleSelectGlobal(globalSub)}
                  className="w-full flex items-center justify-between p-4 hover:bg-[#1a2133] transition-colors group text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                      <BookMarked className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-200 text-sm">{globalSub.name}</p>
                      {selectedClass && (
                        <p className="text-xs text-slate-400 mt-0.5 font-mono">
                          Teacher: <span className="text-slate-300 font-sans">{teacherName || 'None assigned'}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline-block text-xs font-semibold px-2 py-1 bg-slate-800 text-slate-300 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      Manage
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors shrink-0" />
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Global List (only in bulk mode) */}
        {!selectedClass && (
          <div className="mt-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-4 px-1">All Mapped Subjects</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {globalList.filter(g => mappings.some(m => m.subject_id === g.id)).map(g => (
                <div key={g.id} className="p-4 rounded-xl border border-slate-800 bg-[#0b0f19] flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-200 text-sm">{g.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{mappings.filter(m => m.subject_id === g.id).length} classes mapped</p>
                  </div>
                  <button onClick={() => handleSelectGlobal(g)} className="p-1.5 text-slate-400 hover:text-blue-400 bg-[#121827] rounded-lg transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {sharedOverlays}
      </div>
    )
  }

  // ── VIEW: DETAIL ──
  if (view === 'detail') {
    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-24">
        <button onClick={() => setView('subjects')} className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors w-fit">
          <div className="w-8 h-8 rounded-lg bg-[#121827] border border-slate-800 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Back to list
        </button>

        <div className="bg-[#121827] border border-slate-800 rounded-3xl p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl pointer-events-none" />
          <div className="flex items-start justify-between gap-6 flex-wrap relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <BookMarked className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-100">{selectedGlobal?.name}</h2>
                <p className="text-sm text-slate-400 mt-1">
                  {selectedClass ? `Assigned to ${selectedClass.name}` : 'Global Subject Engine'}
                </p>
              </div>
            </div>
            {selectedMapping ? (
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors shrink-0 border border-transparent hover:border-red-500/20" onClick={() => handleRemoveFromClass(selectedMapping.id)}>
                <Trash2 className="w-4 h-4" /> Remove from Class
              </button>
            ) : (
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors shrink-0 border border-transparent hover:border-red-500/20" onClick={() => handleDeleteGlobal(selectedGlobal.id)}>
                <Trash2 className="w-4 h-4" /> Delete Subject
              </button>
            )}
          </div>

          {selectedMapping && (
            <>
              <hr className="my-6 border-slate-800/50" />
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Subject Teacher</h3>
                  <div className="bg-[#0b0f19] rounded-2xl border border-slate-800 p-4 relative overflow-hidden">
                    <div className="absolute inset-y-0 left-0 w-1 bg-blue-500" />
                    {assignMode ? (
                      <div className="space-y-4">
                        <select
                          value={selectedTeacherId}
                          onChange={e => setSelectedTeacherId(e.target.value)}
                          className="w-full bg-[#121827] border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">No teacher (unassign)</option>
                          {teachers.map(t => (
                            <option key={t.id} value={t.id}>{t.full_name}</option>
                          ))}
                        </select>
                        {assignError && <p className="text-xs text-red-400">{assignError}</p>}
                        <div className="flex gap-2">
                          <button onClick={handleAssignTeacher} disabled={assigning} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 min-w-[100px]">
                            {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                          </button>
                          <button onClick={() => setAssignMode(false)} className="px-4 py-2 bg-[#1a2133] hover:bg-[#232b40] text-slate-300 text-sm font-semibold rounded-xl transition-colors">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between ml-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-sm">
                            {selectedMapping.users ? selectedMapping.users.full_name.substring(0, 2).toUpperCase() : '—'}
                          </div>
                          <p className="font-semibold text-slate-200 text-sm">{selectedMapping.users?.full_name || 'No teacher assigned'}</p>
                        </div>
                        <button className="px-3 py-1.5 bg-[#1a2133] hover:bg-[#232b40] text-slate-300 text-xs font-semibold rounded-lg transition-colors border border-slate-700" onClick={openAssignMode}>
                          {selectedMapping.users ? 'Change' : 'Assign'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {!selectedMapping && selectedGlobal && (
            <>
              <hr className="my-6 border-slate-800/50" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Quick Map to Classes</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-2">
                {classes.map(cls => {
                  const isAssigned = mappings.some(m => m.class_id === cls.id && m.subject_id === selectedGlobal.id)
                  if (isAssigned) return null
                  
                  return (
                    <div key={cls.id} className="flex items-center justify-between p-3 bg-[#0b0f19] border border-slate-800 rounded-xl">
                      <span className="font-medium text-slate-200 text-sm">{cls.name}</span>
                      <button className="px-2.5 py-1 bg-[#1a2133] hover:bg-blue-600 hover:text-white border border-slate-700 hover:border-blue-500 text-slate-300 text-xs font-semibold rounded-lg transition-all" onClick={() => {
                        setSelectedClass(cls)
                        setIsModalOpen(true)
                      }}>
                        Map
                      </button>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {sharedOverlays}
      </div>
    )
  }

  return null
}
