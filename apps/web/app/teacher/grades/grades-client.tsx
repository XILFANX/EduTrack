'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Save, Loader2, PenTool } from 'lucide-react'
import { saveExamResults } from './actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Student { id: string; first_name: string; last_name: string; admission_number: string; photo_url?: string | null }
interface Exam { id: string; name: string }
interface Subject { id: string; name: string }

interface Props {
  schoolId: string
  teacherId: string
  cls: { id: string; name: string } | null
  students: Student[]
  exams: Exam[]
  subjects: Subject[]
  existingResults: any[]
  isClassTeacher: boolean
  availableClasses: { id: string; name: string }[]
  preselectedSubjectId?: string
  gradeScales?: { grade: string; min_score: number; remarks: string | null }[]
}

const GRADE_CUTOFFS = [
  [80, 'A'], [75, 'A-'], [70, 'B+'], [65, 'B'], [60, 'B-'],
  [55, 'C+'], [50, 'C'], [45, 'C-'], [40, 'D+'], [35, 'D'], [30, 'D-'],
] as const

function calculateGrade(scoreStr: string, gradeScales?: { grade: string; min_score: number }[]): string {
  const s = parseFloat(scoreStr)
  if (isNaN(s)) return '--'
  
  if (gradeScales && gradeScales.length > 0) {
    for (const scale of gradeScales) {
      if (s >= scale.min_score) return scale.grade
    }
    return 'E'
  }

  // Fallback if no custom scales
  for (const [cutoff, grade] of GRADE_CUTOFFS) {
    if (s >= cutoff) return grade as string
  }
  return 'E'
}

function gradeColor(grade: string): string {
  if (['A', 'A-'].includes(grade)) return 'text-emerald-600 dark:text-emerald-400'
  if (['B+', 'B', 'B-'].includes(grade)) return 'text-blue-600 dark:text-blue-400'
  if (['C+', 'C', 'C-'].includes(grade)) return 'text-amber-600 dark:text-amber-400'
  if (grade === '--') return 'text-slate-300 dark:text-slate-600'
  return 'text-red-600 dark:text-red-400'
}

