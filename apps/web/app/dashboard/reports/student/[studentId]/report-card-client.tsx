'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Printer, Download, GraduationCap } from 'lucide-react'

interface School { id: string; name: string; logo_url: string | null }
interface Student { id: string; first_name: string; last_name: string; admission_number: string; photo_url: string | null; dob: string | null; classes: { name: string } | null }
interface Term { id: string; name: string; year_id: string | null; academic_years: { name: string } | null }
interface Result {
  exam_id: string
  subject_id: string
  score: number
  grade: string | null
  remarks: string | null
  subjects: { name: string; code: string | null } | null
  exam: { id: string; name: string; max_score: number } | null
}

interface Props {
  school: School
  student: Student
  activeTerm: Term | null
  activeYear: any
  allTerms: Term[]
  results: Result[]
  attendanceSummary: { present: number; absent: number; late: number; total: number }
  currentStudentId: string
  isParentView?: boolean
}

function gradeColor(grade: string | null) {
  if (!grade) return 'text-slate-400'
  if (grade.startsWith('A')) return 'text-emerald-600'
  if (grade.startsWith('B')) return 'text-blue-600'
  if (grade.startsWith('C')) return 'text-yellow-600'
  return 'text-red-500'
}

function gradeBg(grade: string | null) {
  if (!grade) return 'bg-slate-100 text-slate-500'
  if (grade.startsWith('A')) return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
  if (grade.startsWith('B')) return 'bg-blue-50 text-blue-700 border border-blue-200'
  if (grade.startsWith('C')) return 'bg-yellow-50 text-yellow-700 border border-yellow-200'
  return 'bg-red-50 text-red-700 border border-red-200'
}

