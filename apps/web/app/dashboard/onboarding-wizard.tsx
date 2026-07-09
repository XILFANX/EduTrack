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

  if (dismissed || (totalStaff > 0 && totalClasses > 0 && totalSubjects > 0)) return null

  // Order: Staff → Classes → Subjects
  const steps = [
    {
      id: 'staff',
      label: 'Invite Staff',
      desc: 'Add teachers & administrators',
      icon: GraduationCap,
      completed: totalStaff > 0,
      href: '/dashboard/staff',
      cta: 'Invite Staff'
    },
    {
      id: 'classes',
      label: 'Create Classes',
      desc: 'Set up classrooms & streams',
      icon: Users,
      completed: totalClasses > 0,
      href: '/dashboard/classes',
      cta: 'Create Classes'
    },
    {
      id: 'subjects',
      label: 'Add Subjects',
      desc: 'Set up curriculum subjects',
      icon: BookMarked,
      completed: totalSubjects > 0,
      href: '/dashboard/subjects',
      cta: 'Add Subjects'
    }
  ]

  const completedCount = steps.filter(s => s.completed).length
  const progress = Math.round((completedCount / steps.length) * 100)

  return (
    <div className="rounded-2xl border border-blue-200 dark:border-blue-500/30 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/5 shadow-sm overflow-hidden mb-7">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-blue-900 dark:text-blue-300 truncate">
              Let&apos;s get your school set up!
            </h2>
            <p className="text-xs text-blue-700/60 dark:text-blue-400/60 hidden sm:block">
              {completedCount} of {steps.length} steps completed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <button
            onClick={() => setExpanded(e => !e)}
            className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-colors"
            aria-label="Toggle wizard"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600/50 dark:text-blue-400/50 transition-colors"
            aria-label="Dismiss wizard"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-blue-800 dark:text-blue-400 font-medium sm:hidden">
                {completedCount}/{steps.length} steps done
              </span>
              <span className="font-bold text-blue-700 dark:text-blue-300 ml-auto">{progress}%</span>
            </div>
            <div className="w-full bg-blue-200/60 dark:bg-blue-500/20 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400 transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Steps — vertical list on mobile, 3-col grid on md+ */}
          <div className="flex flex-col gap-2 md:grid md:grid-cols-3 md:gap-3">
            {steps.map((step, idx) => (
              <div
                key={step.id}
                className="flex items-center gap-3 bg-white/70 dark:bg-slate-900/40 rounded-xl border border-blue-100 dark:border-blue-500/10 px-3 py-2.5 md:flex-col md:items-start md:p-4"
              >
                {/* Step number badge */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold md:hidden ${step.completed ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'}`}>
                  {step.completed ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                </div>

                {/* Desktop icon */}
                <div className="hidden md:flex items-start justify-between mb-1 w-full">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                    <step.icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  {step.completed && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                </div>

                {/* Label + desc */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-tight">{step.label}</p>
                  <p className="text-xs text-muted-foreground hidden md:block mt-0.5">{step.desc}</p>
                </div>

                {/* Action */}
                {step.completed ? (
                  <span className="shrink-0 text-xs font-semibold text-emerald-600 dark:text-emerald-400 md:hidden">Done</span>
                ) : (
                  <Link
                    href={step.href}
                    className="shrink-0 flex items-center gap-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    <span className="hidden sm:inline">{step.cta}</span>
                    <span className="sm:hidden">Go</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}

                {/* Desktop completed button */}
                {step.completed && (
                  <div className="hidden md:flex w-full mt-2 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold justify-center border border-emerald-100 dark:border-emerald-500/20">
                    Completed
                  </div>
                )}
                {!step.completed && (
                  <Link
                    href={step.href}
                    className="hidden md:flex items-center justify-center gap-1.5 w-full mt-2 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                  >
                    {step.cta} <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
