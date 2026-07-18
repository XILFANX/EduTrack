'use client'

import { useState, useTransition } from 'react'
import { Plus, Clock, Loader2, Edit2, Trash2, Save, X, GripVertical, Coffee } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useConfirmDialog, ConfirmDialog } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'
import {
  createPeriod, updatePeriod, deletePeriod,
  upsertSlot, clearSlot
} from '@/app/actions/timetable'

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = [
  { num: 1, label: 'Monday',    short: 'Mon' },
  { num: 2, label: 'Tuesday',   short: 'Tue' },
  { num: 3, label: 'Wednesday', short: 'Wed' },
  { num: 4, label: 'Thursday',  short: 'Thu' },
  { num: 5, label: 'Friday',    short: 'Fri' },
]

const DAY_COLORS: Record<number, string> = {
  1: 'from-blue-500 to-blue-600',
  2: 'from-indigo-500 to-indigo-600',
  3: 'from-violet-500 to-violet-600',
  4: 'from-purple-500 to-purple-600',
  5: 'from-fuchsia-500 to-fuchsia-600',
}

const SUBJECT_PALETTE = [
  'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/40 dark:border-blue-800/50 dark:text-blue-300',
  'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800/50 dark:text-emerald-300',
  'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800/50 dark:text-amber-300',
  'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800/50 dark:text-rose-300',
  'bg-cyan-50 border-cyan-200 text-cyan-800 dark:bg-cyan-950/40 dark:border-cyan-800/50 dark:text-cyan-300',
  'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-950/40 dark:border-purple-800/50 dark:text-purple-300',
  'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-950/40 dark:border-orange-800/50 dark:text-orange-300',
  'bg-teal-50 border-teal-200 text-teal-800 dark:bg-teal-950/40 dark:border-teal-800/50 dark:text-teal-300',
]

function subjectColor(subjectId: string | null | undefined, subjects: any[]) {
  if (!subjectId) return ''
  const idx = subjects.findIndex(s => s.id === subjectId)
  return SUBJECT_PALETTE[idx % SUBJECT_PALETTE.length] || SUBJECT_PALETTE[0]
}

