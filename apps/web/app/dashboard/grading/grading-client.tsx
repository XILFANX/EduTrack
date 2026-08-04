'use client'

import { useState } from 'react'
import { Plus, Loader2, Trash2, Edit2, Sliders, Info, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useConfirmDialog, ConfirmDialog } from '@/components/ui/confirm-dialog'
import { UX } from '@/lib/ux'
import { createGradeScale, updateGradeScale, deleteGradeScale } from '@/app/actions/grading'

interface GradeScale {
  id: string
  grade: string
  label?: string
  min_score: number
  max_score: number
  points: number
  remarks?: string | null
}

interface Props {
  schoolId: string
  initialScales: GradeScale[]
}

// Color coding by grade band
function gradeColor(min: number) {
  if (min >= 70) return { bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800/40', text: 'text-emerald-700 dark:text-emerald-300', badge: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' }
  if (min >= 50) return { bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800/40', text: 'text-blue-700 dark:text-blue-300', badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' }
  if (min >= 30) return { bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-200 dark:border-orange-800/40', text: 'text-orange-700 dark:text-orange-300', badge: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300' }
  return { bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800/40', text: 'text-red-700 dark:text-red-300', badge: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' }
}

function ScaleModal({
  open, onClose, existing, schoolId
}: {
  open: boolean
  onClose: (created?: GradeScale) => void
  existing: GradeScale | null
  schoolId: string
}) {
  const [grade, setGrade] = useState(existing?.grade || '')
  const [label, setLabel] = useState(existing?.label || '')
  const [minScore, setMinScore] = useState<number | ''>(existing?.min_score ?? '')
  const [maxScore, setMaxScore] = useState<number | ''>(existing?.max_score ?? '')
  const [points, setPoints] = useState<number | ''>(existing?.points ?? '')
  const [remarks, setRemarks] = useState(existing?.remarks || '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!grade || minScore === '' || maxScore === '' || points === '') {
      setErr('Grade symbol, score range and points are required.')
      return
    }
    if (Number(minScore) > Number(maxScore)) {
      setErr('Min score cannot exceed max score.')
      return
    }
    setSaving(true); setErr(null)

    const payload = {
      school_id: schoolId,
      grade: grade.trim().toUpperCase(),
      label: label.trim() || undefined,
      min_score: Number(minScore),
      max_score: Number(maxScore),
      points: Number(points),
      remarks: remarks.trim() || undefined,
    }

    const res = existing
      ? await updateGradeScale(existing.id, payload)
      : await createGradeScale(payload)

    setSaving(false)
    if (res.error) { setErr(res.error); return }
    UX.successModal({ title: existing ? 'Grade scale updated' : 'Grade scale created' })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[420px] rounded-3xl">
        <DialogHeader>
          <DialogTitle>{existing ? 'Edit Grade Scale' : 'Add Grade Scale'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Grade Symbol * <span className="text-muted-foreground font-normal text-xs">(e.g. A, B+)</span></Label>
              <Input value={grade} onChange={e => setGrade(e.target.value)} placeholder="A" className="uppercase" />
            </div>
            <div className="space-y-2">
              <Label>Label <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
              <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="Excellent" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Min Score *</Label>
              <Input type="number" min={0} max={100} value={minScore} onChange={e => setMinScore(e.target.value === '' ? '' : Number(e.target.value))} placeholder="70" />
            </div>
            <div className="space-y-2">
              <Label>Max Score *</Label>
              <Input type="number" min={0} max={100} value={maxScore} onChange={e => setMaxScore(e.target.value === '' ? '' : Number(e.target.value))} placeholder="100" />
            </div>
            <div className="space-y-2">
              <Label>GPA Points *</Label>
              <Input type="number" min={0} step={0.1} value={points} onChange={e => setPoints(e.target.value === '' ? '' : Number(e.target.value))} placeholder="4.0" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Remarks <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
            <Input value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="e.g. Distinction, Pass, Fail" />
          </div>

          {err && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800">{err}</p>}

          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onClose()} className="rounded-xl">Cancel</Button>
            <Button type="submit" disabled={saving} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {existing ? 'Save Changes' : 'Add Grade'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function GradingClient({ schoolId, initialScales }: Props) {
  const [scales, setScales] = useState<GradeScale[]>(initialScales)
  const [modal, setModal] = useState<{ open: boolean; existing: GradeScale | null }>({ open: false, existing: null })
  const { dialogProps, confirm } = useConfirmDialog()

  async function handleDelete(s: GradeScale) {
    const ok = await confirm({
      title: 'Delete Grade Scale',
      description: `Remove the "${s.grade}" grade? This won't affect existing results.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    })
    if (!ok) return

    const res = await deleteGradeScale(s.id)
    if (res.error) { UX.errorModal(res.error); return }
    setScales(prev => prev.filter(x => x.id !== s.id))
    UX.successModal({ title: 'Grade deleted' })
  }

  function handleClose() {
    setModal({ open: false, existing: null })
    window.location.reload()
  }

  // Check for gaps/overlaps
  const sorted = [...scales].sort((a, b) => b.min_score - a.min_score)
  const hasGap = sorted.some((s, i) => {
    if (i === sorted.length - 1) return false
    return sorted[i + 1].max_score < s.min_score - 1
  })

  return (
    <div className="space-y-6 pb-24">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-blue-500 rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[50px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Grading Engine</h1>
              <p className="text-blue-100 text-sm mt-0.5">Define your school-wide grade boundaries and GPA points</p>
            </div>
          </div>
          <Button
            onClick={() => setModal({ open: true, existing: null })}
            className="bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-xl gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Grade
          </Button>
        </div>
      </div>

      {/* Coverage warning */}
      {hasGap && (
        <div className="flex items-center gap-3 px-4 py-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50 rounded-2xl">
          <Info className="w-5 h-5 text-orange-500 shrink-0" />
          <p className="text-sm text-orange-700 dark:text-orange-400">
            <strong>Gap detected</strong> — some score ranges are not covered by any grade. Students with scores in those ranges will have no grade assigned.
          </p>
        </div>
      )}

      {scales.length === 0 ? (
        <div className="text-center py-16 bg-card border-2 border-dashed border-border rounded-3xl">
          <Sliders className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-foreground">No Grade Scales Defined</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm mx-auto">
            Define your school&apos;s grading system — A, B, C grades with score ranges and GPA points.
          </p>
          <Button onClick={() => setModal({ open: true, existing: null })} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Add First Grade
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Visual scale bar */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Scale Coverage (0–100)</p>
            <div className="flex h-6 rounded-full overflow-hidden gap-0.5 bg-slate-100 dark:bg-slate-800">
              {sorted.map(s => {
                const width = ((s.max_score - s.min_score + 1) / 100) * 100
                const colors = gradeColor(s.min_score)
                return (
                  <div
                    key={s.id}
                    className={`${colors.badge} flex items-center justify-center text-[9px] font-black`}
                    style={{ width: `${width}%` }}
                    title={`${s.grade}: ${s.min_score}–${s.max_score}`}
                  >
                    {width > 6 ? s.grade : ''}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Grade cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sorted.map(s => {
              const colors = gradeColor(s.min_score)
              return (
                <div key={s.id} className={`${colors.bg} border ${colors.border} rounded-2xl p-4 group relative`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${colors.badge}`}>
                        {s.grade}
                      </div>
                      <div>
                        {s.label && <p className={`font-bold text-sm ${colors.text}`}>{s.label}</p>}
                        <p className="text-xs text-muted-foreground font-semibold">{s.min_score}–{s.max_score} marks</p>
                        <p className="text-xs text-muted-foreground">{s.points} GPA pts{s.remarks ? ` · ${s.remarks}` : ''}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setModal({ open: true, existing: s })} className="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-black/20 transition-colors">
                        <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                      </button>
                      <button onClick={() => handleDelete(s)} className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors">
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Coverage summary */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
            <span>{scales.length} grade{scales.length !== 1 ? 's' : ''} defined · Scores covered: {sorted.reduce((a, s) => a + (s.max_score - s.min_score + 1), 0)} of 100 points</span>
          </div>
        </div>
      )}

      <ScaleModal open={modal.open} onClose={handleClose} existing={modal.existing} schoolId={schoolId} />
      <ConfirmDialog {...dialogProps} />
    </div>
  )
}
