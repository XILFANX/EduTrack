'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, BookOpen, CheckCircle2, Clock, XCircle,
  AlertTriangle, Users, Send, Loader2, FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UX } from '@/lib/ux'
import { publishReportCards } from '@/app/actions/exams'

type ResultStatus = 'pending' | 'submitted' | 'approved' | 'rejected'

const STATUS_CONFIG: Record<ResultStatus, { label: string; color: string; icon: any }> = {
  pending:   { label: 'Pending',   color: 'text-slate-500 bg-slate-100 dark:bg-slate-800',              icon: Clock },
  submitted: { label: 'Submitted', color: 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40',   icon: Send },
  approved:  { label: 'Approved',  color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40', icon: CheckCircle2 },
  rejected:  { label: 'Rejected',  color: 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40',       icon: XCircle },
}

interface Props {
  event: any
  eventSlots: any[]
  gradingStatus: any[]
  classes: any[]
  subjects: any[]
  schoolId: string
}

export function ResultsMonitor({ event, eventSlots, gradingStatus, classes, subjects, schoolId }: Props) {
  const router = useRouter()
  const [publishing, startPublish] = useTransition()

  const participatingClassIds = (event.exam_event_classes || []).map((ec: any) => ec.class_id)
  const participatingClasses = classes.filter(c => participatingClassIds.includes(c.id))

  // Build lookup: key = `classId::subjectId`
  const statusMap: Record<string, any> = {}
  for (const gs of gradingStatus) {
    statusMap[`${gs.class_id}::${gs.subject_id}`] = gs
  }

  // Group slots by class
  const slotsByClass: Record<string, any[]> = {}
  for (const slot of eventSlots) {
    if (!slotsByClass[slot.class_id]) slotsByClass[slot.class_id] = []
    slotsByClass[slot.class_id].push(slot)
  }

  const allStatuses = Object.values(statusMap).map(s => s.status as ResultStatus)
  const totalSlots = eventSlots.length
  const submitted = allStatuses.filter(s => s === 'submitted').length
  const approved = allStatuses.filter(s => s === 'approved').length
  const rejected = allStatuses.filter(s => s === 'rejected').length
  const pending = totalSlots - submitted - approved - rejected
  const allSubmitted = totalSlots > 0 && (submitted + approved) === totalSlots
  const readyToPublish = event.status === 'published' && submitted > 0

  function handlePublish() {
    startPublish(async () => {
      const res = await publishReportCards(event.id)
      if (res.error) { UX.errorModal(res.error); return }
      UX.successModal({ title: `Report cards generated for ${(res as any).count} students!` })
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-blue-500 rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[50px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <button
            onClick={() => router.push('/dashboard/exams')}
            className="flex items-center gap-2 text-sm text-blue-100 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> All Exam Events
          </button>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight">{event.name}</h1>
              <p className="text-blue-100 text-sm mt-1">Results Monitor — track submission status per class & subject</p>
            </div>
            {readyToPublish && (
              <Button
                onClick={handlePublish}
                disabled={publishing}
                className="bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-xl gap-2 shrink-0"
              >
                {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Generate Report Cards
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Slots', value: totalSlots, color: 'text-slate-700 dark:text-slate-200' },
          { label: 'Pending', value: pending, color: 'text-slate-500' },
          { label: 'Submitted', value: submitted, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Approved', value: approved, color: 'text-emerald-600 dark:text-emerald-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-2xl px-4 py-3 text-center">
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {totalSlots > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
          <div className="flex justify-between text-xs font-semibold text-muted-foreground">
            <span>Overall Progress</span>
            <span>{Math.round(((submitted + approved) / totalSlots) * 100)}% submitted</span>
          </div>
          <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex gap-0.5">
            <div className="bg-emerald-500 rounded-full transition-all" style={{ width: `${(approved / totalSlots) * 100}%` }} />
            <div className="bg-blue-500 rounded-full transition-all" style={{ width: `${(submitted / totalSlots) * 100}%` }} />
            {rejected > 0 && <div className="bg-red-400 rounded-full transition-all" style={{ width: `${(rejected / totalSlots) * 100}%` }} />}
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />Approved</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" />Submitted</span>
            {rejected > 0 && <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" />Rejected</span>}
          </div>
        </div>
      )}

      {/* Per-class breakdown */}
      {participatingClasses.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-3xl">
          <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No participating classes configured for this exam event.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {participatingClasses.map((cls: any) => {
            const classSlots = slotsByClass[cls.id] || []

            return (
              <div key={cls.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-50/60 dark:bg-slate-900/40 border-b border-border flex items-center gap-3">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <p className="font-bold text-sm text-foreground">{cls.name}</p>
                  <span className="text-xs text-muted-foreground">{classSlots.length} subject{classSlots.length !== 1 ? 's' : ''} scheduled</span>
                </div>

                {classSlots.length === 0 ? (
                  <div className="px-4 py-4 text-sm text-muted-foreground italic">
                    No subjects scheduled for this class yet.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {classSlots.map((slot: any) => {
                      const gs = statusMap[`${cls.id}::${slot.subject_id}`]
                      const status: ResultStatus = gs?.status || 'pending'
                      const cfg = STATUS_CONFIG[status]
                      const StatusIcon = cfg.icon

                      return (
                        <div key={slot.id} className="flex items-center gap-4 px-4 py-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shrink-0">
                            <BookOpen className="w-4 h-4 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground">{slot.subjects?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {slot.exam_date ? new Date(slot.exam_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date TBD'}
                              {slot.start_time ? ` · ${slot.start_time.slice(0, 5)}` : ''}
                            </p>
                          </div>
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                          {gs?.rejection_comment && (
                            <span className="text-[10px] text-red-500 max-w-[160px] truncate" title={gs.rejection_comment}>
                              "{gs.rejection_comment}"
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
