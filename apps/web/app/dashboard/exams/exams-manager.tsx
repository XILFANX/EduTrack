'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, Trash2, BookOpen, ChevronDown } from 'lucide-react'
import { createExam, deleteExam } from '@/app/actions/exams'
import { Card, CardContent } from '@/components/ui/card'

interface Year { id: string; name: string; is_active: boolean }
interface Term { id: string; name: string; year_id: string | null; is_active: boolean }
interface ClassItem { id: string; name: string }
interface Exam { id: string; name: string; max_score: number; term_id: string | null; year_id: string | null; class_id: string | null; created_at: string }

interface Props {
  years: Year[]
  terms: Term[]
  classes: ClassItem[]
  initialExams: Exam[]
}

export function ExamsManager({ years, terms, classes, initialExams }: Props) {
  const router = useRouter()
  const [exams, setExams] = useState(initialExams)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [selectedYearId, setSelectedYearId] = useState(years.find(y => y.is_active)?.id || years[0]?.id || '')
  const [selectedTermId, setSelectedTermId] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [maxScore, setMaxScore] = useState(100)

  const filteredTerms = terms.filter(t => t.year_id === selectedYearId)

  // Lookup helpers
  const getTermName = (id: string | null) => terms.find(t => t.id === id)?.name || '—'
  const getYearName = (id: string | null) => years.find(y => y.id === id)?.name || '—'
  const getClassName = (id: string | null) => classes.find(c => c.id === id)?.name || 'All Classes'

  const resetForm = () => {
    setName('')
    setSelectedTermId('')
    setSelectedClassId('')
    setMaxScore(100)
    setShowModal(false)
    setError(null)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedYearId || !selectedTermId) {
      setError('Please select an academic year and term.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const exam = await createExam({
        name,
        termId: selectedTermId,
        yearId: selectedYearId,
        classId: selectedClassId || null,
        maxScore,
      })
      setExams([exam as any, ...exams])
      resetForm()
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (examId: string) => {
    if (!confirm('Delete this exam? All associated results will also be removed.')) return
    setDeletingId(examId)
    try {
      await deleteExam(examId)
      setExams(exams.filter(e => e.id !== examId))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  // Group exams by year → term
  const grouped = exams.reduce((acc: any, exam) => {
    const yearKey = exam.year_id || 'unassigned'
    const termKey = exam.term_id || 'unassigned'
    if (!acc[yearKey]) acc[yearKey] = {}
    if (!acc[yearKey][termKey]) acc[yearKey][termKey] = []
    acc[yearKey][termKey].push(exam)
    return acc
  }, {} as Record<string, Record<string, Exam[]>>)

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-xl text-sm">{error}</div>
      )}

      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Exam
        </button>
      </div>

      {/* Grouped exam list */}
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-3xl">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground">No Exams Created</h3>
          <p className="text-muted-foreground mt-2 text-sm">Create your first exam to get started.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([yearId, termGroups]) => (
          <div key={yearId} className="space-y-4">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span>
              {getYearName(yearId)}
            </h2>
            {Object.entries(termGroups as any).map(([termId, termExams]) => (
              <div key={termId} className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950 border-b border-border flex items-center gap-2">
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">{getTermName(termId)}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{(termExams as Exam[]).length} exam(s)</span>
                </div>
                <div className="divide-y divide-border">
                  {(termExams as Exam[]).map(exam => (
                    <div key={exam.id} className="flex items-center justify-between px-5 py-4">
                      <div>
                        <p className="font-semibold text-foreground">{exam.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {getClassName(exam.class_id)} · Max Score: {exam.max_score}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <a
                          href={`/dashboard/reports?examId=${exam.id}`}
                          className="text-xs font-medium text-purple-600 hover:underline"
                        >
                          View Results
                        </a>
                        <button
                          onClick={() => handleDelete(exam.id)}
                          disabled={deletingId === exam.id}
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          {deletingId === exam.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))
      )}

      {/* Create Exam Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-3xl p-6 shadow-2xl border border-border">
            <h3 className="text-xl font-bold mb-5">Create New Exam</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Exam Name</label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. End of Term 1 Exam"
                  required
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Academic Year</label>
                  <select
                    value={selectedYearId}
                    onChange={e => { setSelectedYearId(e.target.value); setSelectedTermId('') }}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/50"
                  >
                    {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Term</label>
                  <select
                    value={selectedTermId}
                    onChange={e => setSelectedTermId(e.target.value)}
                    required
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/50"
                  >
                    <option value="">Select term...</option>
                    {filteredTerms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Class (optional)</label>
                  <select
                    value={selectedClassId}
                    onChange={e => setSelectedClassId(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/50"
                  >
                    <option value="">All Classes</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Max Score</label>
                  <input
                    type="number" value={maxScore} min={1} max={1000}
                    onChange={e => setMaxScore(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <button type="button" onClick={resetForm}
                  className="flex-1 py-2.5 rounded-xl font-medium text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl font-semibold bg-purple-600 hover:bg-purple-700 text-white flex justify-center items-center transition-colors disabled:opacity-50">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
