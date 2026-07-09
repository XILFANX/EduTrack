'use client'

import { useState } from 'react'
import { updateAccountSettings } from './actions'

interface Props {
  initialName: string
  initialPhone: string
}

export default function AccountClient({ initialName, initialPhone }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setStatus(null)
    const formData = new FormData(e.currentTarget)
    const res = await updateAccountSettings(formData)
    if ('error' in res) {
      setStatus({ type: 'error', text: res.error! })
    } else {
      setStatus({ type: 'success', text: 'Profile saved successfully!' })
    }
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      {status && (
        <div className={`p-3 rounded-xl text-sm font-medium ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
          {status.text}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Full Name</label>
        <input
          name="full_name"
          defaultValue={initialName}
          required
          className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Phone Number</label>
        <input
          type="tel"
          name="phone"
          defaultValue={initialPhone}
          className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 mt-2"
      >
        {submitting ? 'Saving…' : 'Save Profile'}
      </button>
    </form>
  )
}
