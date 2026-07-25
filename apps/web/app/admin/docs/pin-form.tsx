'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { verifyDevPin } from './action'
import { Loader2, Eye, EyeOff } from 'lucide-react'

export function PinForm() {
  const router = useRouter()
  const [pin, setPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData()
    formData.append('pin', pin)

    const res = await verifyDevPin(formData)
    if (!res.success) {
      setError(res.error ?? 'Incorrect PIN.')
      setPin('')
    } else {
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="relative">
        <input
          type={showPin ? 'text' : 'password'}
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="••••"
          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 pr-12 text-center text-2xl font-mono text-slate-900 dark:text-white tracking-widest focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
          disabled={loading}
          autoFocus
          maxLength={12}
        />
        <button
          type="button"
          onClick={() => setShowPin(!showPin)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm font-mono text-center bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !pin}
        className="w-full bg-violet-600 text-white font-mono font-bold rounded-xl px-4 py-3 hover:bg-violet-700 active:scale-95 transition-all disabled:opacity-40 disabled:active:scale-100 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'UNLOCK'}
      </button>
    </form>
  )
}
