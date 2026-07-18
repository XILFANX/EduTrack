'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, Send, AlertCircle } from 'lucide-react'
import { finalizeGrades } from '@/app/actions/exam-workflow'

interface StatusItem {
  subject_id: string
  subject_name: string
  status: string
  submitted_at: string | null
}

interface Props {
  examId: string
  classId: string
  subjects: StatusItem[]
}

const STATUS_ORDER: Record<string, number> = { finalized: 2, submitted: 1, pending: 0 }

export function ClassTeacherReviewPanel({ examId, classId, subjects }: Props) {
  const router = useRouter()
  const [finalizing, setFinalizing] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const sorted = [...subjects].sort((a, b) => STATUS_ORDER[b.status] - STATUS_ORDER[a.status])

  const allSubmitted = subjects.length > 0 && subjects.every(s => s.status === 'submitted' || s.status === 'finalized')
  const allFinalized = subjects.length > 0 && subjects.every(s => s.status === 'finalized')

  const handleFinalize = (subjectId: string) => {
    setError(null)
    setFinalizing(subjectId)
    startTransition(async () => {
      try {
        await finalizeGrades(examId, classId, subjectId)
        router.refresh()
      } catch (e: any) {
        setError(e.message)
      } finally {
        setFinalizing(null)
      }
    })
  }

  const handleFinalizeAll = () => {
    const pending = subjects.filter(s => s.status === 'submitted')
    if (pending.length === 0) return
    setError(null)
    startTransition(async () => {
      for (const s of pending) {
        try {
          await finalizeGrades(examId, classId, s.subject_id)
        } catch (e: any) {
          setError(e.message)
          return
        }
      }
      router.refresh()
    })
  }

  if (subjects.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Review Submissions</p>
        {allSubmitted && !allFinalized && (
          <button
            onClick={handleFinalizeAll}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-60"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Finalize All
          </button>
        )}
        {allFinalized && (
          <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> All Finalized
          </span>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl px-3 py-2 text-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border/50">
        {sorted.map(subject => (
          <div key={subject.subject_id} className="flex items-center gap-3 px-4 py-3">
            <div className={`w-2 h-2 rounded-full shrink-0 ${
              subject.status === 'finalized' ? 'bg-emerald-400' :
              subject.status === 'submitted' ? 'bg-amber-400' :
              'bg-slate-300'
            }`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{subject.subject_name}</p>
              {subject.submitted_at && (
                <p className="text-[10px] text-muted-foreground">
                  Submitted {new Date(subject.submitted_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
            {subject.status === 'submitted' && (
              <button
                onClick={() => handleFinalize(subject.subject_id)}
                disabled={finalizing === subject.subject_id || isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-60 shrink-0"
              >
                {finalizing === subject.subject_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                Finalize
              </button>
            )}
            {subject.status === 'finalized' && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                <CheckCircle2 className="w-3 h-3" /> Done
              </span>
            )}
            {subject.status === 'pending' && (
              <span className="text-[11px] text-muted-foreground shrink-0">Awaiting</span>
            )}
          </div>
        ))}
      </div>

      {!allSubmitted && (
        <p className="text-xs text-muted-foreground text-center py-1">
          Waiting for {subjects.filter(s => s.status === 'pending').length} subject teacher(s) to submit.
        </p>
      )}
    </div>
  )
}
