"use client"

import { useState } from 'react'
import { setupDevPin } from './action'
import { Loader2, ShieldCheck, Eye, EyeOff } from 'lucide-react'

export function SetupPinForm() {
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (pin.length < 4) {
      setError('PIN must be at least 4 characters.')
      return
    }

    if (pin !== confirmPin) {
      setError('PINs do not match.')
      setConfirmPin('')
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.append('pin', pin)
    formData.append('confirmPin', confirmPin)

    const res = await setupDevPin(formData)
    if (!res.success) {
      setError(res.error ?? 'Failed to set PIN.')
      setLoading(false)
    } else {
      window.location.reload()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-mono text-zinc-400 tracking-widest uppercase">Create PIN</label>
        <div className="relative">
          <input
            type={showPin ? 'text' : 'password'}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter PIN (min 4 chars)"
            className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 pr-12 text-center text-xl font-mono text-white tracking-widest focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
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
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-mono text-zinc-400 tracking-widest uppercase">Confirm PIN</label>
        <input
          type="password"
          value={confirmPin}
          onChange={(e) => setConfirmPin(e.target.value)}
          placeholder="Re-enter PIN"
          className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-center text-xl font-mono text-white tracking-widest focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
          disabled={loading}
        />
      </div>

      {error && (
        <p className="text-red-400 text-sm font-mono text-center bg-red-950/20 border border-red-900/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <p className="text-xs font-mono text-zinc-600 text-center leading-relaxed">
        This PIN is hashed with scrypt and stored securely.<br />
        It cannot be recovered — keep it safe.
      </p>

      <button
        type="submit"
        disabled={loading || pin.length < 4 || !confirmPin}
        className="w-full bg-emerald-500 text-black font-mono font-bold rounded-xl px-4 py-3 hover:bg-emerald-400 active:scale-95 transition-all disabled:opacity-40 disabled:active:scale-100 flex items-center justify-center gap-2"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <ShieldCheck className="w-5 h-5" />
            SET PIN & UNLOCK
          </>
        )}
      </button>
    </form>
  )
}
