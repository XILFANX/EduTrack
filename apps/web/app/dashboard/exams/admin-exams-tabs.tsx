'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ExamsManager } from './exams-manager'
import { GradeScalesManager } from './grade-scales-manager'
import { ExamScheduler } from './exam-scheduler'
import { ClipboardList, Sliders, CalendarDays } from 'lucide-react'

interface Props {
  years: any[]
  terms: any[]
  classes: any[]
  initialExams: any[]
  initialGradeScales: any[]
  schoolId: string
  subjects: any[]
  selectedExamId: string
  selectedExam: any
  initialExamSlots: any[]
  forceActiveTab?: 'exams' | 'schedule' | 'grading'
  selectedClassId?: string
}

export function AdminExamsTabs({
  years, terms, classes, initialExams, initialGradeScales,
  schoolId, subjects, selectedExamId, selectedExam, initialExamSlots,
  forceActiveTab, selectedClassId
}: Props) {
  const [activeTab, setActiveTab] = useState<'exams' | 'schedule' | 'grading'>(forceActiveTab || 'exams')

  // If we're forcing a tab (e.g. bulk mode or global grading mode), we don't show the tab bar.
  // Except if it's class-specific, then we only show Exams and Schedule tabs.
  const tabs = selectedClassId 
    ? [
        { id: 'exams', label: 'Exams', icon: ClipboardList },
        { id: 'schedule', label: 'Schedule', icon: CalendarDays },
      ] as const
    : [
        { id: 'exams', label: 'Exams', icon: ClipboardList },
        { id: 'schedule', label: 'Schedule', icon: CalendarDays },
        { id: 'grading', label: 'Grading System', icon: Sliders },
      ] as const

  return (
    <div className="space-y-6">
      {/* Tab bar (hide if forced, unless it's just a class where we still want exams/schedule toggle) */}
      {(!forceActiveTab || selectedClassId) && (
        <div className="flex bg-[#121827] border border-slate-800 p-1 rounded-xl w-fit gap-0.5 shadow-sm">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#1a2133] text-purple-400 shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a2133]/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      )}

      {activeTab === 'exams' && (
        <ExamsManager
          years={years}
          terms={terms}
          classes={classes}
          initialExams={initialExams}
        />
      )}

      {activeTab === 'schedule' && (
        <div className="space-y-5">
          {/* Exam Selector */}
          {initialExams.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-700 rounded-2xl bg-[#121827]">
              <ClipboardList className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Create an exam first before scheduling subjects.</p>
            </div>
          ) : (
            <>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">Select Exam to Schedule</p>
                <div className="flex gap-2 flex-wrap">
                  {initialExams.map((exam: any) => {
                    const isSelected = selectedExamId === exam.id
                    const className = exam.class_id ? classes.find(c => c.id === exam.class_id)?.name : null
                    return (
                      <Link
                        key={exam.id}
                        href={selectedClassId ? `/dashboard/exams?class=${selectedClassId}&exam=${exam.id}` : `/dashboard/exams?mode=bulk&exam=${exam.id}`}
                        onClick={() => setActiveTab('schedule')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                          isSelected
                            ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                            : 'bg-[#121827] text-slate-300 border-slate-800 hover:bg-[#1a2133]'
                        }`}
                      >
                        {exam.name}
                        {className && !selectedClassId && <span className="ml-1.5 opacity-70 text-xs">({className})</span>}
                      </Link>
                    )
                  })}
                </div>
              </div>

              {selectedExam && (
                <div className="bg-[#121827] border border-slate-800 rounded-3xl p-5">
                  <div className="mb-4">
                    <h3 className="font-bold text-slate-100">{selectedExam.name}</h3>
                    <p className="text-sm text-slate-400">Max Score: {selectedExam.max_score} marks · Schedule which subjects sit this exam and when.</p>
                  </div>
                  <ExamScheduler
                    exam={selectedExam}
                    subjects={subjects}
                    classes={classes}
                    initialSlots={initialExamSlots}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'grading' && (
        <GradeScalesManager
          schoolId={schoolId}
          initialGradeScales={initialGradeScales}
        />
      )}
    </div>
  )
}
