'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Save, Loader2, PenTool } from 'lucide-react'
import { saveExamResults } from './actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Student {
  id: string
  first_name: string
  last_name: string
  admission_number: string
}

interface Exam {
  id: string
  name: string
}

interface Subject {
  id: string
  name: string
}

interface Props {
  schoolId: string
  teacherId: string
  cls: { id: string; name: string } | null
  students: Student[]
  exams: Exam[]
  subjects: Subject[]
  existingResults: any[]
}

export function GradesClient({ schoolId, teacherId, cls, students, exams, subjects, existingResults }: Props) {
  const router = useRouter()
  const [selectedExamId, setSelectedExamId] = useState(exams[0]?.id || '')
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || '')
  const [loading, setLoading] = useState(false)

  // Derive initial state from existing results based on selected exam/subject
  // We'll store scores in a dictionary keyed by studentId
  const [scores, setScores] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    existingResults.forEach((r) => {
      // For simplicity, we initialize with what's loaded, but they technically need filtering.
      // However, it's easier to just initialize an empty object and let the effect sync it, or 
      // do it synchronously below.
    })
    return initial
  })

  // Whenever exam or subject changes, reload the scores mapping
  // (In a real app, you'd fetch from the server on change, but here we preload them all for simplicity)
  const currentScores: Record<string, string> = {}
  existingResults
    .filter((r) => r.exam_id === selectedExamId && r.subject_id === selectedSubjectId)
    .forEach((r) => {
      currentScores[r.student_id] = r.score.toString()
    })

  // We merge DB scores with local unsaved changes for the current selection
  const displayScores = { ...currentScores, ...scores }

  const calculateGrade = (scoreStr: string) => {
    const s = parseFloat(scoreStr)
    if (isNaN(s)) return '--'
    if (s >= 80) return 'A'
    if (s >= 75) return 'A-'
    if (s >= 70) return 'B+'
    if (s >= 65) return 'B'
    if (s >= 60) return 'B-'
    if (s >= 55) return 'C+'
    if (s >= 50) return 'C'
    if (s >= 45) return 'C-'
    if (s >= 40) return 'D+'
    if (s >= 35) return 'D'
    if (s >= 30) return 'D-'
    return 'E'
  }

  const handleScoreChange = (studentId: string, val: string) => {
    setScores((prev) => ({ ...prev, [studentId]: val }))
  }

  const handleSave = async () => {
    if (!cls || !selectedExamId || !selectedSubjectId) return
    setLoading(true)

    const payload = Object.entries(scores)
      .map(([studentId, scoreStr]) => {
        const score = parseFloat(scoreStr)
        if (isNaN(score)) return null
        return {
          studentId,
          score,
          grade: calculateGrade(scoreStr),
        }
      })
      .filter(Boolean) as any[]

    if (payload.length === 0) {
      toast.error('No valid scores to save.')
      setLoading(false)
      return
    }

    const res = await saveExamResults({
      schoolId,
      examId: selectedExamId,
      subjectId: selectedSubjectId,
      teacherId,
      results: payload,
    })

    setLoading(false)

    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success('Grades saved successfully')
      // Clear local dirty state
      setScores({})
      router.refresh()
    }
  }

  if (!cls) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
        <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 mx-auto flex items-center justify-center mb-4">
          <PenTool className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">No Class Assigned</h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
          You must be assigned to a class to enter grades.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Exam Grades</h1>
          <p className="text-sm text-muted-foreground mt-1">Entering scores for {cls.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={loading || Object.keys(scores).length === 0} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Draft
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
        <div className="flex-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Select Exam</label>
          <select 
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
          >
            {exams.length === 0 ? <option value="">No exams found</option> : null}
            {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Select Subject</label>
          <select 
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
          >
            {subjects.length === 0 ? <option value="">No subjects found</option> : null}
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

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
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4 w-32">Score (100)</th>
                  <th className="px-6 py-4 text-right w-24">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {students.map((student) => {
                  const val = displayScores[student.id] || ''
                  const grade = calculateGrade(val)
                  const isDirty = scores[student.id] !== undefined
                  
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">{student.first_name} {student.last_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{student.admission_number}</p>
                      </td>
                      <td className="px-6 py-4">
                        <input 
                          type="number" 
                          min="0"
                          max="100"
                          placeholder="0"
                          value={val}
                          onChange={(e) => handleScoreChange(student.id, e.target.value)}
                          className={`w-20 h-9 px-3 rounded-lg border bg-transparent text-sm focus:ring-2 outline-none transition-colors ${
                            isDirty 
                              ? 'border-indigo-400 focus:border-indigo-500 focus:ring-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-bold' 
                              : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20'
                          }`}
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-bold ${grade === '--' ? 'text-slate-300' : 'text-foreground'}`}>
                          {grade}
                        </span>
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
