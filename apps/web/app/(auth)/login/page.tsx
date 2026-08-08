'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState('')
  const [inviteError, setInviteError] = useState<string | null>(null)

  function handleInviteRedirect(e: React.FormEvent) {
    e.preventDefault()
    setInviteError(null)
    const raw = inviteLink.trim()
    const tokenMatch = raw.match(/invite\/([\w-]{36})/)
    const uuidMatch = raw.match(/^([\w-]{36})$/)
    const token = tokenMatch?.[1] ?? uuidMatch?.[1]
    if (!token) {
      setInviteError('Paste your full invite link or just the token at the end of the URL.')
      return
    }
    router.push(`/invite/${token}`)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError(
        signInError.message === 'Invalid login credentials'
          ? 'Invalid email or password. Please try again or reset your password.'
          : signInError.message
      )
      setLoading(false)
      return
    }
    router.push('/')
    router.refresh()
  }

  async function handleGoogleLogin() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    /* ── Dark navy gradient background ── */
    <div className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: 'linear-gradient(135deg, #060E1C 0%, #0A1628 50%, #0F2040 100%)' }}
    >
      {/* Radial glow orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/4 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(29,111,235,0.12) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/4 w-64 h-64 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)' }} />
      </div>

      <div className="relative w-full max-w-sm space-y-5 z-10">

        {/* ── Logo & heading ── */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 relative mx-auto rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            style={{ boxShadow: '0 0 40px rgba(29,111,235,0.3)' }}>
            <Image src="/logo.png" alt="EduTrack Logo" fill className="object-cover" />
          </div>
          <div>
            <p className="font-extrabold text-2xl tracking-tight"
              style={{ background: 'linear-gradient(135deg, #1D6FEB, #22D3EE)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              EduTrack
            </p>
            <h1 className="text-xl font-bold text-white mt-1">Welcome back</h1>
            <p className="text-sm text-slate-400 mt-0.5">Sign in to your portal</p>
          </div>
        </div>

        {/* ── Login card (glassmorphism) ── */}
        <div className="rounded-2xl p-6 space-y-4 border border-white/10 backdrop-blur-xl"
          style={{ background: 'rgba(15, 32, 64, 0.6)' }}>

          {/* Light mode override */}
          <style>{`
            @media (prefers-color-scheme: light) {
              .login-bg { background: rgba(255,255,255,0.95) !important; border-color: rgba(29,111,235,0.15) !important; }
              .login-input { background: #f8fafc; border-color: #e2e8f0; color: #0f172a; }
              .login-input:focus { border-color: #1D6FEB; }
              .login-label { color: #334155; }
            }
          `}</style>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="text-sm font-medium text-slate-300">Email</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.ac.ke"
                className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 border border-white/10 focus:outline-none focus:border-[#1D6FEB] focus:ring-1 focus:ring-[#1D6FEB] transition-all"
                style={{ background: 'rgba(6, 14, 28, 0.6)' }}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="login-password" className="text-sm font-medium text-slate-300">Password</label>
                <Link href="/forgot-password" className="text-xs font-medium transition-colors" style={{ color: '#22D3EE' }}>
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 border border-white/10 focus:outline-none focus:border-[#1D6FEB] focus:ring-1 focus:ring-[#1D6FEB] transition-all pr-10"
                  style={{ background: 'rgba(6, 14, 28, 0.6)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-orange-400 bg-orange-950/40 border border-orange-800/50 px-3 py-2 rounded-xl leading-snug">
                {error}
              </p>
            )}

            {/* Primary gradient button */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full text-white font-semibold py-3 px-4 rounded-xl transition-all text-sm disabled:opacity-60 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #1D6FEB 0%, #22D3EE 100%)',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(29,111,235,0.4)',
              }}
            >
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/8" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs text-slate-500" style={{ background: 'rgba(15,32,64,0.8)' }}>or</span>
            </div>
          </div>

          <button
            id="login-google"
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2 border border-white/10 text-slate-300 hover:text-white hover:border-white/20 rounded-xl px-4 py-2.5 text-sm transition-all"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <p className="text-center text-sm text-slate-500">
          No account?{' '}
          <Link href="/signup" className="font-semibold transition-colors hover:opacity-80" style={{ color: '#22D3EE' }}>
            Register your school
          </Link>
        </p>

        {/* ── Invite Link Shortcut ── */}
        <div className="rounded-2xl p-5 space-y-3 border border-white/8 backdrop-blur-xl"
          style={{ background: 'rgba(15, 32, 64, 0.5)' }}>
          <div className="flex items-center gap-2">
            <span className="text-lg">🔑</span>
            <div>
              <p className="text-sm font-semibold text-white">Teacher, Bursar or Parent?</p>
              <p className="text-xs text-slate-400">Paste your invite link to access your portal</p>
            </div>
          </div>
          <form onSubmit={handleInviteRedirect} className="flex gap-2">
            <input
              id="invite-link-input"
              type="text"
              value={inviteLink}
              onChange={(e) => setInviteLink(e.target.value)}
              placeholder="https://…/invite/your-token"
              className="flex-1 min-w-0 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 border border-white/10 focus:outline-none focus:border-[#1D6FEB] focus:ring-1 focus:ring-[#1D6FEB] transition-all"
              style={{ background: 'rgba(6, 14, 28, 0.6)' }}
            />
            <button
              id="invite-link-submit"
              type="submit"
              className="shrink-0 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #1D6FEB 0%, #22D3EE 100%)' }}
            >
              Go →
            </button>
          </form>
          {inviteError && <p className="text-xs text-orange-400">{inviteError}</p>}
        </div>

      </div>
    </div>
  )
}
