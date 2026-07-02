'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Eye, EyeOff } from 'lucide-react'
import { activateInvite } from './actions'

interface Props {
  token: string
  inviteId: string
  role: string
  roleLabel: string
  schoolId: string
  schoolName: string
  className: string | null
  prefilledName: string
  registeredPhone: string | null
  isReturningUser: boolean
}

const ROLE_COLORS: Record<string, { badge: string; btn: string; glow: string }> = {
  class_teacher:    { badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',   btn: 'bg-violet-600 hover:bg-violet-700',   glow: 'from-violet-500/20 to-slate-900' },
  subject_teacher:  { badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',           btn: 'bg-blue-600 hover:bg-blue-700',       glow: 'from-blue-500/20 to-slate-900' },
  bursar:           { badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', btn: 'bg-emerald-600 hover:bg-emerald-700', glow: 'from-emerald-500/20 to-slate-900' },
  librarian:        { badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',       btn: 'bg-amber-500 hover:bg-amber-600',     glow: 'from-amber-500/20 to-slate-900' },
  storekeeper:      { badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',   btn: 'bg-orange-600 hover:bg-orange-700',   glow: 'from-orange-500/20 to-slate-900' },
  transport_matron: { badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',          btn: 'bg-slate-700 hover:bg-slate-800',     glow: 'from-slate-500/20 to-slate-900' },
  parent:           { badge: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',           btn: 'bg-pink-600 hover:bg-pink-700',       glow: 'from-pink-500/20 to-slate-900' },
}

export default function InviteClient({
  token, inviteId, role, roleLabel,
  schoolId, schoolName, className,
  prefilledName, registeredPhone, isReturningUser
}: Props) {
  const [viewState, setViewState] = useState<'register' | 'login' | 'otp'>(isReturningUser ? 'login' : 'register')

  const [name, setName]               = useState(prefilledName)
  const [phone, setPhone]             = useState(registeredPhone ?? '')
  const [password, setPassword]       = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [otp, setOtp]                 = useState('')

  const [showPassword, setShowPassword]               = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError]                             = useState<string | null>(null)
  const [successMsg, setSuccessMsg]                   = useState<string | null>(null)
  const [loading, setLoading]                         = useState(false)

  const colors = ROLE_COLORS[role] ?? ROLE_COLORS.class_teacher

  async function handleSendOtp() {
    if (!registeredPhone) {
      setError('No phone number on record to send OTP.')
      return
    }
    setLoading(true)
    setError(null)
    const formData = new FormData()
    formData.append('actionType', 'send_otp')
    formData.append('inviteId', inviteId)
    formData.append('token', token)

    const result = await activateInvite(formData)
    setLoading(false)
    if (result?.error) {
      setError(result.error)
    } else {
      setViewState('otp')
      setSuccessMsg('An OTP has been sent to your registered phone number.')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)

    if (viewState === 'register' || viewState === 'otp') {
      if (password.length < 8) {
        setError('Password must be at least 8 characters.')
        return
      }
      if (password !== confirmPass) {
        setError('Passwords do not match.')
        return
      }
    }

    if (viewState === 'otp' && otp.length !== 6) {
      setError('Please enter the 6-digit OTP.')
      return
    }

    setLoading(true)

    const formData = new FormData()
    formData.append('actionType', viewState)
    formData.append('token', token)
    formData.append('inviteId', inviteId)
    formData.append('role', role)
    formData.append('schoolId', schoolId)
    formData.append('name', name)
    formData.append('phone', phone)
    formData.append('password', password)
    if (viewState === 'otp') {
      formData.append('otp', otp)
    }

    const result = await activateInvite(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
    // On success the server action redirects — no further handling needed
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className={`absolute inset-0 bg-gradient-to-b ${colors.glow} opacity-60 pointer-events-none`} />

      <div className="relative w-full max-w-md space-y-6 z-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 relative mx-auto rounded-2xl overflow-hidden shadow-lg border border-border bg-card">
            <Image src="/logo.jpeg" alt="EduTrack" fill className="object-cover scale-[1.2]" />
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium">EduTrack</p>
            <h1 className="text-2xl font-bold text-foreground mt-1">
              {viewState === 'login' ? `Welcome back, ${name.split(' ')[0]}!` : `Hello ${name || 'there'}!`}
            </h1>
            {viewState === 'register' && (
              <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                You&apos;ve been invited to{' '}
                <strong className="text-foreground">{schoolName}</strong>
                {' '}as a{' '}
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${colors.badge}`}>
                  {roleLabel.toLowerCase()}
                </span>
                {className && (
                  <>{' '}for <strong className="text-foreground">{className}</strong></>
                )}
                .
              </p>
            )}
          </div>

          {/* School & class pills */}
          <div className="flex items-center justify-center flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 bg-muted border border-border text-foreground text-xs font-medium px-3 py-1.5 rounded-full">
              🏫 {schoolName}
            </span>
            {className && (
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${colors.badge}`}>
                📚 {className}
              </span>
            )}
          </div>
        </div>

        {/* Card */}
        <div className="bg-card/80 backdrop-blur-xl rounded-2xl border border-border p-6 shadow-2xl">
          <h2 className="text-base font-semibold text-foreground mb-1">
            {viewState === 'register' && 'Create your account'}
            {viewState === 'login' && 'Log in to your portal'}
            {viewState === 'otp' && 'Reset your password'}
          </h2>
          <p className="text-muted-foreground text-xs mb-5">
            {viewState === 'register' && `Set a password to access your ${roleLabel.toLowerCase()} portal.`}
            {viewState === 'login' && `Enter your password to access your ${roleLabel.toLowerCase()} portal.`}
            {viewState === 'otp' && 'Enter the 6-digit OTP sent to your phone.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* OTP field */}
            {viewState === 'otp' && (
              <div className="space-y-1.5">
                <label htmlFor="inv-otp" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">6-Digit OTP</label>
                <input
                  id="inv-otp" required value={otp} onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="w-full bg-muted border border-border text-foreground placeholder-muted-foreground rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            )}

            {/* Full Name & Phone (not shown on otp) */}
            {viewState !== 'otp' && (
              <>
                <div className="space-y-1.5">
                  <label htmlFor="inv-name" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Full Name</label>
                  <input
                    id="inv-name" required value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    readOnly={viewState === 'login'}
                    className={`w-full bg-muted border border-border text-foreground placeholder-muted-foreground rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${viewState === 'login' ? 'opacity-70 cursor-not-allowed' : ''}`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="inv-phone" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Phone Number{' '}
                    {registeredPhone
                      ? <span className="text-red-400 normal-case font-normal">(required)</span>
                      : <span className="text-muted-foreground normal-case font-normal">(optional)</span>
                    }
                  </label>
                  <input
                    id="inv-phone" type="tel" required={!!registeredPhone} value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="0712 345 678"
                    readOnly={viewState === 'login'}
                    className={`w-full bg-muted border border-border text-foreground placeholder-muted-foreground rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${viewState === 'login' ? 'opacity-70 cursor-not-allowed' : ''}`}
                  />
                </div>
              </>
            )}

            {/* Password */}
            <div className="space-y-1.5 relative">
              <label htmlFor="inv-password" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {viewState === 'otp' ? 'New Password' : 'Password'}
              </label>
              <div className="relative">
                <input
                  id="inv-password" type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder={viewState === 'login' ? 'Enter your password' : 'At least 8 characters'}
                  className="w-full bg-muted border border-border text-foreground placeholder-muted-foreground rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (hidden on login) */}
            {viewState !== 'login' && (
              <div className="space-y-1.5 relative">
                <label htmlFor="inv-confirm" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Confirm Password</label>
                <div className="relative">
                  <input
                    id="inv-confirm" type={showConfirmPassword ? 'text' : 'password'} required value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="Repeat your password"
                    className="w-full bg-muted border border-border text-foreground placeholder-muted-foreground rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-950/50 border border-red-800/50 text-red-300 text-sm px-4 py-3 rounded-xl leading-snug">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-950/50 border border-emerald-800/50 text-emerald-300 text-sm px-4 py-3 rounded-xl leading-snug">
                {successMsg}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className={`w-full ${colors.btn} text-white font-semibold py-3 px-4 rounded-xl transition-all text-sm disabled:opacity-60 mt-2 shadow-lg`}
            >
              {loading
                ? 'Please wait…'
                : viewState === 'login'
                  ? `Access ${roleLabel} Portal →`
                  : viewState === 'otp'
                    ? 'Reset Password & Log In →'
                    : 'Create Account →'
              }
            </button>
          </form>

          {viewState === 'login' && (
            <div className="mt-4 text-center">
              <button onClick={handleSendOtp} disabled={loading} className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors">
                Forgot Password?
              </button>
            </div>
          )}

          {viewState === 'otp' && (
            <div className="mt-4 text-center">
              <button onClick={() => { setViewState('login'); setError(null); setSuccessMsg(null) }} disabled={loading} className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors">
                Back to Login
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          This is a permanent link. Bookmark it to return to your portal anytime.
        </p>
      </div>
    </div>
  )
}
