"use client"

import { useState } from 'react'
import { verifyDevPin } from './action'
import { Loader2, Eye, EyeOff } from 'lucide-react'

export function PinForm() {
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
      window.location.reload()
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
          className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 pr-12 text-center text-2xl font-mono text-white tracking-widest focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
          disabled={loading}
          autoFocus
        />
        <button
          type="button"
          onClick={() => setShowPin(!showPin)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {error && (
        <p className="text-red-400 text-sm font-mono text-center bg-red-950/20 border border-red-900/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !pin}
        className="w-full bg-white text-black font-mono font-bold rounded-xl px-4 py-3 hover:bg-zinc-200 active:scale-95 transition-all disabled:opacity-40 disabled:active:scale-100 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'UNLOCK'}
      </button>
    </form>
  )
}