function fmt12(time24: string) {
  const [h, m] = time24.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Period { id: string; name: string; start_time: string; end_time: string; is_break: boolean; sort_order: number }
interface Slot { id: string; class_id: string; period_id: string; day_of_week: number; subject_id: string | null; subjects: { name: string } | null }
interface ClassItem { id: string; name: string }
interface Subject { id: string; name: string }

interface Props {
  schoolId: string
  classes: ClassItem[]
  initialPeriods: Period[]
  subjects: Subject[]
  initialSlots: Slot[]
  selectedClassId: string
}

// ─── Period Form Modal ────────────────────────────────────────────────────────

function PeriodModal({
  open, onClose, existing, schoolId
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
      toast.success('Period updated')
      onClose({ ...existing, name: name.trim(), start_time: start, end_time: end, is_break: isBreak })
    } else {
      const res = await createPeriod({ school_id: schoolId, name: name.trim(), start_time: start, end_time: end, is_break: isBreak })
      setSaving(false)
      if (res.error) { setErr(res.error); return }
      toast.success('Period created')
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[400px] rounded-3xl">
        <DialogHeader>
          <DialogTitle>{existing ? 'Edit Period' : 'Add New Period'}</DialogTitle>
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

          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-border hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
            <input
              type="checkbox"
              checked={isBreak}
              onChange={e => setIsBreak(e.target.checked)}
              className="w-4 h-4 accent-amber-500"
            />
            <div>
              <p className="text-sm font-medium text-foreground">This is a break / lunch slot</p>
              <p className="text-xs text-muted-foreground">Break slots won't require a subject to be assigned.</p>
            </div>
          </label>

          {err && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800">{err}</p>}

          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onClose()} className="rounded-xl">Cancel</Button>
            <Button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {existing ? 'Save Changes' : 'Add Period'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Slot Picker Modal ────────────────────────────────────────────────────────

function SlotModal({
  open, onClose, period, day, subjects, currentSubjectId, classId, schoolId
}: {
  open: boolean
  onClose: () => void
  period: Period
  day: typeof DAYS[0]
  subjects: Subject[]
  currentSubjectId: string | null | undefined
  classId: string
  schoolId: string
}) {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(currentSubjectId || null)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const res = await upsertSlot({
      school_id: schoolId,
      class_id: classId,
      period_id: period.id,
      day_of_week: day.num,
      subject_id: selectedSubject,
    })
    setSaving(false)
    if (res.error) { toast.error(res.error); return }
    toast.success('Timetable updated')
    onClose()
  }

  async function handleClear() {
    setSaving(true)
    await clearSlot(classId, period.id, day.num)
    setSaving(false)
    toast.success('Slot cleared')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px] rounded-3xl">
        <DialogHeader>
          <DialogTitle>
            {day.label} · <span className="text-muted-foreground font-normal">{period.name}</span>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{fmt12(period.start_time)} – {fmt12(period.end_time)}</p>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <p className="text-sm font-medium text-foreground">Choose a subject:</p>
          <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
            <button
              onClick={() => setSelectedSubject(null)}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
                selectedSubject === null
                  ? 'border-slate-500 bg-slate-50 dark:bg-slate-900 text-foreground'
                  : 'border-transparent bg-slate-50 dark:bg-slate-900 text-muted-foreground hover:border-slate-300'
              }`}
            >
              — None / Free Period —
            </button>
            {subjects.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setSelectedSubject(s.id)}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm font-semibold ${
                  selectedSubject === s.id
                    ? 'border-current ' + SUBJECT_PALETTE[idx % SUBJECT_PALETTE.length]
                    : 'border-transparent ' + SUBJECT_PALETTE[idx % SUBJECT_PALETTE.length] + ' opacity-60 hover:opacity-100'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border gap-3">
          {currentSubjectId && (
            <Button
              variant="ghost"
              onClick={handleClear}
              disabled={saving}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl"
            >
              <X className="w-4 h-4 mr-1" /> Clear Slot
            </Button>
          )}
          <div className="flex gap-3 ml-auto">
            <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TimetableBuilder({
  schoolId, classes, initialPeriods, subjects, initialSlots, selectedClassId
}: Props) {
  const [periods, setPeriods] = useState<Period[]>(initialPeriods)
  const [slots, setSlots] = useState<Slot[]>(initialSlots)

  // Period modal state
  const [periodModal, setPeriodModal] = useState<{ open: boolean; existing: Period | null }>({ open: false, existing: null })

  // Slot modal state
  const [slotModal, setSlotModal] = useState<{ open: boolean; period: Period | null; day: typeof DAYS[0] | null }>({
    open: false, period: null, day: null
  })

  const { dialogProps, confirm } = useConfirmDialog()

  // Build a quick lookup for slots
  const slotMap: Record<string, Slot> = {}
  for (const slot of slots) {
    slotMap[`${slot.period_id}-${slot.day_of_week}`] = slot
  }

  function openSlotModal(period: Period, day: typeof DAYS[0]) {
    if (period.is_break) return  // No subject for breaks
    setSlotModal({ open: true, period, day })
  }

  function handleSlotModalClose() {
    setSlotModal({ open: false, period: null, day: null })
    // Force data re-fetch by refreshing
    window.location.reload()
  }

  async function handleDeletePeriod(period: Period) {
    const ok = await confirm({
      title: 'Delete Period',
      description: `Delete "${period.name}"? All timetable slots in this period will also be removed.`,
      confirmLabel: 'Delete Period',
      variant: 'danger',
    })
    if (!ok) return

    const res = await deletePeriod(period.id)
    if (res.error) { toast.error(res.error); return }
    setPeriods(prev => prev.filter(p => p.id !== period.id))
    setSlots(prev => prev.filter(s => s.period_id !== period.id))
    toast.success('Period deleted')
  }

  function handlePeriodModalClose(updated?: Period) {
    setPeriodModal({ open: false, existing: null })
    if (updated) {
      setPeriods(prev => prev.map(p => p.id === updated.id ? updated : p))
    } else {
      // New period created — reload to get fresh data with ID
      window.location.reload()
    }
  }

  const classObj = classes.find(c => c.id === selectedClassId)

  return (
    <div className="space-y-8">
      {/* ── Period Setup ─────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">1. Set Up Your School Day</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Define the time periods (lessons, breaks, assemblies) that make up your school day. These periods are shared across all classes.</p>
          </div>
          <Button
            onClick={() => setPeriodModal({ open: true, existing: null })}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 rounded-xl"
          >
            <Plus className="w-4 h-4" />
            Add Period
          </Button>
        </div>

        {periods.length === 0 ? (
          <div className="text-center py-12 bg-card border-2 border-dashed border-border rounded-3xl">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground">No Periods Yet</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Start by adding time periods for your school day (e.g., Period 1, Break, Period 2).</p>
            <Button onClick={() => setPeriodModal({ open: true, existing: null })} variant="outline" className="rounded-xl border-dashed border-2">
              <Plus className="w-4 h-4 mr-2" />
              Add First Period
            </Button>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
            {periods.map((period, idx) => (
              <div
                key={period.id}
                className={`flex items-center gap-4 px-5 py-3.5 ${idx < periods.length - 1 ? 'border-b border-border' : ''} hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors group`}
              >
                <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
                {period.is_break ? (
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                    <Coffee className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{idx + 1}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">{period.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {fmt12(period.start_time)} – {fmt12(period.end_time)}
                    {period.is_break && <span className="ml-2 text-amber-600 dark:text-amber-400 font-medium">· Break</span>}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => setPeriodModal({ open: true, existing: period })}
                    className="h-8 w-8 text-slate-500 hover:text-foreground"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => handleDeletePeriod(period)}
                    className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Timetable Grid ───────────────────────────────────── */}
      {periods.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">2. Build the Weekly Timetable</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {classObj ? <>Click any cell in the <strong>{classObj.name}</strong> grid to assign a subject. Coloured cells mean a subject is already assigned.</> : 'Select a class above, then click any cell to assign subjects.'}
            </p>
          </div>

          {!selectedClassId ? (
            <div className="text-center py-10 bg-card border border-border rounded-3xl">
              <p className="text-muted-foreground text-sm">Select a class above to build its timetable.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-border shadow-sm bg-card">
              <table className="w-full min-w-[640px] text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 bg-slate-50 dark:bg-slate-900 border-b border-r border-border px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider min-w-[140px]">
                      Period / Time
                    </th>
                    {DAYS.map(day => (
                      <th
                        key={day.num}
                        className="border-b border-r border-border px-3 py-3 text-center last:border-r-0"
                      >
                        <div className={`inline-flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl bg-gradient-to-b ${DAY_COLORS[day.num]} text-white text-xs font-semibold min-w-[80px]`}>
                          <span className="hidden sm:block">{day.label}</span>
                          <span className="sm:hidden">{day.short}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periods.map((period, idx) => (
                    <tr key={period.id} className={idx % 2 === 0 ? '' : 'bg-slate-50/40 dark:bg-slate-900/20'}>
                      {/* Period label */}
                      <td className="sticky left-0 z-10 bg-white dark:bg-slate-950 border-b border-r border-border px-4 py-3">
                        {idx % 2 === 0 ? null : <div className="absolute inset-0 bg-slate-50/40 dark:bg-slate-900/20" />}
                        <div className="relative flex items-center gap-2">
                          {period.is_break ? (
                            <Coffee className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          )}
                          <div>
                            <p className="font-semibold text-foreground text-xs">{period.name}</p>
                            <p className="text-[10px] text-muted-foreground">{fmt12(period.start_time)}–{fmt12(period.end_time)}</p>
                          </div>
                        </div>
                      </td>

                      {/* Day cells */}
                      {DAYS.map(day => {
                        const slot = slotMap[`${period.id}-${day.num}`]
                        const subjectName = slot?.subjects?.name
                        const color = subjectColor(slot?.subject_id, subjects)

                        return (
                          <td
                            key={day.num}
                            className="border-b border-r border-border last:border-r-0 p-1.5"
                            onClick={() => openSlotModal(period, day)}
                          >
                            {period.is_break ? (
                              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/30 px-2 py-3 text-center cursor-default">
                                <Coffee className="w-3.5 h-3.5 text-amber-400 mx-auto" />
                              </div>
                            ) : subjectName ? (
                              <div className={`rounded-xl border px-2 py-2 text-center text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity ${color}`}>
                                {subjectName}
                              </div>
                            ) : (
                              <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 px-2 py-3 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/20 transition-all group/cell">
                                <Plus className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 group-hover/cell:text-indigo-400 mx-auto transition-colors" />
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Legend ───────────────────────────────────────────── */}
      {subjects.length > 0 && selectedClassId && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground font-semibold my-auto">Subjects:</span>
          {subjects.map((s, idx) => (
            <span key={s.id} className={`text-xs px-2.5 py-1 rounded-full border font-medium ${SUBJECT_PALETTE[idx % SUBJECT_PALETTE.length]}`}>
              {s.name}
            </span>
          ))}
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────────── */}
      <PeriodModal
        open={periodModal.open}
        onClose={handlePeriodModalClose}
        existing={periodModal.existing}
        schoolId={schoolId}
      />

      {slotModal.open && slotModal.period && slotModal.day && (
        <SlotModal
          open={slotModal.open}
          onClose={handleSlotModalClose}
          period={slotModal.period}
          day={slotModal.day}
          subjects={subjects}
          currentSubjectId={slotMap[`${slotModal.period.id}-${slotModal.day.num}`]?.subject_id}
          classId={selectedClassId}
          schoolId={schoolId}
        />
      )}

      <ConfirmDialog {...dialogProps} />
    </div>
  )
}
