'use client'

import { useState } from 'react'
import { ExamsManager } from './exams-manager'
import { GradeScalesManager } from './grade-scales-manager'

interface Props {
  years: any[]
  terms: any[]
  classes: any[]
  initialExams: any[]
  initialGradeScales: any[]
  schoolId: string
}

export function AdminExamsTabs({ years, terms, classes, initialExams, initialGradeScales, schoolId }: Props) {
  const [activeTab, setActiveTab] = useState<'exams' | 'grading'>('exams')

  return (
    <div className="space-y-6">
      <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('exams')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === 'exams'
              ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
          }`}
        >
          Exams
        </button>
        <button
          onClick={() => setActiveTab('grading')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === 'grading'
              ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
          }`}
        >
          Grading System
        </button>
      </div>

      {activeTab === 'exams' ? (
        <ExamsManager
          years={years}
          terms={terms}
          classes={classes}
          initialExams={initialExams}
        />
      ) : (
        <GradeScalesManager
          schoolId={schoolId}
          initialGradeScales={initialGradeScales}
        />
      )}
    </div>
  )
}
