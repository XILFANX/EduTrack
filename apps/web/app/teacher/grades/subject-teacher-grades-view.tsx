'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  PenTool, BookOpen, Send, Loader2, CheckCircle2, AlertCircle,
  RotateCcw, ChevronDown, Users, Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UX } from '@/lib/ux'
import { saveExamResult, submitResultsForReview } from '@/app/actions/exams'

function computeGrade(score: number, scales: any[]) {
  return scales.find(s => score >= s.min_score && score <= s.max_score) || null
}

interface Props {
  teacherId: string
  schoolId: string
  events: any[]
  examSlots: any[]
  selectedEventId: string
  selectedClassId: string
  selectedSubjectId: string
  selectedSlot: any
  students: any[]
  existingResults: any[]
  gradeScales: any[]
  slotGradingStatus: any
}

export function SubjectTeacherGradesView({
  teacherId, schoolId, events, examSlots,
  selectedEventId, selectedClassId, selectedSubjectId,
  selectedSlot, students, existingResults, gradeScales, slotGradingStatus
}: Props) {
  const router = useRouter()
  const [submitting, startSubmit] = useTransition()

  // Build initial scores from existing results
  const initScores: Record<string, string> = {}
  for (const r of existingResults) initScores[r.student_id] = r.score?.toString() ?? ''
  const [scores, setScores] = useState<Record<string, string>>(initScores)
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  const isLocked = slotGradingStatus?.status === 'submitted'
  const isRejected = slotGradingStatus?.status === 'rejected'

  async function handleScoreChange(studentId: string, value: string) {
    if (isLocked) return
    setScores(prev => ({ ...prev, [studentId]: value }))

    const num = parseFloat(value)
    if (isNaN(num) || !selectedSlot) return

    setSaving(prev => ({ ...prev, [studentId]: true }))
    const grade = computeGrade(num, gradeScales)
    await saveExamResult({
      studentId,
      examEventId: selectedEventId,
      examId: selectedSlot.exam_id,
      subjectId: selectedSubjectId,
      score: num,
      grade: grade?.grade || null,
      remarks: grade?.remarks || null,
      schoolId,
    })
    setSaving(prev => ({ ...prev, [studentId]: false }))
  }

  async function handleSubmit() {
    if (!selectedSlot) return
    const filled = students.filter(s => scores[s.id] !== undefined && scores[s.id] !== '').length
    if (filled < students.length) {
      UX.errorModal(`Please enter scores for all ${students.length} students before submitting.`)
      return
    }
    startSubmit(async () => {
      const res = await submitResultsForReview(selectedEventId, selectedSlot.exam_id, selectedClassId, selectedSubjectId)
      if (res.error) { UX.errorModal(res.error); return }
      UX.successModal({ title: 'Results submitted for class teacher review!' })
      router.refresh()
    })
  }

  const filledCount = students.filter(s => scores[s.id] !== undefined && scores[s.id] !== '').length

  return (
    <div className="space-y-6 pb-24">
      {/* Hero */}
      <div className="bg-gradient-to-br from-cyan-600 via-cyan-500 to-cyan-500 rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[50px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
            <PenTool className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Results Entry</h1>
            <p className="text-cyan-100 text-sm mt-0.5">Enter scores — grades auto-assign from your school's scale</p>
          </div>
        </div>
      </div>

      {/* Exam + Class + Subject selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Exam event */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Exam Event</label>
          <div className="relative">
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

        {/* Class */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Class</label>
          <div className="relative">
            <select
              value={`${selectedClassId}::${selectedSubjectId}`}
              onChange={e => {
                const [cid, sid] = e.target.value.split('::')
                router.push(`/teacher/grades?examEventId=${selectedEventId}&classId=${cid}&subjectId=${sid}`)
              }}
              className="w-full appearance-none pl-4 pr-9 py-2.5 text-sm font-semibold bg-card border border-border rounded-xl text-foreground"
            >
              {examSlots.length === 0 && <option value="">No subjects scheduled</option>}
              {examSlots.map((s: any) => (
                <option key={`${s.class_id}::${s.subject_id}`} value={`${s.class_id}::${s.subject_id}`}>
                  {s.classes?.name} — {s.subjects?.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</label>
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold ${
            isLocked ? 'bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300' :
            isRejected ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300' :
            'bg-slate-50 dark:bg-slate-900 border-border text-muted-foreground'
          }`}>
            {isLocked ? <><CheckCircle2 className="w-4 h-4" /> Submitted</> :
             isRejected ? <><AlertCircle className="w-4 h-4" /> Rejected — {slotGradingStatus?.rejection_comment || 'Re-enter marks'}</> :
             <><Clock className="w-4 h-4" /> Draft</>}
          </div>
        </div>
      </div>

      {/* Rejection notice */}
      {isRejected && (
        <div className="flex items-start gap-3 px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-2xl">
          <RotateCcw className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-700 dark:text-red-400">Results Sent Back for Correction</p>
            <p className="text-sm text-red-600 dark:text-red-500 mt-0.5">
              Comment: {slotGradingStatus?.rejection_comment || 'No comment provided.'}
            </p>
            <p className="text-xs text-red-400 mt-1">Edit the marks below and re-submit.</p>
          </div>
        </div>
      )}

      {/* Mark entry table */}
      {!selectedSlot ? (
        <div className="text-center py-16 bg-card border border-border rounded-3xl">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Select an exam event and subject to begin entering marks.</p>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-3xl">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No students found in this class.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Progress bar */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-medium">{filledCount}/{students.length} scores entered</span>
            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={isLocked || submitting || !selectedSlot}
                className="rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Submit for Review
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50/60 dark:bg-slate-900/40">
                  <th className="px-5 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">#</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Student</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Adm. No.</th>
                  <th className="px-5 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">Score</th>
                  <th className="px-5 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">Auto Grade</th>
                  <th className="px-5 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">Saved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.map((student: any, idx: number) => {
                  const scoreVal = scores[student.id] ?? ''
                  const numScore = parseFloat(scoreVal)
                  const grade = !isNaN(numScore) ? computeGrade(numScore, gradeScales) : null
                  const isSaved = !isNaN(numScore) && !saving[student.id]

                  return (
                    <tr key={student.id} className={`${idx % 2 !== 0 ? 'bg-slate-50/40 dark:bg-slate-900/20' : ''} hover:bg-cyan-50/30 dark:hover:bg-cyan-950/10 transition-colors`}>
                      <td className="px-5 py-3 text-muted-foreground font-medium text-xs">{idx + 1}</td>
                      <td className="px-5 py-3">
                        <p className="font-semibold text-foreground">{student.last_name}, {student.first_name}</p>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground text-xs font-mono">{student.admission_number || '—'}</td>
                      <td className="px-5 py-3">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={0.5}
                          disabled={isLocked}
                          value={scoreVal}
                          onChange={e => handleScoreChange(student.id, e.target.value)}
                          onBlur={e => handleScoreChange(student.id, e.target.value)}
                          className="w-20 mx-auto text-center font-bold text-base h-9 rounded-xl"
                          placeholder="—"
                        />
                      </td>
                      <td className="px-5 py-3 text-center">
                        {grade ? (
                          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-black bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300">
                            {grade.grade}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {saving[student.id] ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400 mx-auto" />
                        ) : isSaved && scoreVal !== '' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                        ) : (
                          <span className="text-slate-200 dark:text-slate-700 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
