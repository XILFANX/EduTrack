'use client'

import { useState, useMemo } from 'react'
import { Plus, Edit2, Trash2, Loader2, Globe, GraduationCap, BookOpen, AlertCircle, Sliders } from 'lucide-react'
import { createGradeScale, updateGradeScale, deleteGradeScale } from '@/app/actions/grading'
import { toast } from 'sonner'
import { ConfirmDialog, useConfirmDialog } from '@/components/ui/confirm-dialog'

interface GradeScale {
  id: string
  school_id: string
  class_id: string | null
  subject_id: string | null
  grade: string
  label: string | null
  remarks: string | null
  points: number
  min_score: number
  max_score: number
}

interface Props {
  allScales: GradeScale[]
  classes: { id: string; name: string }[]
  subjects: { id: string; name: string }[]
  schoolId: string
  initialClassId: string | null
  initialSubjectId: string | null
}

export function GradingClient({ allScales, classes, subjects, schoolId, initialClassId, initialSubjectId }: Props) {
  const [scales, setScales] = useState<GradeScale[]>(allScales)
  const [scope, setScope] = useState<'global' | 'class' | 'subject'>('global')
  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId || (classes[0]?.id || ''))
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubjectId || (subjects[0]?.id || ''))

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [editingScale, setEditingScale] = useState<GradeScale | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form State
  const [grade, setGrade] = useState('')
  const [label, setLabel] = useState('')
  const [minScore, setMinScore] = useState<number | ''>('')
  const [maxScore, setMaxScore] = useState<number | ''>('')
  const [points, setPoints] = useState<number | ''>('')
  const [remarks, setRemarks] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { confirm, dialogProps } = useConfirmDialog()

  // Filter scales based on active scope
  const activeScales = useMemo(() => {
    let filtered = scales
    if (scope === 'global') {
      filtered = scales.filter(s => s.class_id === null && s.subject_id === null)
    } else if (scope === 'class') {
      filtered = scales.filter(s => s.class_id === selectedClassId && s.subject_id === null)
    } else if (scope === 'subject') {
      filtered = scales.filter(s => s.class_id === selectedClassId && s.subject_id === selectedSubjectId)
    }
    return filtered.sort((a, b) => b.min_score - a.min_score)
  }, [scales, scope, selectedClassId, selectedSubjectId])

  const openAddModal = () => {
    setEditingScale(null)
    setGrade('')
    setLabel('')
    setMinScore('')
    setMaxScore('')
    setPoints('')
    setRemarks('')
    setError(null)
    setShowModal(true)
  }

  const openEditModal = (scale: GradeScale) => {
    setEditingScale(scale)
    setGrade(scale.grade)
    setLabel(scale.label || '')
    setMinScore(scale.min_score)
    setMaxScore(scale.max_score)
    setPoints(scale.points)
    setRemarks(scale.remarks || '')
    setError(null)
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (minScore === '' || maxScore === '' || points === '') return
    if (minScore > maxScore) {
      setError('Minimum score cannot be greater than maximum score.')
      return
    }

    setSubmitting(true)
    setError(null)

    // Determine scope values for new scales
    const scopeClassId = scope === 'global' ? undefined : selectedClassId
    const scopeSubjectId = scope === 'subject' ? selectedSubjectId : undefined

    try {
      if (editingScale) {
        const payload = {
          grade,
          label: label || undefined,
          min_score: Number(minScore),
          max_score: Number(maxScore),
          points: Number(points),
          remarks: remarks || undefined
        }
        const res = await updateGradeScale(editingScale.id, payload)
        if (res.error) throw new Error(res.error)
        
        setScales(prev => prev.map(s => s.id === editingScale.id ? { ...s, ...payload, label: payload.label || null, remarks: payload.remarks || null } : s))
        toast.success('Grade scale updated')
      } else {
        const payload = {
          school_id: schoolId,
          class_id: scopeClassId,
          subject_id: scopeSubjectId,
          grade,
          label: label || undefined,
          min_score: Number(minScore),
          max_score: Number(maxScore),
          points: Number(points),
          remarks: remarks || undefined
        }
        const res = await createGradeScale(payload)
        if (res.error) throw new Error(res.error)
        
        // Optimistic update requires the new ID, so best to reload or just append if backend returned it (updateGradeScale action needs to return data ideally).
        // For now, reload to get the new scale ID accurately.
        window.location.reload()
      }
      setShowModal(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete Grade Scale',
      description: 'Are you sure you want to delete this grade boundary? This may affect student result calculations if they fall in this range.',
      confirmLabel: 'Delete',
      variant: 'danger'
    })
    if (!ok) return

    setDeletingId(id)
    const res = await deleteGradeScale(id)
    setDeletingId(null)
    
    if (res.error) {
      toast.error(res.error)
    } else {
      setScales(prev => prev.filter(s => s.id !== id))
      toast.success('Grade scale deleted')
    }
  }

  return (
    <div className="space-y-8">
      {/* Scope Selector Tabs */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex bg-[#121827] border border-slate-800 p-1 rounded-xl w-fit shadow-sm">
          <button
            onClick={() => setScope('global')}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
              scope === 'global' ? 'bg-[#1a2133] text-blue-400 border border-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a2133]/50'
            }`}
          >
            <Globe className="w-4 h-4" /> Global Default
          </button>
          <button
            onClick={() => setScope('class')}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
              scope === 'class' ? 'bg-[#1a2133] text-purple-400 border border-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a2133]/50'
            }`}
          >
            <GraduationCap className="w-4 h-4" /> Class Override
          </button>
          <button
            onClick={() => setScope('subject')}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
              scope === 'subject' ? 'bg-[#1a2133] text-emerald-400 border border-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a2133]/50'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Subject Override
          </button>
        </div>
      </div>

      {/* Scope Context Filters */}
      {(scope === 'class' || scope === 'subject') && (
        <div className="p-4 bg-[#121827] border border-slate-800 rounded-2xl flex flex-col sm:flex-row gap-4 shadow-sm">
          <div className="flex-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Select Class Context</label>
            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              className="w-full bg-[#0b0f19] border border-slate-800 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          
          {scope === 'subject' && (
            <div className="flex-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Select Subject Context</label>
              <select
                value={selectedSubjectId}
                onChange={e => setSelectedSubjectId(e.target.value)}
                className="w-full bg-[#0b0f19] border border-slate-800 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Table Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              {scope === 'global' && 'Global Grade Boundaries'}
              {scope === 'class' && 'Class-Specific Boundaries'}
              {scope === 'subject' && 'Subject-Specific Boundaries'}
            </h2>
            <p className="text-sm text-slate-400">
              {scope === 'global' && 'Applies to all classes unless a specific override exists.'}
              {scope === 'class' && `Overrides global settings for ${classes.find(c => c.id === selectedClassId)?.name}.`}
              {scope === 'subject' && `Highest priority override for ${subjects.find(s => s.id === selectedSubjectId)?.name} in ${classes.find(c => c.id === selectedClassId)?.name}.`}
            </p>
          </div>
          <button 
            onClick={openAddModal} 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Grade Bound
          </button>
        </div>

        {activeScales.length === 0 ? (
          <div className="text-center py-16 bg-[#121827] border border-slate-800 rounded-3xl">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/50 mx-auto flex items-center justify-center mb-4">
              <Sliders className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="font-semibold text-slate-200">No Custom Boundaries</h3>
            <p className="text-sm text-slate-400 mt-1 mb-6 max-w-sm mx-auto">
              {scope === 'global' 
                ? 'You have not defined a global grading scale yet. Exam results will fail to calculate without one.'
                : 'This scope is using the fallback boundaries (either class or global).'}
            </p>
            <button onClick={openAddModal} className="px-5 py-2.5 bg-[#1a2133] hover:bg-[#232b40] border border-slate-700 hover:border-slate-600 text-slate-300 text-sm font-semibold rounded-xl transition-colors">
              {scope === 'global' ? 'Set Up Global Scale' : 'Create Override'}
            </button>
          </div>
        ) : (
          <div className="bg-[#121827] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-[#0b0f19] border-b border-slate-800/60 text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Grade</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Label</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Score Range</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Points</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Remarks</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {activeScales.map((s) => (
                    <tr key={s.id} className="hover:bg-[#1a2133] transition-colors group">
                      <td className="px-6 py-4 font-bold">
                        <span className="inline-flex items-center justify-center min-w-[2.5rem] h-8 px-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                          {s.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-300">{s.label || '—'}</td>
                      <td className="px-6 py-4 text-slate-300">{s.min_score}% — {s.max_score}%</td>
                      <td className="px-6 py-4 font-mono text-slate-400">{s.points}</td>
                      <td className="px-6 py-4 text-slate-400">{s.remarks || '—'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => openEditModal(s)}
                            className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(s.id)}
                            disabled={deletingId === s.id}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {deletingId === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#121827] border border-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
              <h3 className="font-bold text-slate-100 text-lg">
                {editingScale ? 'Edit Grade Boundary' : 'Add Grade Boundary'}
              </h3>
            </div>
            
            <div className="p-5 overflow-y-auto">
              <form id="grade-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Grade Symbol *</label>
                    <input 
                      type="text" required placeholder="e.g. A, B+, D1"
                      value={grade} onChange={e => setGrade(e.target.value)}
                      className="w-full bg-[#0b0f19] border border-slate-700 text-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Label (Optional)</label>
                    <input 
                      type="text" placeholder="e.g. Distinction"
                      value={label} onChange={e => setLabel(e.target.value)}
                      className="w-full bg-[#0b0f19] border border-slate-700 text-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Min Score (%) *</label>
                    <input 
                      type="number" step="0.01" min="0" max="100" required placeholder="0"
                      value={minScore} onChange={e => setMinScore(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-[#0b0f19] border border-slate-700 text-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Max Score (%) *</label>
                    <input 
                      type="number" step="0.01" min="0" max="100" required placeholder="100"
                      value={maxScore} onChange={e => setMaxScore(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-[#0b0f19] border border-slate-700 text-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Points / Weight *</label>
                    <input 
                      type="number" step="0.1" min="0" required placeholder="e.g. 12 or 4"
                      value={points} onChange={e => setPoints(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-[#0b0f19] border border-slate-700 text-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center pt-6">
                    <span className="text-xs text-slate-500 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" /> Used for GPA calcs
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Remarks (Optional)</label>
                  <input 
                    type="text" placeholder="e.g. Excellent work, Needs Improvement"
                    value={remarks} onChange={e => setRemarks(e.target.value)}
                    className="w-full bg-[#0b0f19] border border-slate-700 text-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}
              </form>
            </div>

            <div className="p-5 border-t border-slate-800 flex justify-end gap-3 shrink-0 bg-[#121827]">
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="grade-form"
                disabled={submitting}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Grade Boundary'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <ConfirmDialog {...dialogProps} />
    </div>
  )
}
