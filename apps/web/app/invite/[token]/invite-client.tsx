'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Eye, EyeOff, CheckCircle2, GraduationCap } from 'lucide-react'
import { activatePortal } from './actions'

const ROLE_LABELS: Record<string, string> = {
  class_teacher:    'Class Teacher',
  subject_teacher:  'Subject Teacher',
  bursar:           'Bursar',
  librarian:        'Librarian',
  storekeeper:      'Storekeeper',
  transport_matron: 'Transport Matron',
  parent:           'Parent',
}

const ROLE_COLORS: Record<string, { badge: string; btn: string; glow: string }> = {
  class_teacher:    { badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300', btn: 'bg-violet-600 hover:bg-violet-700', glow: 'from-violet-500/10 to-slate-950' },
  subject_teacher:  { badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',         btn: 'bg-blue-600 hover:bg-blue-700',     glow: 'from-blue-500/10 to-slate-950' },
  bursar:           { badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', btn: 'bg-emerald-600 hover:bg-emerald-700', glow: 'from-emerald-500/10 to-slate-950' },
  librarian:        { badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',     btn: 'bg-amber-500 hover:bg-amber-600',   glow: 'from-amber-500/10 to-slate-950' },
  storekeeper:      { badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300', btn: 'bg-orange-600 hover:bg-orange-700', glow: 'from-orange-500/10 to-slate-950' },
  transport_matron: { badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',        btn: 'bg-slate-700 hover:bg-slate-800',   glow: 'from-slate-500/10 to-slate-950' },
  parent:           { badge: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',         btn: 'bg-pink-600 hover:bg-pink-700',     glow: 'from-pink-500/10 to-slate-950' },
}

interface Props {
  token: string
  fullName: string
  role: string
  schoolName: string
}

export default function InviteClient({ token, fullName, role, schoolName }: Props) {
  const [phone, setPhone]           = useState('')
  const [password, setPassword]     = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showPassword, setShowPassword]   = useState(false)
  const [showConfirm, setShowConfirm]     = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [loading, setLoading]       = useState(false)

  const colors = ROLE_COLORS[role] ?? ROLE_COLORS.class_teacher
  const roleLabel = ROLE_LABELS[role] ?? role

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirmPass) { setError('Passwords do not match.'); return }

    setLoading(true)
    const formData = new FormData()
    formData.append('token', token)
    formData.append('phone', phone)
    formData.append('password', password)

    const result = await activatePortal(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
    // On success, server action redirects — no further handling needed
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className={`absolute inset-0 bg-gradient-to-b ${colors.glow} opacity-80 pointer-events-none`} />

      <div className="relative w-full max-w-sm space-y-6 z-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 relative mx-auto rounded-2xl overflow-hidden shadow-lg border border-border bg-card">
            <Image src="/logo.jpeg" alt="EduTrack" fill className="object-cover scale-[1.2]" />
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium">EduTrack</p>
            <h1 className="text-2xl font-bold text-foreground mt-1">Hello, {fullName.split(' ')[0]}!</h1>
            <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
              You&apos;ve been invited to{' '}
              <strong className="text-foreground">{schoolName}</strong> as a{' '}
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${colors.badge}`}>
                {roleLabel}
              </span>
            </p>
          </div>

          <div className="flex items-center justify-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">{schoolName}</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-card/80 backdrop-blur-xl rounded-2xl border border-border p-6 shadow-2xl">
          <h2 className="text-base font-semibold text-foreground mb-1">Activate your portal</h2>
          <p className="text-muted-foreground text-xs mb-5">
            Verify your phone number and set a password to access your {roleLabel} portal.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Phone */}
            <div className="space-y-1.5">
              <label htmlFor="inv-phone" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Your Phone Number <span className="text-red-400 normal-case font-normal">(required)</span>
              </label>
              <input
                id="inv-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0712 345 678"
                className="w-full bg-muted border border-border text-foreground placeholder-muted-foreground rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <p className="text-xs text-muted-foreground">Must match the number your principal registered for you.</p>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="inv-password" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Create Password</label>
              <div className="relative">
                <input
                  id="inv-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full bg-muted border border-border text-foreground placeholder-muted-foreground rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label htmlFor="inv-confirm" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Confirm Password</label>
              <div className="relative">
                <input
                  id="inv-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full bg-muted border border-border text-foreground placeholder-muted-foreground rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-950/50 border border-red-800/50 text-red-300 text-sm px-4 py-3 rounded-xl leading-snug">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full ${colors.btn} text-white font-semibold py-3 px-4 rounded-xl transition-all text-sm disabled:opacity-60 mt-2 shadow-lg flex items-center justify-center gap-2`}
            >
              {loading ? 'Activating…' : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Access {roleLabel} Portal →
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          This link is permanent — bookmark it to return to your portal anytime.
        </p>
      </div>
    </div>
  )
}
