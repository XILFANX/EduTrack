'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ClipboardList, Plus, Loader2, Trash2, Edit2, Send,
  CheckCircle2, Clock, Users, BookOpen, ChevronRight, Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useConfirmDialog, ConfirmDialog } from '@/components/ui/confirm-dialog'
import { UX } from '@/lib/ux'
import { createExamEvent, deleteExamEvent, publishExamEvent } from '@/app/actions/exams'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  draft:     { label: 'Draft',     color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400', icon: Clock },
  published: { label: 'Published', color: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300', icon: CheckCircle2 },
  closed:    { label: 'Closed',    color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300', icon: CheckCircle2 },
}

interface Props {
  schoolId: string
  events: any[]
  years: any[]
  terms: any[]
  classes: any[]
  subjects: any[]
}

function CreateEventModal({ open, onClose, schoolId, years, terms, classes }: {
  open: boolean; onClose: () => void; schoolId: string; years: any[]; terms: any[]; classes: any[]
}) {
  const [name, setName] = useState('')
  const [yearId, setYearId] = useState(years.find(y => y.is_active)?.id || years[0]?.id || '')
  const [termId, setTermId] = useState('')
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const filteredTerms = terms.filter(t => t.year_id === yearId)

  function toggleClass(id: string) {
    setSelectedClassIds(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setErr('Exam name is required.'); return }
    if (!termId) { setErr('Please select a term.'); return }
    if (selectedClassIds.length === 0) { setErr('Select at least one participating class.'); return }
    setSaving(true); setErr(null)

    const res = await createExamEvent({ name: name.trim(), termId, yearId, classIds: selectedClassIds })
    setSaving(false)
    if (res.error) { setErr(res.error); return }
    UX.successModal({ title: 'Exam event created' })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl">
        <DialogHeader>
          <DialogTitle>Create Exam Event</DialogTitle>
          <p className="text-sm text-muted-foreground">An exam event is a school-wide assessment (e.g. Term 1 Mid-Term 2026).</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Exam Name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Term 1 End-of-Term Exams 2026" autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Academic Year *</Label>
              <select
                value={yearId}
                onChange={e => { setYearId(e.target.value); setTermId('') }}
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl"
              >
                {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Term *</Label>
              <select
                value={termId}
                onChange={e => setTermId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl"
              >
                <option value="">Select term</option>
                {filteredTerms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Participating Classes *</Label>
            <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1">
              {classes.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleClass(c.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                    selectedClassIds.includes(c.id)
                      ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300'
                      : 'border-border text-foreground hover:border-cyan-300'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
            {selectedClassIds.length > 0 && (
              <p className="text-xs text-muted-foreground">{selectedClassIds.length} class{selectedClassIds.length > 1 ? 'es' : ''} selected</p>
            )}
          </div>

          {err && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800">{err}</p>}

          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
            <Button type="submit" disabled={saving} className="rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Create Event
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function ExamEventsManager({ schoolId, events, years, terms, classes, subjects }: Props) {
  const router = useRouter()
  const [modal, setModal] = useState(false)
  const [publishing, startPublish] = useTransition()
  const { dialogProps, confirm } = useConfirmDialog()

  async function handleDelete(event: any) {
    const ok = await confirm({
      title: 'Delete Exam Event',
      description: `Delete "${event.name}"? All schedules and results linked to this event will also be removed.`,
      confirmLabel: 'Delete Event',
      variant: 'danger',
    })
    if (!ok) return
    const res = await deleteExamEvent(event.id)
    if (res.error) { UX.errorModal(res.error); return }
    UX.successModal({ title: 'Event deleted' })
    router.refresh()
  }

  function handlePublish(event: any) {
    startPublish(async () => {
      const res = await publishExamEvent(event.id)
      if (res.error) { UX.errorModal(res.error); return }
      UX.successModal({ title: 'Exam event published — teachers can now see it.' })
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-br from-cyan-600 via-cyan-500 to-cyan-500 rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[50px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Examinations</h1>
              <p className="text-cyan-100 text-sm mt-0.5">School-wide exam events — create, schedule and publish results</p>
            </div>
          </div>
          <Button onClick={() => setModal(true)} className="bg-white text-cyan-700 hover:bg-cyan-50 font-bold rounded-xl gap-2 shrink-0">
            <Plus className="w-4 h-4" /> New Exam Event
          </Button>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-16 bg-card border-2 border-dashed border-border rounded-3xl">
          <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-foreground">No Exam Events Yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm mx-auto">
            Create a school-wide exam event. It will span multiple classes and subjects.
          </p>
          <Button onClick={() => setModal(true)} className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Create First Exam Event
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event: any) => {
            const cfg = STATUS_CONFIG[event.status] || STATUS_CONFIG.draft
            const StatusIcon = cfg.icon
            const participatingClasses = (event.exam_event_classes || []).map((ec: any) => ec.classes?.name).filter(Boolean)

            return (
              <div key={event.id} className="bg-card border border-border rounded-2xl p-4 hover:shadow-sm transition-shadow group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/30 flex items-center justify-center shrink-0">
                      <ClipboardList className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="font-bold text-foreground">{event.name}</p>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </div>
                      {participatingClasses.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <Users className="w-3.5 h-3.5 text-muted-foreground" />
                          {participatingClasses.slice(0, 5).map((name: string, i: number) => (
                            <span key={i} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-medium">{name}</span>
                          ))}
                          {participatingClasses.length > 5 && (
                            <span className="text-xs text-muted-foreground">+{participatingClasses.length - 5} more</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Monitor results */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/exams?view=monitor&eventId=${event.id}`)}
                      className="rounded-xl gap-1.5 text-xs"
                    >
                      <Eye className="w-3.5 h-3.5" /> Monitor
                    </Button>

                    {/* Publish if draft */}
                    {event.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => handlePublish(event)}
                        disabled={publishing}
                        className="rounded-xl gap-1.5 text-xs bg-cyan-600 hover:bg-cyan-700 text-white"
                      >
                        <Send className="w-3.5 h-3.5" /> Publish
                      </Button>
                    )}

                    <button
                      onClick={() => handleDelete(event)}
                      className="p-2 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <CreateEventModal open={modal} onClose={() => { setModal(false); router.refresh() }} schoolId={schoolId} years={years} terms={terms} classes={classes} />
      <ConfirmDialog {...dialogProps} />
    </div>
  )
}
