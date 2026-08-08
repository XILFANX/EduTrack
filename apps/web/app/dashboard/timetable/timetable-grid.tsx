'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Coffee, Clock, AlertTriangle, CheckCircle2, Loader2,
  Settings, ChevronDown, User, BookOpen, X, Save
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { UX } from '@/lib/ux'
import { upsertSlot, clearSlot, publishTimetable, unpublishTimetable } from '@/app/actions/timetable'
import Link from 'next/link'

const DAYS = [
  { num: 1, label: 'Monday', short: 'Mon' },
  { num: 2, label: 'Tuesday', short: 'Tue' },
  { num: 3, label: 'Wednesday', short: 'Wed' },
  { num: 4, label: 'Thursday', short: 'Thu' },
  { num: 5, label: 'Friday', short: 'Fri' },
]

function fmt12(t: string) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

interface Period { id: string; name: string; start_time: string; end_time: string; is_break: boolean }
interface ClassItem { id: string; name: string }
interface Subject { id: string; name: string }
interface Teacher { id: string; full_name: string; role: string }
interface Slot {
  id: string; class_id: string; period_id: string; day_of_week: number;
  subject_id: string | null; teacher_id: string | null; is_published: boolean
  subjects: { name: string } | null; users: { full_name: string } | null
}
interface Term { id: string; name: string; year_id: string; is_active: boolean }
interface Year { id: string; name: string; is_active: boolean }

interface Props {
  schoolId: string
  periods: Period[]
  classes: ClassItem[]
  subjects: Subject[]
  teachers: Teacher[]
  slots: Slot[]
  terms: Term[]
  years: Year[]
  selectedTermId: string
  conflictSlotIds: string[]
  isPublished: boolean
}

// ─── Slot Cell Modal ──────────────────────────────────────────────────────────

