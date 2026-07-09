'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, ChevronDown, ChevronUp, X, GraduationCap, Users, BookMarked, ArrowRight, CheckCircle2 } from 'lucide-react'

interface OnboardingWizardProps {
  totalStaff: number
  totalClasses: number
  totalSubjects: number
}

export function OnboardingWizard({ totalStaff, totalClasses, totalSubjects }: OnboardingWizardProps) {
  const [dismissed, setDismissed] = useState(false)
  const [expanded, setExpanded] = useState(true)

  // Only show if at least one metric is 0
  if (dismissed || (totalStaff > 0 && totalClasses > 0 && totalSubjects > 0)) return null

  const steps = [
    {
      id: 'subjects',
      label: 'Add Subjects',
      desc: 'Set up your curriculum subjects',
      icon: BookMarked,
      completed: totalSubjects > 0,
      href: '/dashboard/subjects',
      cta: 'Add Subjects'
    },
    {
      id: 'classes',
      label: 'Create Classes',
      desc: 'Set up classrooms and streams',
      icon: Users,
      completed: totalClasses > 0,
      href: '/dashboard/classes',
      cta: 'Create Classes'
    },
    {
      id: 'staff',
      label: 'Invite Staff',
      desc: 'Add teachers and administrators',
      icon: GraduationCap,
      completed: totalStaff > 0,
      href: '/dashboard/staff',
      cta: 'Invite Staff'
    }
  ]

  const completedCount = steps.filter(s => s.completed).length
  const progress = Math.round((completedCount / steps.length) * 100)

  return (
    <div className="rounded-2xl border border-blue-200 dark:border-blue-500/30 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/5 shadow-sm overflow-hidden mb-7">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2">
              Welcome to EduTrack! Let&apos;s get your school set up
            </h2>
            <p className="text-xs text-blue-700/70 dark:text-blue-400/60 mt-0.5">
              Complete these steps to fully activate your portal
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setExpanded(e => !e)}
            className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-colors"
            aria-label="Toggle wizard"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600/60 dark:text-blue-400/60 transition-colors"
            aria-label="Dismiss wizard"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 space-y-4">
          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-blue-800 dark:text-blue-400 font-medium">
                {completedCount} of {steps.length} steps completed
              </span>
              <span className="font-bold text-blue-700 dark:text-blue-300">{progress}%</span>
            </div>
            <div className="w-full bg-blue-200/60 dark:bg-blue-500/20 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400 transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Checklist */}
          <div className="grid gap-3 sm:grid-cols-3">
            {steps.map(step => (
              <div key={step.id} className="bg-white/70 dark:bg-slate-900/40 rounded-xl border border-blue-100 dark:border-blue-500/10 overflow-hidden flex flex-col h-full">
                <div className="p-4 flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                      <step.icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    {step.completed && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    )}
                  </div>
                  <h3 className="font-semibold text-foreground text-sm">{step.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{step.desc}</p>
                </div>
                
                <div className="px-4 pb-4 mt-auto">
                  {step.completed ? (
                    <div className="w-full py-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold text-center border border-emerald-100 dark:border-emerald-500/20">
                      Completed
                    </div>
                  ) : (
                    <Link
                      href={step.href}
                      className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                    >
                      {step.cta} <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
