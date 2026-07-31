'use client'

import { useState, useTransition } from 'react'
import { upsertMessagingPolicy } from '@/app/actions/chat'
import { ShieldCheck, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface Policy {
  parents_can_message_teachers: boolean
  parents_can_message_admin: boolean
  parents_can_message_parents: boolean
  subject_teachers_can_message_parents: boolean
}

export function MessagingPoliciesClient({ initialPolicy }: { initialPolicy: Policy }) {
  const [policy, setPolicy] = useState<Policy>(initialPolicy)
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const toggle = (key: keyof Policy) => {
    setPolicy(prev => ({ ...prev, [key]: !prev[key] }))
    setStatus('idle')
  }

  const handleSave = () => {
    startTransition(async () => {
      try {
        await upsertMessagingPolicy(policy)
        setStatus('success')
        setTimeout(() => setStatus('idle'), 3000)
      } catch {
        setStatus('error')
      }
    })
  }

  const rules: { key: keyof Policy; label: string; desc: string; warn?: boolean }[] = [
    {
      key: 'parents_can_message_teachers',
      label: 'Parents can message Class Teachers',
      desc: 'Allow parents to initiate direct conversations with their child\'s class teacher.',
    },
    {
      key: 'parents_can_message_admin',
      label: 'Parents can message School Admin',
      desc: 'Allow parents to send direct messages to principals, headteachers, and admin staff.',
    },
    {
      key: 'parents_can_message_parents',
      label: 'Parents can message other Parents',
      desc: 'Allow parents to message other parents in the same class. Disable to prevent peer-to-peer parent contact.',
      warn: true,
    },
    {
      key: 'subject_teachers_can_message_parents',
      label: 'Subject Teachers can message Parents',
      desc: 'Allow subject teachers to initiate direct conversations with parents of students in their classes.',
    },
  ]

  return (
    <div className="space-y-4">
      {rules.map(rule => (
        <div
          key={rule.key}
          className={`flex items-start justify-between gap-6 p-5 rounded-2xl border transition-colors ${
            policy[rule.key]
              ? 'bg-cyan-50/50 dark:bg-cyan-900/10 border-cyan-200 dark:border-cyan-800'
              : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-foreground text-sm">{rule.label}</p>
              {rule.warn && (
                <span className="text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-2 py-0.5 rounded-full">
                  Privacy Risk
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{rule.desc}</p>
          </div>
          <button
            onClick={() => toggle(rule.key)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 ${
              policy[rule.key] ? 'bg-cyan-600' : 'bg-slate-300 dark:bg-slate-600'
            }`}
            role="switch"
            aria-checked={policy[rule.key]}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                policy[rule.key] ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      ))}

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2 text-sm">
          {status === 'success' && (
            <>
              <CheckCircle2 className="w-4 h-4 text-cyan-500" />
              <span className="text-cyan-600 font-medium">Policies saved successfully</span>
            </>
          )}
          {status === 'error' && (
            <>
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-red-600 font-medium">Failed to save. Try again.</span>
            </>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-sm rounded-xl transition-colors disabled:opacity-60 shadow-sm"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          Save Policies
        </button>
      </div>
    </div>
  )
}