export function GradesClient({ schoolId, teacherId, cls, students, exams, subjects, existingResults, isClassTeacher, availableClasses, preselectedSubjectId, gradeScales }: Props) {
  const router = useRouter()
  const [selectedExamId, setSelectedExamId] = useState(exams[0]?.id || '')
  const [selectedSubjectId, setSelectedSubjectId] = useState(preselectedSubjectId || subjects[0]?.id || '')
  const [loading, setLoading] = useState(false)
  // dirty scores: only unsaved changes
  const [dirtyScores, setDirtyScores] = useState<Record<string, string>>({})

  // Scores from DB for current exam + subject selection
  const savedScores = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    existingResults
      .filter((r) => r.exam_id === selectedExamId && r.subject_id === selectedSubjectId)
      .forEach((r) => { map[r.student_id] = r.score.toString() })
    return map
  }, [existingResults, selectedExamId, selectedSubjectId])

  // Merge saved + dirty for display
  const displayScores = useMemo(() => ({ ...savedScores, ...dirtyScores }), [savedScores, dirtyScores])

  const handleScoreChange = (studentId: string, val: string) => {
    setDirtyScores((prev) => ({ ...prev, [studentId]: val }))
  }

  const handleExamChange = (id: string) => {
    setSelectedExamId(id)
    setDirtyScores({}) // clear dirty state when switching context
  }

  const handleSubjectChange = (id: string) => {
    setSelectedSubjectId(id)
    setDirtyScores({})
  }

  const handleSave = async () => {
    if (!cls || !selectedExamId || !selectedSubjectId) return
    setLoading(true)

    const payload = Object.entries(dirtyScores)
      .map(([studentId, scoreStr]) => {
        const score = parseFloat(scoreStr)
        if (isNaN(score)) return null
        
        const grade = calculateGrade(scoreStr, gradeScales)
        const remark = gradeScales?.find(g => g.grade === grade)?.remarks || null

        return { studentId, score, grade, remarks: remark }
      })
      .filter(Boolean) as any[]

    if (payload.length === 0) {
      toast.error('No new scores to save.')
      setLoading(false)
      return
    }

    const res = await saveExamResults({ schoolId, examId: selectedExamId, subjectId: selectedSubjectId, teacherId, results: payload })

    setLoading(false)

    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success('Grades saved successfully')
      setDirtyScores({})
      router.refresh()
    }
  }

  // Stats for completion bar
  const filledCount = students.filter((s) => displayScores[s.id] !== undefined && displayScores[s.id] !== '').length
  const completionPct = students.length > 0 ? Math.round((filledCount / students.length) * 100) : 0

  // Class average
  const scores = students.map((s) => parseFloat(displayScores[s.id] || '')).filter((n) => !isNaN(n))
  const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null
  const highest = scores.length > 0 ? Math.max(...scores) : null
  const lowest = scores.length > 0 ? Math.min(...scores) : null

  if (!cls) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
        <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/40 mx-auto flex items-center justify-center mb-4">
          <PenTool className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">No Class Assigned</h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
          {isClassTeacher ? 'You must be assigned as a class teacher to enter grades.' : 'No class-subject assignments found. Ask your administrator to assign you to subjects.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Exam Grades</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{cls.name}</p>
        </div>
        <Button onClick={handleSave} disabled={loading || Object.keys(dirtyScores).length === 0} className="bg-blue-600 hover:bg-blue-700 gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Grades
        </Button>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
        {/* Class selector for subject teachers */}
        {!isClassTeacher && availableClasses.length > 1 && (
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Class</label>
            <select
              value={cls.id}
              onChange={(e) => router.push(`/teacher/grades?class=${e.target.value}`)}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {availableClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Exam</label>
          <select
            value={selectedExamId}
            onChange={(e) => handleExamChange(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            {exams.length === 0 ? <option value="">No exams found</option> : null}
            {exams.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Subject</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            {subjects.length === 0 ? <option value="">No subjects found</option> : null}
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Completion bar */}
      {students.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-muted-foreground">Completion</span>
            <span className="text-xs font-bold text-foreground">{filledCount}/{students.length} entered</span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
          </div>
          {avg !== null && (
            <div className="flex gap-4 mt-3 text-xs">
              <span className="text-muted-foreground">Avg: <strong className="text-foreground">{avg}</strong></span>
              <span className="text-muted-foreground">Highest: <strong className="text-emerald-600">{highest}</strong></span>
              <span className="text-muted-foreground">Lowest: <strong className="text-red-500">{lowest}</strong></span>
            </div>
          )}
        </div>
      )}

      {students.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-sm text-muted-foreground">No students enrolled in this class yet.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden pb-20">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-muted-foreground uppercase tracking-wider text-xs font-semibold">
                <tr>
                  <th className="px-4 py-4">Student</th>
                  <th className="px-4 py-4 w-32">Score /100</th>
                  <th className="px-4 py-4 text-right w-20">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {students.map((student) => {
                  const val = displayScores[student.id] || ''
                  const grade = calculateGrade(val)
                  const isDirty = dirtyScores[student.id] !== undefined
                  const initials = `${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}`

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {student.photo_url ? (
                            <img src={student.photo_url} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-[10px] font-bold flex items-center justify-center shrink-0">{initials}</div>
                          )}
                          <div>
                            <p className="font-medium text-foreground text-sm">{student.first_name} {student.last_name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{student.admission_number}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="â€”"
                          value={val}
                          onChange={(e) => handleScoreChange(student.id, e.target.value)}
                          className={`w-20 h-9 px-3 rounded-lg border bg-transparent text-sm focus:ring-2 outline-none transition-colors ${
                            isDirty
                              ? 'border-blue-400 focus:border-blue-500 focus:ring-blue-500/20 text-blue-700 dark:text-blue-400 font-bold'
                              : 'border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-blue-500/20'
                          }`}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-bold text-base ${gradeColor(grade)}`}>{grade}</span>
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
