'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShieldCheck, BookOpen, CheckCircle2, XCircle, ChevronDown,
  Loader2, Send, Users, Clock, AlertCircle, Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { UX } from '@/lib/ux'
import { approveResults, rejectResults } from '@/app/actions/exams'

type GradingStatusType = 'pending' | 'submitted' | 'approved' | 'rejected'

const STATUS_CONFIG: Record<GradingStatusType, { label: string; color: string; icon: any }> = {
  pending:   { label: 'Awaiting',  color: 'text-slate-500 bg-slate-100 dark:bg-[#0d1b2e]', icon: Clock },
  submitted: { label: 'Submitted', color: 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40', icon: Send },
  approved:  { label: 'Approved',  color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40', icon: CheckCircle2 },
  rejected:  { label: 'Rejected',  color: 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40', icon: XCircle },
}

interface Props {
  teacherId: string
  schoolId: string
  myClass: any
  events: any[]
  selectedEventId: string
  classSlots: any[]
  gradingStatuses: any[]
  selectedSubjectId: string
  reviewResults: any[]
  reviewStudents: any[]
  gradeScales: any[]
}

function RejectModal({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: (comment: string) => void }) {
  const [comment, setComment] = useState('')
  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[400px] rounded-3xl">
        <DialogHeader><DialogTitle>Reject Results</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">Provide a reason so the subject teacher knows what to correct.</p>
          <Input
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="e.g. Several scores seem unusually high — please verify"
            autoFocus
          />
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
            <Button onClick={() => comment.trim() && onConfirm(comment.trim())} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
              Send Back
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ClassTeacherReviewView({
  teacherId, schoolId, myClass, events, selectedEventId,
  classSlots, gradingStatuses, selectedSubjectId, reviewResults, reviewStudents, gradeScales
}: Props) {
  const router = useRouter()
  const [approving, startApprove] = useTransition()
  const [rejectModal, setRejectModal] = useState<{ open: boolean; examId: string; subjectId: string }>({ open: false, examId: '', subjectId: '' })

  // Build status map: subjectId → status
  const statusMap: Record<string, any> = {}
  for (const gs of gradingStatuses) statusMap[gs.subject_id] = gs

  // Build result map for review panel
  const resultMap: Record<string, any> = {}
  for (const r of reviewResults) resultMap[r.student_id] = r

  const selectedSlot = classSlots.find(s => s.subject_id === selectedSubjectId)
  const slotStatus = selectedSubjectId ? statusMap[selectedSubjectId]?.status as GradingStatusType : 'pending'

  function handleApprove() {
    if (!selectedSlot) return
    startApprove(async () => {
      const res = await approveResults(selectedSlot.exam_id, myClass.id, selectedSubjectId)
      if (res.error) { UX.errorModal(res.error); return }
      UX.successModal({ title: 'Results approved!' })
      router.refresh()
    })
  }

  function handleReject(comment: string) {
    if (!selectedSlot) return
    setRejectModal({ open: false, examId: '', subjectId: '' })
    startApprove(async () => {
      const res = await rejectResults(selectedSlot.exam_id, myClass.id, selectedSubjectId, comment)
      if (res.error) { UX.errorModal(res.error); return }
      UX.successModal({ title: 'Results sent back for correction.' })
      router.refresh()
    })
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 via-blue-500 to-blue-600 p-6 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[50px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Results Review</h1>
            <p className="text-blue-100 text-sm mt-0.5">{myClass.name} · Approve or send back subject results</p>
          </div>
        </div>
      </div>

      {/* Exam selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Exam Event</label>
        <div className="relative max-w-sm">
          <select
            value={selectedEventId}
            onChange={e => router.push(`/teacher/grades?examEventId=${e.target.value}`)}
            className="w-full appearance-none pl-4 pr-9 py-2.5 text-sm font-semibold bg-card border border-border rounded-xl text-foreground"
          >
            {events.length === 0 && <option value="">No published exams</option>}
            {events.map((ev: any) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: subject list */}
        <div className="lg:col-span-1 space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Subjects</p>
          {classSlots.length === 0 ? (
            <div className="text-center py-10 bg-card border border-border rounded-2xl">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No subjects scheduled for this exam.</p>
            </div>
          ) : classSlots.map((slot: any) => {
            const gs = statusMap[slot.subject_id]
            const status: GradingStatusType = gs?.status || 'pending'
            const cfg = STATUS_CONFIG[status]
            const StatusIcon = cfg.icon
            const isSelected = selectedSubjectId === slot.subject_id

            return (
              <button
                key={slot.id}
                onClick={() => router.push(`/teacher/grades?examEventId=${selectedEventId}&subjectId=${slot.subject_id}`)}
                className={`w-full text-left px-4 py-3 rounded-2xl border-2 transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                    : 'border-border bg-card hover:border-cyan-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-bold ${isSelected ? 'text-blue-700 dark:text-blue-100' : 'text-foreground'}`}>
                    {slot.subjects?.name}
                  </p>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>
                    <StatusIcon className="w-2.5 h-2.5" />
                    {cfg.label}
                  </span>
                </div>
                {slot.exam_date && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(slot.exam_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </p>
                )}
              </button>
            )
          })}
        </div>

        {/* Right: review panel */}
        <div className="lg:col-span-2">
          {!selectedSubjectId ? (
            <div className="text-center py-16 bg-card border border-border rounded-3xl h-full flex flex-col items-center justify-center">
              <Eye className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-sm text-muted-foreground">Select a subject from the list to review its results.</p>
            </div>
          ) : slotStatus === 'pending' ? (
            <div className="text-center py-16 bg-card border border-border rounded-3xl h-full flex flex-col items-center justify-center">
              <Clock className="w-10 h-10 text-slate-300 mb-3" />
              <p className="font-semibold text-foreground">Awaiting Submission</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                The subject teacher has not yet submitted results for this subject.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Action bar */}
              {slotStatus === 'submitted' && (
                <div className="flex items-center justify-between gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-2xl">
                  <div>
                    <p className="text-sm font-bold text-blue-700 dark:text-blue-300">Results ready for review</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">Review the marks below then approve or send back for correction.</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRejectModal({ open: true, examId: selectedSlot?.exam_id || '', subjectId: selectedSubjectId })}
                      disabled={approving}
                      className="rounded-xl border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 gap-1.5"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleApprove}
                      disabled={approving}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                    >
                      {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Approve
                    </Button>
                  </div>
                </div>
              )}

              {slotStatus === 'approved' && (
                <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Results approved — pending admin publication</p>
                </div>
              )}

              {/* Results table */}
              <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-slate-50/60 dark:bg-[#060d1a]/40">
                      <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">#</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Student</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">Score</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">Grade</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {reviewStudents
                      .sort((a, b) => (resultMap[b.id]?.score ?? 0) - (resultMap[a.id]?.score ?? 0))
                      .map((student: any, idx: number) => {
                        const result = resultMap[student.id]
                        return (
                          <tr key={student.id} className={`${idx % 2 !== 0 ? 'bg-slate-50/40 dark:bg-[#060d1a]/20' : ''}`}>
                            <td className="px-4 py-2.5 text-muted-foreground text-xs">{idx + 1}</td>
                            <td className="px-4 py-2.5 font-semibold text-foreground">{student.last_name}, {student.first_name}</td>
                            <td className="px-4 py-2.5 text-center font-bold text-foreground">{result?.score ?? '—'}</td>
                            <td className="px-4 py-2.5 text-center">
                              {result?.grade ? (
                                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                                  {result.grade}
                                </span>
                              ) : <span className="text-slate-300 text-xs">—</span>}
                            </td>
                            <td className="px-4 py-2.5 text-xs text-muted-foreground">{result?.remarks || '—'}</td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <RejectModal
        open={rejectModal.open}
        onClose={() => setRejectModal({ open: false, examId: '', subjectId: '' })}
        onConfirm={handleReject}
      />
    </div>
  )
}
