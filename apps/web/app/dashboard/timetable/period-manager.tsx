'use client'

import { useState } from 'react'
import { Plus, Loader2, Edit2, Trash2, Coffee, Clock, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useConfirmDialog, ConfirmDialog } from '@/components/ui/confirm-dialog'
import { UX } from '@/lib/ux'
import { createPeriod, updatePeriod, deletePeriod } from '@/app/actions/timetable'
import Link from 'next/link'

interface Period {
  id: string
  name: string
  start_time: string
  end_time: string
  is_break: boolean
  sort_order: number
}

interface Props {
  schoolId: string
  initialPeriods: Period[]
}

function fmt12(time24: string) {
  const [h, m] = time24.split(':').map(Number)
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

function PeriodModal({
  open, onClose, existing, schoolId,
}: {
  open: boolean
  onClose: (updated?: Period) => void
  existing: Period | null
  schoolId: string
}) {
  const [name, setName] = useState(existing?.name || '')
  const [start, setStart] = useState(existing?.start_time?.slice(0, 5) || '08:00')
  const [end, setEnd] = useState(existing?.end_time?.slice(0, 5) || '08:45')
  const [isBreak, setIsBreak] = useState(existing?.is_break || false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setErr('Period name is required.'); return }
    if (start >= end) { setErr('End time must be after start time.'); return }
    setSaving(true); setErr(null)

    if (existing) {
      const res = await updatePeriod(existing.id, { name: name.trim(), start_time: start, end_time: end, is_break: isBreak })
      setSaving(false)
      if (res.error) { setErr(res.error); return }
      UX.successModal({ title: 'Period updated' })
      onClose({ ...existing, name: name.trim(), start_time: start, end_time: end, is_break: isBreak })
    } else {
      const res = await createPeriod({ school_id: schoolId, name: name.trim(), start_time: start, end_time: end, is_break: isBreak })
      setSaving(false)
      if (res.error) { setErr(res.error); return }
      UX.successModal({ title: 'Period created' })
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[400px] rounded-3xl">
        <DialogHeader>
          <DialogTitle>{existing ? 'Edit Period' : 'Add Period'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Period Name *</Label>
            <Input placeholder="e.g. Period 1, Break, Assembly" value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Start Time *</Label>
              <Input type="time" value={start} onChange={e => setStart(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Time *</Label>
              <Input type="time" value={end} onChange={e => setEnd(e.target.value)} />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-border hover:bg-slate-50 dark:hover:bg-[#0d1b2e] transition-colors">
            <input
              type="checkbox"
              checked={isBreak}
              onChange={e => setIsBreak(e.target.checked)}
              className="w-4 h-4 accent-blue-500"
            />
            <div>
              <p className="text-sm font-medium text-foreground">Break / Lunch slot</p>
              <p className="text-xs text-muted-foreground">Break slots cannot have a subject assigned.</p>
            </div>
          </label>
          {err && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800">{err}</p>}
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onClose()} className="rounded-xl">Cancel</Button>
            <Button type="submit" disabled={saving} className="rounded-xl bg-[#1D6FEB] hover:bg-[#1558C8] text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {existing ? 'Save Changes' : 'Add Period'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function PeriodManager({ schoolId, initialPeriods }: Props) {
  const [periods, setPeriods] = useState<Period[]>(initialPeriods)
  const [modal, setModal] = useState<{ open: boolean; existing: Period | null }>({ open: false, existing: null })
  const { dialogProps, confirm } = useConfirmDialog()

  async function handleDelete(p: Period) {
    const ok = await confirm({
      title: 'Delete Period',
      description: `Delete "${p.name}"? All timetable slots in this period will also be removed.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    })
    if (!ok) return

    const res = await deletePeriod(p.id)
    if (res.error) { UX.errorModal(res.error); return }
    setPeriods(prev => prev.filter(x => x.id !== p.id))
    UX.successModal({ title: 'Period deleted' })
  }

  function handleClose(updated?: Period) {
    setModal({ open: false, existing: null })
    if (updated) {
      setPeriods(prev => prev.map(p => p.id === updated.id ? updated : p))
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground">Bell Schedule</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Define the periods and breaks that make up your school day. These are shared across all classes.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/timetable"
            className="px-4 py-2 text-sm font-semibold border border-border rounded-xl text-foreground hover:bg-slate-50 dark:hover:bg-[#0d1b2e] transition-colors"
          >
            ← Back to Grid
          </Link>
          <Button
            onClick={() => setModal({ open: true, existing: null })}
            className="bg-[#1D6FEB] hover:bg-[#1558C8] text-white gap-2 rounded-xl"
          >
            <Plus className="w-4 h-4" /> Add Period
          </Button>
        </div>
      </div>

      {periods.length === 0 ? (
        <div className="text-center py-16 bg-card border-2 border-dashed border-border rounded-3xl">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-foreground">No Periods Yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Add periods to define your school day.</p>
          <Button onClick={() => setModal({ open: true, existing: null })} variant="outline" className="rounded-xl border-dashed border-2">
            <Plus className="w-4 h-4 mr-2" /> Add First Period
          </Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          {periods.map((period, idx) => (
            <div
              key={period.id}
              className={`flex items-center gap-4 px-5 py-3.5 ${idx < periods.length - 1 ? 'border-b border-border' : ''} hover:bg-slate-50/50 dark:hover:bg-[#0d1b2e]/20 transition-colors group`}
            >
              <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
              {period.is_break ? (
                <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                  <Coffee className="w-4 h-4 text-red-500" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{idx + 1}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm">{period.name}</p>
                <p className="text-xs text-muted-foreground">
                  {fmt12(period.start_time)} – {fmt12(period.end_time)}
                  {period.is_break && <span className="ml-2 text-red-500 font-medium">· Break</span>}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" onClick={() => setModal({ open: true, existing: period })} className="h-8 w-8 text-slate-500 hover:text-foreground">
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(period)} className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <PeriodModal open={modal.open} onClose={handleClose} existing={modal.existing} schoolId={schoolId} />
      <ConfirmDialog {...dialogProps} />
    </div>
  )
}
