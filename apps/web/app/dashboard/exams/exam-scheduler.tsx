'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarDays, Clock, Plus, Trash2, Send, BookOpen, CheckCircle2,
  ChevronDown, ChevronUp, Loader2, Calendar, AlertCircle
} from 'lucide-react'
import { scheduleExamSubject, removeExamScheduleSlot, publishExamSchedule } from '@/app/actions/exam-workflow'

interface Subject { id: string; name: string }
interface ClassItem { id: string; name: string }
interface Slot { id: string; exam_id: string; subject_id: string; class_id: string; exam_date: string; start_time: string; end_time: string }
interface Exam { id: string; name: string; max_score: number; term_id: string | null; year_id: string | null; class_id: string | null; created_at: string }

interface Props {
  exam: Exam
  subjects: Subject[]
  classes: ClassItem[]
  initialSlots: Slot[]
}

function fmt12(time24: string) {
  if (!time24) return ''
  const [h, m] = time24.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
}

const STATUS_BG: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  submitted: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  finalized: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

export function ExamScheduler({ exam, subjects, classes, initialSlots }: Props) {
  const router = useRouter()
  const [slots, setSlots] = useState<Slot[]>(initialSlots)
  const [showForm, setShowForm] = useState(false)
  const [publishing, startPublishing] = useTransition()
  const [saving, startSaving] = useTransition()
  const [removing, setRemoving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [published, setPublished] = useState(false)

  // Form state
  const [subjectId, setSubjectId] = useState('')
  const [classId, setClassId] = useState(exam.class_id || '')
  const [examDate, setExamDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  const handleAddSlot = () => {
    if (!subjectId || !examDate || !startTime || !endTime) {
      setError('Please fill in all fields.')
      return
    }
    setError(null)
    startSaving(async () => {
      try {
        const slot = await scheduleExamSubject({
          examId: exam.id,
          subjectId,
          classId,
          examDate,
          startTime,
          endTime,
        })
        setSlots(prev => {
          const filtered = prev.filter(s => !(s.subject_id === subjectId && s.class_id === classId))
          return [...filtered, slot as any]
        })
        setSubjectId('')
        setExamDate('')
        setStartTime('')
        setEndTime('')
        setShowForm(false)
        router.refresh()
      } catch (e: any) {
        setError(e.message)
      }
    })
  }

  const handleRemove = async (slotId: string) => {
    setRemoving(slotId)
    try {
      await removeExamScheduleSlot(slotId)
      setSlots(prev => prev.filter(s => s.id !== slotId))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setRemoving(null)
    }
  }

  const handlePublish = () => {
    startPublishing(async () => {
      try {
        await publishExamSchedule(exam.id, exam.name)
        setPublished(true)
      } catch (e: any) {
        setError(e.message)
      }
    })
  }

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || '—'
  const getClassName = (id: string) => classes.find(c => c.id === id)?.name || 'All Classes'

  // Group by date for a visual calendar-like view
  const byDate = slots.reduce((acc: Record<string, Slot[]>, s) => {
    if (!acc[s.exam_date]) acc[s.exam_date] = []
    acc[s.exam_date].push(s)
    return acc
  }, {})
  const sortedDates = Object.keys(byDate).sort()

  return (
    <div className="space-y-5">
      {/* Header stats bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30 text-purple-700 dark:text-purple-300 text-xs font-semibold">
          <BookOpen className="w-3.5 h-3.5" />
          {slots.length} subjects scheduled
        </div>
        {published ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Schedule Published — Staff Notified
          </div>
        ) : null}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400 rounded-2xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Scheduled slots */}
      {sortedDates.length > 0 ? (
        <div className="space-y-3">
          {sortedDates.map(date => (
            <div key={date} className="border border-border rounded-2xl overflow-hidden">
              <div className="bg-slate-50 dark:bg-slate-900 px-4 py-2.5 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-bold text-foreground">{formatDate(date)}</span>
              </div>
              <div className="divide-y divide-border">
                {byDate[date]
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map(slot => (
                    <div key={slot.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                      <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground">{getSubjectName(slot.subject_id)}</p>
                        <p className="text-xs text-muted-foreground">{getClassName(slot.class_id)} · {fmt12(slot.start_time)} – {fmt12(slot.end_time)}</p>
                      </div>
                      <button
                        onClick={() => handleRemove(slot.id)}
                        disabled={removing === slot.id}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        {removing === slot.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border border-dashed border-border rounded-2xl">
          <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No subjects scheduled yet.</p>
          <p className="text-xs text-muted-foreground mt-0.5">Add subjects below to build the exam timetable.</p>
        </div>
      )}

      {/* Add slot form */}
      <div className="border border-border rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Plus className="w-4 h-4 text-purple-500" />
            Schedule a Subject
          </span>
          {showForm ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {showForm && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Subject</label>
                <select value={subjectId} onChange={e => setSubjectId(e.target.value)}
                  className="w-full bg-background border border-border text-foreground rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/50">
                  <option value="">Select subject...</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Class</label>
                <select value={classId} onChange={e => setClassId(e.target.value)}
                  className="w-full bg-background border border-border text-foreground rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/50">
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Exam Date</label>
                <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)}
                  className="w-full bg-background border border-border text-foreground rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Start Time</label>
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                    className="w-full bg-background border border-border text-foreground rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/50" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">End Time</label>
                  <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                    className="w-full bg-background border border-border text-foreground rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/50" />
                </div>
              </div>
            </div>
            <button
              onClick={handleAddSlot}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add to Schedule
            </button>
          </div>
        )}
      </div>

      {/* Publish button */}
      {slots.length > 0 && !published && (
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-white font-semibold text-sm">Ready to notify staff?</p>
            <p className="text-purple-200 text-xs mt-0.5">This will broadcast the exam schedule to all staff members.</p>
          </div>
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="flex items-center gap-2 px-4 py-2 bg-white text-purple-700 rounded-xl text-sm font-bold hover:bg-purple-50 transition-colors disabled:opacity-60"
          >
            {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Publish
          </button>
        </div>
      )}
    </div>
  )
}