export function ReportCardClient({ school, student, activeTerm, activeYear, allTerms, results, attendanceSummary, currentStudentId, isParentView = false }: Props) {
  const router = useRouter()

  const totalScore = results.reduce((sum, r) => sum + r.score, 0)
  const totalMax = results.reduce((sum, r) => sum + (r.exam?.max_score || 100), 0)
  const percentage = totalMax > 0 ? ((totalScore / totalMax) * 100).toFixed(1) : null

  const overallGrade = percentage
    ? Number(percentage) >= 80 ? 'A' : Number(percentage) >= 70 ? 'B+' : Number(percentage) >= 60 ? 'B' : Number(percentage) >= 50 ? 'C' : Number(percentage) >= 40 ? 'D' : 'E'
    : null

  const handleTermChange = (termId: string) => {
    const basePath = isParentView ? `/parent/results/${currentStudentId}` : `/dashboard/reports/student/${currentStudentId}`
    router.push(`${basePath}?termId=${termId}`)
  }

  // Group results by exam
  const byExam = results.reduce((acc: any, r) => {
    const key = r.exam_id
    if (!acc[key]) acc[key] = { exam: r.exam, subjects: [] }
    acc[key].subjects.push(r)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Toolbar — hidden on print */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-xl font-bold text-foreground">Report Card</h1>
          <p className="text-sm text-muted-foreground">{student.first_name} {student.last_name}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Term Selector */}
          <select
            defaultValue={activeTerm?.id || ''}
            onChange={e => handleTermChange(e.target.value)}
            className="bg-background border border-border text-foreground rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500/50"
          >
            <option value="">Select Term...</option>
            {allTerms.map(t => (
              <option key={t.id} value={t.id}>
                {(t.academic_years as any)?.name} — {t.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-foreground rounded-xl text-sm font-medium transition-colors"
          >
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* REPORT CARD — this section is what gets printed    */}
      {/* ═══════════════════════════════════════════════════ */}
      <div id="report-card" className="bg-white text-black rounded-3xl shadow-lg border border-slate-200 overflow-hidden print:shadow-none print:rounded-none print:border-0">
        
        {/* Header Band */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-900 p-8 text-white print:p-6">
          <div className="flex items-center gap-6">
            {/* School Logo */}
            <div className="w-20 h-20 rounded-2xl bg-white/20 overflow-hidden flex items-center justify-center shrink-0 border-2 border-white/30">
              {school?.logo_url ? (
                <img src={school.logo_url} alt={school.name} className="w-full h-full object-cover" />
              ) : (
                <GraduationCap className="w-10 h-10 text-white/60" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-extrabold tracking-tight">{school?.name || 'School Name'}</h1>
              <p className="text-blue-200 text-sm mt-1 font-medium tracking-wide uppercase">Student Academic Report Card</p>
              {activeTerm && (
                <p className="text-blue-100 text-sm mt-1">
                  {activeYear?.name || (activeTerm as any)?.academic_years?.name} &mdash; {activeTerm.name}
                </p>
              )}
            </div>
            {/* EduTrack watermark */}
            <div className="text-right text-xs text-blue-300 shrink-0">
              <p className="font-semibold">EduTrack</p>
              <p className="opacity-60">Generated {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Student Info Row */}
        <div className="bg-slate-50 border-b border-slate-200 px-8 py-5 print:px-6">
          <div className="flex items-center gap-6">
            {/* Student Photo */}
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-200 border-2 border-white shadow-md shrink-0">
              {student.photo_url ? (
                <img src={student.photo_url} alt={`${student.first_name}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-slate-400">
                  {student.first_name[0]}{student.last_name[0]}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Student Name</p>
                <p className="font-bold text-slate-900 mt-0.5">{student.first_name} {student.last_name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Adm. Number</p>
                <p className="font-bold text-slate-900 mt-0.5">{student.admission_number}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Class</p>
                <p className="font-bold text-slate-900 mt-0.5">{(student.classes as any)?.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Term</p>
                <p className="font-bold text-slate-900 mt-0.5">{activeTerm?.name || 'Not Specified'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Results Body */}
        <div className="p-8 print:p-6 space-y-8">
          {results.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 text-sm">No results recorded for this term yet.</p>
            </div>
          ) : (
            <>
              {Object.values(byExam).map((group: any) => (
                <div key={group.exam.id}>
                  <h3 className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wide border-b border-slate-200 pb-2">
                    {group.exam.name} <span className="text-slate-400 font-normal normal-case">· Max: {group.exam.max_score}</span>
                  </h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide rounded-l-lg">Subject</th>
                        <th className="text-center px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Score</th>
                        <th className="text-center px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Grade</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide rounded-r-lg">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {group.subjects.map((r: Result, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-medium text-slate-900">{r.subjects?.name || '—'}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-bold text-slate-900">{r.score}</span>
                            <span className="text-slate-400">/{group.exam.max_score}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${gradeBg(r.grade)}`}>
                              {r.grade || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">{r.remarks || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

              {/* Summary Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-6 border-t-2 border-slate-200">
                <div className="text-center bg-blue-50 border border-blue-100 rounded-2xl p-4">
                  <p className="text-2xl font-extrabold text-blue-700">{totalScore}</p>
                  <p className="text-xs text-blue-500 mt-1 font-medium">Total Score</p>
                  <p className="text-xs text-slate-400">out of {totalMax}</p>
                </div>
                <div className="text-center bg-purple-50 border border-purple-100 rounded-2xl p-4">
                  <p className="text-2xl font-extrabold text-purple-700">{percentage ? `${percentage}%` : '—'}</p>
                  <p className="text-xs text-purple-500 mt-1 font-medium">Average %</p>
                </div>
                <div className={`text-center rounded-2xl p-4 ${gradeBg(overallGrade)}`}>
                  <p className="text-2xl font-extrabold">{overallGrade || '—'}</p>
                  <p className="text-xs mt-1 font-medium">Overall Grade</p>
                </div>
                <div className="text-center bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-emerald-600">P: {attendanceSummary.present}</span>
                    <span className="text-red-500">A: {attendanceSummary.absent}</span>
                    <span className="text-orange-500">L: {attendanceSummary.late}</span>
                  </div>
                  <p className="text-2xl font-extrabold text-slate-700">
                    {attendanceSummary.total > 0
                      ? `${Math.round((attendanceSummary.present / attendanceSummary.total) * 100)}%`
                      : '—'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Attendance</p>
                </div>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="border-t border-slate-200 pt-6 mt-4 grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="border-t-2 border-slate-300 pt-2">
                <p className="text-xs text-slate-500">Class Teacher Signature</p>
              </div>
            </div>
            <div>
              <div className="border-t-2 border-slate-300 pt-2">
                <p className="text-xs text-slate-500">Head Teacher / Principal</p>
              </div>
            </div>
            <div>
              <div className="border-t-2 border-slate-300 pt-2">
                <p className="text-xs text-slate-500">Parent / Guardian Signature</p>
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-slate-400 mt-4">Powered by EduTrack · {school?.name}</p>
        </div>
      </div>

      {/* Print styles injected via style tag */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #report-card, #report-card * { visibility: visible; }
          #report-card { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  )
}
