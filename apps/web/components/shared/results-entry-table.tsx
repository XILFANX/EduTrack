'use client'

import { useState, useRef, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Save, Send, CheckCircle2, AlertCircle, Loader2,
  ChevronUp, ChevronDown, Info, BookOpen
} from 'lucide-react'
import { saveExamResult } from '@/app/teacher/grades/actions'
import { submitGradesForReview } from '@/app/actions/exam-workflow'

interface Student {
  id: string
  first_name: string
  last_name: string
  admission_number: string
  photo_url: string | null
}

interface GradeScale {
  grade: string
  min_score: number
  max_score: number
  points: number
  remarks: string | null
}

interface ExistingResult {
  student_id: string
  score: number
  grade: string | null
  remarks: string | null
}

interface Props {
  examId: string
  classId: string
  subjectId: string
  subjectName: string
  examName: string
  maxScore: number
  students: Student[]
  gradeScales: GradeScale[]
  existingResults: ExistingResult[]
  gradingStatus: string // 'pending', 'submitted', 'finalized'
  isSubjectTeacher: boolean
}

function calculateGrade(score: number, maxScore: number, scales: GradeScale[]): { grade: string; remarks: string } {
  const pct = (score / maxScore) * 100
  if (scales.length > 0) {
    const sorted = [...scales].sort((a, b) => b.min_score - a.min_score)
    const match = sorted.find(s => pct >= s.min_score)
    if (match) return { grade: match.grade, remarks: match.remarks || '' }
  }
  // Fallback
  if (pct >= 80) return { grade: 'A', remarks: 'Excellent' }
  if (pct >= 70) return { grade: 'B+', remarks: 'Very Good' }
  if (pct >= 60) return { grade: 'B', remarks: 'Good' }
  if (pct >= 50) return { grade: 'C', remarks: 'Average' }
  if (pct >= 40) return { grade: 'D', remarks: 'Below Average' }
  return { grade: 'E', remarks: 'Poor' }
}

function gradeColorClass(grade: string | null) {
  if (!grade) return 'text-slate-400'
  if (grade.startsWith('A')) return 'text-emerald-600 dark:text-emerald-400'
  if (grade.startsWith('B')) return 'text-blue-600 dark:text-blue-400'
  if (grade.startsWith('C')) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-500 dark:text-red-400'
}

function gradeBgClass(grade: string | null) {
  if (!grade) return 'bg-slate-50 text-slate-400 border-transparent'
  if (grade.startsWith('A')) return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800/30'
  if (grade.startsWith('B')) return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/30'
  if (grade.startsWith('C')) return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800/30'
  return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/30'
}

