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
}

export function AdminExamsTabs({
  years, terms, classes, initialExams, initialGradeScales,
  schoolId, subjects, selectedExamId, selectedExam, initialExamSlots
}: Props) {
  const [activeTab, setActiveTab] = useState<'exams' | 'schedule' | 'grading'>('exams')

  const tabs = [
    { id: 'exams', label: 'Exams', icon: ClipboardList },
    { id: 'schedule', label: 'Schedule', icon: CalendarDays },
    { id: 'grading', label: 'Grading System', icon: Sliders },
  ] as const

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl w-fit gap-0.5">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

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
            <div className="text-center py-12 border border-dashed border-border rounded-2xl">
              <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Create an exam first before scheduling subjects.</p>
            </div>
          ) : (
            <>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Select Exam to Schedule</p>
                <div className="flex gap-2 flex-wrap">
                  {initialExams.map((exam: any) => {
                    const isSelected = selectedExamId === exam.id
                    const className = exam.class_id ? classes.find(c => c.id === exam.class_id)?.name : null
                    return (
                      <Link
                        key={exam.id}
                        href={`/dashboard/exams?exam=${exam.id}`}
                        onClick={() => setActiveTab('schedule')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                          isSelected
                            ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                            : 'bg-card text-foreground border-border hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {exam.name}
                        {className && <span className="ml-1.5 opacity-70 text-xs">({className})</span>}
                      </Link>
                    )
                  })}
                </div>
              </div>

              {selectedExam && (
                <div className="bg-card border border-border rounded-3xl p-5">
                  <div className="mb-4">
                    <h3 className="font-bold text-foreground">{selectedExam.name}</h3>
                    <p className="text-sm text-muted-foreground">Max Score: {selectedExam.max_score} marks · Schedule which subjects sit this exam and when.</p>
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