function SlotModal({
  open, onClose, period, day, classItem, schoolId, selectedTermId,
  subjects, teachers, currentSlot
}: {
  open: boolean
  onClose: () => void
  period: Period
  day: typeof DAYS[0]
  classItem: ClassItem
  schoolId: string
  selectedTermId: string
  subjects: Subject[]
  teachers: Teacher[]
  currentSlot: Slot | null
}) {
  const [subjectId, setSubjectId] = useState<string | null>(currentSlot?.subject_id || null)
  const [teacherId, setTeacherId] = useState<string | null>(currentSlot?.teacher_id || null)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const res = await upsertSlot({
      school_id: schoolId,
      class_id: classItem.id,
      period_id: period.id,
      day_of_week: day.num,
      subject_id: subjectId,
      teacher_id: teacherId,
      term_id: selectedTermId || null,
    })
    setSaving(false)
    if (res.error) { UX.errorModal(res.error); return }
    UX.successModal({ title: 'Slot saved' })
    onClose()
  }

  async function handleClear() {
    setSaving(true)
    await clearSlot(classItem.id, period.id, day.num)
    setSaving(false)
    UX.successModal({ title: 'Slot cleared' })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-base">
            <span className="font-black">{classItem.name}</span>
            <span className="text-muted-foreground font-normal mx-2">·</span>
            {day.label}
            <span className="text-muted-foreground font-normal mx-2">·</span>
            {period.name}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">{fmt12(period.start_time)} – {fmt12(period.end_time)}</p>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Subject picker */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <BookOpen className="w-4 h-4 text-blue-600" /> Subject
            </label>
            <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
              <button
                onClick={() => setSubjectId(null)}
                className={`text-left px-3 py-2 rounded-xl border-2 text-xs font-medium transition-all ${
                  subjectId === null
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
                    : 'border-border text-muted-foreground hover:border-cyan-300'
                }`}
              >
                — None —
              </button>
              {subjects.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSubjectId(s.id)}
                  className={`text-left px-3 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                    subjectId === s.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
                      : 'border-border text-foreground hover:border-cyan-300'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Teacher picker */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <User className="w-4 h-4 text-blue-600" /> Teacher
            </label>
            <div className="grid grid-cols-1 gap-1 max-h-36 overflow-y-auto pr-1">
              <button
                onClick={() => setTeacherId(null)}
                className={`text-left px-3 py-2 rounded-xl border-2 text-xs font-medium transition-all ${
                  teacherId === null
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
                    : 'border-border text-muted-foreground hover:border-cyan-300'
                }`}
              >
                — Unassigned —
              </button>
              {teachers.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTeacherId(t.id)}
                  className={`text-left px-3 py-2 rounded-xl border-2 text-xs font-semibold transition-all flex items-center justify-between ${
                    teacherId === t.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
                      : 'border-border text-foreground hover:border-cyan-300'
                  }`}
                >
                  <span>{t.full_name}</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    {t.role === 'class_teacher' ? 'Class' : 'Subject'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border gap-3">
          {currentSlot && (
            <Button variant="ghost" onClick={handleClear} disabled={saving} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl">
              <X className="w-4 h-4 mr-1" /> Clear
            </Button>
          )}
          <div className="flex gap-3 ml-auto">
            <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="rounded-xl bg-[#1D6FEB] hover:bg-[#1558C8] text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Grid ────────────────────────────────────────────────────────────────

export function TimetableGrid({
  schoolId, periods, classes, subjects, teachers, slots,
  terms, years, selectedTermId, conflictSlotIds, isPublished,
}: Props) {
  const router = useRouter()
  const [publishing, startPublish] = useTransition()
  const [cellModal, setCellModal] = useState<{
    open: boolean; period: Period | null; day: typeof DAYS[0] | null; classItem: ClassItem | null
  }>({ open: false, period: null, day: null, classItem: null })

  // Build slot lookup: key = `classId::periodId::dayNum`
  const slotMap: Record<string, Slot> = {}
  for (const s of slots) {
    slotMap[`${s.class_id}::${s.period_id}::${s.day_of_week}`] = s
  }
  const conflictSet = new Set(conflictSlotIds)

  function openCell(period: Period, day: typeof DAYS[0], classItem: ClassItem) {
    if (period.is_break) return
    setCellModal({ open: true, period, day, classItem })
  }

  function handlePublish() {
    if (!selectedTermId) return
    startPublish(async () => {
      const res = isPublished
        ? await unpublishTimetable(schoolId, selectedTermId)
        : await publishTimetable(schoolId, selectedTermId)
      if (res.error) { UX.errorModal(res.error); return }
      UX.successModal({ title: isPublished ? 'Timetable unpublished' : 'Timetable published!' })
      router.refresh()
    })
  }

  const selectedTerm = terms.find(t => t.id === selectedTermId)

  if (periods.length === 0) {
    return (
      <div className="text-center py-16 bg-card border-2 border-dashed border-border rounded-3xl">
        <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h3 className="font-semibold text-foreground">No Bell Schedule Yet</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">Set up your school day periods before building the timetable.</p>
        <Link href="/dashboard/timetable?view=setup">
          <Button className="rounded-xl bg-[#1D6FEB] hover:bg-[#1558C8] text-white gap-2">
            <Settings className="w-4 h-4" /> Configure Bell Schedule
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Term selector */}
          <div className="relative">
            <select
              value={selectedTermId}
              onChange={e => router.push(`/dashboard/timetable?term=${e.target.value}`)}
              className="appearance-none pl-4 pr-9 py-2 text-sm font-semibold bg-card border border-border rounded-xl text-foreground cursor-pointer hover:border-blue-500/50 transition-colors"
            >
              {terms.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>

          <Link
            href="/dashboard/timetable?view=setup"
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-border rounded-xl text-foreground hover:bg-slate-50 dark:hover:bg-[#0d1b2e] transition-colors"
          >
            <Settings className="w-4 h-4" /> Bell Schedule
          </Link>
        </div>

        <Button
          onClick={handlePublish}
          disabled={publishing || !selectedTermId}
          className={`rounded-xl gap-2 ${isPublished
            ? 'bg-slate-700 hover:bg-slate-600 text-white'
            : 'bg-[#1D6FEB] hover:bg-[#1558C8] text-white'
          }`}
        >
          {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : isPublished ? <X className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {isPublished ? 'Unpublish' : 'Publish Timetable'}
        </Button>
      </div>

      {/* Conflict banner */}
      {conflictSet.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-2xl">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-700 dark:text-red-400">Teacher Conflicts Detected</p>
            <p className="text-xs text-red-600 dark:text-red-500">One or more teachers are assigned to multiple classes at the same time. Highlighted in red below.</p>
          </div>
        </div>
      )}

      {/* School-wide grid: rows = Classes, columns = Day × Period */}
      <div className="overflow-x-auto rounded-3xl border border-border shadow-sm bg-card">
        <table className="w-full text-sm border-collapse" style={{ minWidth: `${120 + DAYS.length * periods.length * 100}px` }}>
          <thead>
            <tr>
              {/* Class label column */}
              <th className="sticky left-0 z-20 bg-card border-b border-r border-border px-4 py-3 text-left font-bold text-muted-foreground text-xs uppercase tracking-wider min-w-[120px]">
                Class
              </th>
              {/* One column per Day × Period (non-break only for subject assignment) */}
              {DAYS.map(day => (
                periods.map(period => (
                  <th
                    key={`${day.num}-${period.id}`}
                    className={`border-b border-r border-border px-2 py-2 text-center min-w-[90px] last:border-r-0 ${period.is_break ? 'bg-blue-50/50 dark:bg-blue-950/10' : ''}`}
                  >
                    <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{day.short}</div>
                    <div className="text-[10px] text-muted-foreground font-medium mt-0.5">{period.name}</div>
                    {!period.is_break && (
                      <div className="text-[9px] text-slate-400">{fmt12(period.start_time)}</div>
                    )}
                  </th>
                ))
              ))}
            </tr>
          </thead>
          <tbody>
            {classes.map((cls, clsIdx) => (
              <tr key={cls.id} className={clsIdx % 2 === 0 ? '' : 'bg-slate-50/40 dark:bg-[#060d1a]/20'}>
                {/* Class name */}
                <td className="sticky left-0 z-10 bg-card border-b border-r border-border px-4 py-3">
                  {clsIdx % 2 !== 0 && <div className="absolute inset-0 bg-slate-50/40 dark:bg-[#060d1a]/20" />}
                  <span className="relative font-bold text-sm text-foreground">{cls.name}</span>
                </td>

                {/* Slot cells */}
                {DAYS.map(day => (
                  periods.map(period => {
                    const slot = slotMap[`${cls.id}::${period.id}::${day.num}`]
                    const isConflict = slot && conflictSet.has(slot.id)

                    return (
                      <td
                        key={`${day.num}-${period.id}`}
                        className={`border-b border-r border-border last:border-r-0 p-1 ${period.is_break ? 'bg-blue-50/50 dark:bg-blue-950/10' : ''}`}
                        onClick={() => openCell(period, day, cls)}
                      >
                        {period.is_break ? (
                          <div className="rounded-lg bg-red-100/60 dark:bg-blue-900/20 px-1 py-2 text-center cursor-default">
                            <Coffee className="w-3 h-3 text-red-400 mx-auto" />
                          </div>
                        ) : slot?.subject_id ? (
                          <div className={`rounded-lg border px-1.5 py-1.5 cursor-pointer transition-all hover:opacity-80 ${
                            isConflict
                              ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-700'
                              : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/40'
                          }`}>
                            <p className={`text-[10px] font-bold leading-tight text-center ${isConflict ? 'text-red-700 dark:text-red-300' : 'text-cyan-800 dark:text-blue-100'}`}>
                              {slot.subjects?.name}
                            </p>
                            {slot.users?.full_name && (
                              <p className={`text-[9px] text-center mt-0.5 truncate ${isConflict ? 'text-red-500' : 'text-blue-600'}`}>
                                {slot.users.full_name}
                              </p>
                            )}
                            {isConflict && (
                              <AlertTriangle className="w-2.5 h-2.5 text-red-500 mx-auto mt-0.5" />
                            )}
                          </div>
                        ) : (
                          <div className="rounded-lg border-2 border-dashed border-slate-200 dark:border-[#1a2744] px-1 py-3 text-center cursor-pointer hover:border-cyan-400 hover:bg-blue-50/50 dark:hover:bg-cyan-950/20 transition-all group/cell">
                            <span className="text-[10px] text-slate-300 group-hover/cell:text-blue-500 transition-colors">+</span>
                          </div>
                        )}
                      </td>
                    )
                  })
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800" />
          <span>Subject assigned</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded border-2 border-dashed border-slate-300" />
          <span>Empty slot — click to assign</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-100 dark:bg-red-950/30 border border-red-300" />
          <span>Teacher conflict</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-100/60 dark:bg-blue-900/20" />
          <span>Break</span>
        </div>
      </div>

      {/* Slot Modal */}
      {cellModal.open && cellModal.period && cellModal.day && cellModal.classItem && (
        <SlotModal
          open={cellModal.open}
          onClose={() => { setCellModal({ open: false, period: null, day: null, classItem: null }); router.refresh() }}
          period={cellModal.period}
          day={cellModal.day}
          classItem={cellModal.classItem}
          schoolId={schoolId}
          selectedTermId={selectedTermId}
          subjects={subjects}
          teachers={teachers}
          currentSlot={slotMap[`${cellModal.classItem.id}::${cellModal.period.id}::${cellModal.day.num}`] || null}
        />
      )}
    </div>
  )
}