export function ResultsEntryTable({
  examId, classId, subjectId, subjectName, examName,
  maxScore, students, gradeScales, existingResults, gradingStatus, isSubjectTeacher
}: Props) {
  const router = useRouter()
  const [saving, startSaving] = useTransition()
  const [submitting, startSubmitting] = useTransition()

  // Build initial state map from existingResults
  const initialScores: Record<string, string> = {}
  existingResults.forEach(r => { initialScores[r.student_id] = String(r.score) })

  const [scores, setScores] = useState<Record<string, string>>(initialScores)
  const [saveStatus, setSaveStatus] = useState<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({})
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(gradingStatus === 'submitted' || gradingStatus === 'finalized')
  const [sortAsc, setSortAsc] = useState(true)

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const isLocked = submitted || gradingStatus === 'finalized'
  const isFinalized = gradingStatus === 'finalized'

  const sortedStudents = [...students].sort((a, b) => {
    const nameA = `${a.last_name} ${a.first_name}`
    const nameB = `${b.last_name} ${b.first_name}`
    return sortAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
  })

  // Handle score change with auto-calc
  const handleChange = (studentId: string, raw: string) => {
    if (isLocked) return
    const clamped = raw === '' ? '' : String(Math.min(maxScore, Math.max(0, Number(raw))))
    setScores(prev => ({ ...prev, [studentId]: clamped }))
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, studentId: string) => {
    const currentIdx = sortedStudents.findIndex(s => s.id === studentId)
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault()
      const next = sortedStudents[currentIdx + 1]
      if (next) inputRefs.current[next.id]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = sortedStudents[currentIdx - 1]
      if (prev) inputRefs.current[prev.id]?.focus()
    }
  }

  // Save a single score on blur
  const handleBlur = useCallback(async (studentId: string) => {
    const rawScore = scores[studentId]
    if (rawScore === '' || rawScore === undefined) return
    const numScore = Number(rawScore)
    const { grade, remarks } = calculateGrade(numScore, maxScore, gradeScales)

    setSaveStatus(prev => ({ ...prev, [studentId]: 'saving' }))
    try {
      await saveExamResult({
        studentId,
        examId,
        subjectId,
        score: numScore,
        grade,
        remarks,
        schoolId: '', // Will be resolved server-side from session
      })
      setSaveStatus(prev => ({ ...prev, [studentId]: 'saved' }))
      setTimeout(() => setSaveStatus(prev => ({ ...prev, [studentId]: 'idle' })), 2000)
    } catch {
      setSaveStatus(prev => ({ ...prev, [studentId]: 'error' }))
    }
  }, [scores, examId, subjectId, maxScore, gradeScales])

  // Save all
  const handleSaveAll = () => {
    setGlobalError(null)
    startSaving(async () => {
      const entries = sortedStudents.map(s => {
        const rawScore = scores[s.id]
        if (rawScore === '' || rawScore === undefined) return null
        const numScore = Number(rawScore)
        const { grade, remarks } = calculateGrade(numScore, maxScore, gradeScales)
        return { studentId: s.id, score: numScore, grade, remarks }
      }).filter(Boolean)

      for (const entry of entries) {
        try {
          await saveExamResult({
            studentId: entry!.studentId,
            examId,
            subjectId,
            score: entry!.score,
            grade: entry!.grade,
            remarks: entry!.remarks,
            schoolId: '',
          })
          setSaveStatus(prev => ({ ...prev, [entry!.studentId]: 'saved' }))
        } catch {
          setSaveStatus(prev => ({ ...prev, [entry!.studentId]: 'error' }))
        }
      }
    })
  }

  const handleSubmit = () => {
    setGlobalError(null)
    startSubmitting(async () => {
      try {
        await submitGradesForReview(examId, classId, subjectId)
        setSubmitted(true)
        router.refresh()
      } catch (e: any) {
        setGlobalError(e.message)
      }
    })
  }

  // Stats
  const enteredCount = sortedStudents.filter(s => scores[s.id] !== '' && scores[s.id] !== undefined).length
  const totalCount = sortedStudents.length
  const avgScore = enteredCount > 0
    ? (sortedStudents.reduce((sum, s) => sum + (Number(scores[s.id] || 0)), 0) / enteredCount).toFixed(1)
    : null
  const passCount = sortedStudents.filter(s => {
    const sc = Number(scores[s.id] || 0)
    return scores[s.id] !== undefined && scores[s.id] !== '' && (sc / maxScore) * 100 >= 50
  }).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-500" />
            <h3 className="font-bold text-foreground text-lg">{subjectName}</h3>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{examName} · Max: {maxScore} marks</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isFinalized ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded-full px-3 py-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Results Finalized
            </span>
          ) : submitted ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-full px-3 py-1.5">
              <Send className="w-3.5 h-3.5" /> Submitted for Review
            </span>
          ) : null}
        </div>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Students', value: totalCount, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Entered', value: `${enteredCount}/${totalCount}`, color: enteredCount === totalCount ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400' },
          { label: 'Class Avg', value: avgScore ? `${avgScore}%` : '—', color: 'text-purple-600 dark:text-purple-400' },
          { label: 'Passing', value: avgScore ? `${passCount}/${enteredCount}` : '—', color: 'text-teal-600 dark:text-teal-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-3 text-center">
            <p className={`text-xl font-extrabold ${stat.color}`}>{stat.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium uppercase tracking-wide">{stat.label}</p>
          </div>
        ))}
      </div>

      {!isLocked && (
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-slate-50 dark:bg-slate-900/30 border border-border rounded-xl px-3 py-2">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-500" />
          <span>Use <kbd className="px-1.5 py-0.5 text-[10px] bg-white dark:bg-slate-800 border border-border rounded font-mono">↑</kbd> <kbd className="px-1.5 py-0.5 text-[10px] bg-white dark:bg-slate-800 border border-border rounded font-mono">↓</kbd> or <kbd className="px-1.5 py-0.5 text-[10px] bg-white dark:bg-slate-800 border border-border rounded font-mono">Enter</kbd> to navigate between students. Grade and remarks are calculated automatically.</span>
        </div>
      )}

      {globalError && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400 rounded-2xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {globalError}
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-border overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900">
              <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide w-8">#</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                <button onClick={() => setSortAsc(!sortAsc)} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  Student
                  {sortAsc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </th>
              <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide">Adm#</th>
              <th className="text-center px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide">Score <span className="text-[10px] normal-case">/{maxScore}</span></th>
              <th className="text-center px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide">%</th>
              <th className="text-center px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide">Grade</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide">Remarks</th>
              <th className="w-8 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedStudents.map((student, idx) => {
              const raw = scores[student.id] ?? ''
              const numScore = raw !== '' ? Number(raw) : null
              const pct = numScore !== null ? ((numScore / maxScore) * 100).toFixed(1) : null
              const { grade, remarks } = numScore !== null
                ? calculateGrade(numScore, maxScore, gradeScales)
                : { grade: null, remarks: null }
              const status = saveStatus[student.id] || 'idle'

              return (
                <tr key={student.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/30 transition-colors group">
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{idx + 1}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {student.photo_url
                          ? <img src={student.photo_url} className="w-full h-full object-cover rounded-full" alt="" />
                          : `${student.first_name[0]}${student.last_name[0]}`
                        }
                      </div>
                      <span className="font-medium text-foreground">{student.last_name}, {student.first_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono">{student.admission_number}</td>
                  <td className="px-4 py-2.5 text-center">
                    <input
                      ref={el => { inputRefs.current[student.id] = el }}
                      type="number"
                      min={0}
                      max={maxScore}
                      step={0.5}
                      value={raw}
                      disabled={isLocked}
                      onChange={e => handleChange(student.id, e.target.value)}
                      onBlur={() => handleBlur(student.id)}
                      onKeyDown={e => handleKeyDown(e, student.id)}
                      placeholder="—"
                      className={`w-20 text-center px-2 py-1.5 rounded-xl border font-bold text-sm outline-none transition-all ${
                        isLocked
                          ? 'bg-slate-50 dark:bg-slate-900 border-transparent text-foreground cursor-not-allowed'
                          : 'bg-background border-border focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-foreground'
                      }`}
                    />
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`text-sm font-semibold ${pct !== null ? gradeColorClass(grade) : 'text-slate-300'}`}>
                      {pct !== null ? `${pct}%` : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${gradeBgClass(grade)}`}>
                      {grade || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground italic">{remarks || '—'}</td>
                  <td className="px-4 py-2.5">
                    {status === 'saving' && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />}
                    {status === 'saved' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                    {status === 'error' && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Action row */}
      {!isFinalized && (
        <div className="flex flex-col sm:flex-row gap-3">
          {!submitted && (
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save All
            </button>
          )}
          {!submitted && isSubjectTeacher && (
            <button
              onClick={handleSubmit}
              disabled={submitting || enteredCount < totalCount}
              title={enteredCount < totalCount ? `${totalCount - enteredCount} students still missing scores` : ''}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit to Class Teacher
              {enteredCount < totalCount && <span className="ml-1 text-purple-200 text-xs">({totalCount - enteredCount} missing)</span>}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
