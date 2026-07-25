'use client'

import { useState, useTransition } from 'react'
import { extendTrial, updateSubscriptionStatus } from '../actions'
import { CalendarPlus, ShieldAlert, CheckCircle2 } from 'lucide-react'

interface Props {
  schoolId: string
  currentStatus: string
}

export function ManageClientCard({ schoolId, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleExtendTrial() {
    startTransition(async () => {
      setError(null)
      try {
        await extendTrial(schoolId)
      } catch (e: any) {
        setError(e.message)
      }
    })
  }

  function handleUpdateStatus(newStatus: string) {
    startTransition(async () => {
      setError(null)
      try {
        await updateSubscriptionStatus(schoolId, newStatus)
      } catch (e: any) {
        setError(e.message)
      }
    })
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Client Management Actions</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Manually override subscription and trial statuses.</p>
      </div>

      {error && (
        <div className="text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <button
          onClick={handleExtendTrial}
          disabled={isPending}
          className="flex items-center gap-2 bg-muted/50 hover:bg-muted text-foreground px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          <CalendarPlus className="w-4 h-4 text-blue-500" />
          Extend Trial by 14 Days
        </button>
        
        <div className="border-t border-border pt-3 mt-1 flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Set Status</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleUpdateStatus('active')}
              disabled={isPending || currentStatus === 'active'}
              className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Active
            </button>
            <button
              onClick={() => handleUpdateStatus('suspended')}
              disabled={isPending || currentStatus === 'suspended'}
              className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 px-3 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Suspend Account
            </button>
            <button
              onClick={() => handleUpdateStatus('expired')}
              disabled={isPending || currentStatus === 'expired'}
              className="flex items-center gap-1.5 bg-muted/50 hover:bg-muted text-foreground border border-border px-3 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
            >
              Set Expired
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
