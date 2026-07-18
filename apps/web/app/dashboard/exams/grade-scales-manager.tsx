'use client'

import { useState } from 'react'
import { Plus, Loader2, Trash2, Edit2, Info } from 'lucide-react'
import { createGradeScale, deleteGradeScale, updateGradeScale } from '@/app/actions/grading'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useConfirmDialog, ConfirmDialog } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'

interface GradeScale {
  id: string
  school_id: string
  grade: string
  min_score: number
  max_score: number
  points: number
  remarks: string | null
  created_at: string
}

interface Props {
  schoolId: string
  initialGradeScales: GradeScale[]
}

export function GradeScalesManager({ schoolId, initialGradeScales }: Props) {
  const [scales, setScales] = useState<GradeScale[]>(initialGradeScales)
  const [showModal, setShowModal] = useState(false)
  const [editingScale, setEditingScale] = useState<GradeScale | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form State
  const [grade, setGrade] = useState('')
  const [minScore, setMinScore] = useState<number | ''>('')
  const [maxScore, setMaxScore] = useState<number | ''>('')
  const [points, setPoints] = useState<number | ''>('')
  const [remarks, setRemarks] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { dialogProps, confirm } = useConfirmDialog()

  const openAddModal = () => {
    setEditingScale(null)
    setGrade('')
    setMinScore('')
    setMaxScore('')
    setPoints('')
    setRemarks('')
    setError(null)
    setShowModal(true)
  }

  const openEditModal = (s: GradeScale) => {
    setEditingScale(s)
    setGrade(s.grade)
    setMinScore(s.min_score)
    setMaxScore(s.max_score)
    setPoints(s.points)
    setRemarks(s.remarks || '')
    setError(null)
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!grade || minScore === '' || maxScore === '' || points === '') {
      setError('Please fill in all required fields.')
      return
    }

    if (minScore > maxScore) {
      setError('Min score cannot be greater than max score.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      if (editingScale) {
        const res = await updateGradeScale(editingScale.id, {
          grade, min_score: Number(minScore), max_score: Number(maxScore), points: Number(points), remarks: remarks || undefined
        })
        if (res.error) throw new Error(res.error)
        setScales(prev => prev.map(s => s.id === editingScale.id ? { ...s, grade, min_score: Number(minScore), max_score: Number(maxScore), points: Number(points), remarks: remarks || null } : s).sort((a, b) => b.min_score - a.min_score))
        toast.success('Grade scale updated')
      } else {
        const res = await createGradeScale({
          school_id: schoolId, grade, min_score: Number(minScore), max_score: Number(maxScore), points: Number(points), remarks: remarks || undefined
        })
        if (res.error) throw new Error(res.error)
        toast.success('Grade scale created')
        // Optimistic refresh implies we need server data, but we can just force a reload or do a partial refresh
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
      description: 'Are you sure you want to delete this grade scale?',
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
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="font-semibold text-foreground">Custom Grading System</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Define score ranges and remarks for result cards.</p>
        </div>
        <Button onClick={openAddModal} className="bg-purple-600 hover:bg-purple-700 text-white gap-2 rounded-xl">
          <Plus className="w-4 h-4" />
          Add Grade
        </Button>
      </div>

      {scales.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-3xl">
          <Info className="w-10 h-10 text-slate-300 mx-auto mb-4" />
          <h3 className="font-semibold text-foreground">No Grade Scales</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Add your first grading scale to automate exam grading.</p>
          <Button onClick={openAddModal} variant="outline" className="rounded-xl border-dashed border-2">Create Scale</Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-semibold">Grade</th>
                  <th className="px-6 py-4 font-semibold">Score Range</th>
                  <th className="px-6 py-4 font-semibold">Points</th>
                  <th className="px-6 py-4 font-semibold">Remarks</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {scales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                    <td className="px-6 py-4 font-bold text-foreground">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                        {s.grade}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">{s.min_score} - {s.max_score}</td>
                    <td className="px-6 py-4">{s.points}</td>
                    <td className="px-6 py-4 text-muted-foreground">{s.remarks || '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openEditModal(s)}
                          className="h-8 w-8 text-slate-500 hover:text-foreground"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(s.id)}
                          disabled={deletingId === s.id}
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          {deletingId === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editingScale ? 'Edit Grade Scale' : 'Add Grade Scale'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Grade Symbol *</Label>
              <Input placeholder="e.g. A, B+, Distinction" value={grade} onChange={e => setGrade(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Score *</Label>
                <Input type="number" step="0.01" min="0" max="100" placeholder="0" value={minScore} onChange={e => setMinScore(e.target.value === '' ? '' : Number(e.target.value))} required />
              </div>
              <div className="space-y-2">
                <Label>Max Score *</Label>
                <Input type="number" step="0.01" min="0" max="100" placeholder="100" value={maxScore} onChange={e => setMaxScore(e.target.value === '' ? '' : Number(e.target.value))} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Points / Weight *</Label>
              <Input type="number" step="0.1" min="0" placeholder="e.g. 12 or 4" value={points} onChange={e => setPoints(e.target.value === '' ? '' : Number(e.target.value))} required />
            </div>
            <div className="space-y-2">
              <Label>Remarks (Optional)</Label>
              <Input placeholder="e.g. Excellent, Good, Pass" value={remarks} onChange={e => setRemarks(e.target.value)} />
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">{error}</p>}

            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="rounded-xl">Cancel</Button>
              <Button type="submit" disabled={submitting} className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Grade'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog {...dialogProps} />
    </div>
  )
}
