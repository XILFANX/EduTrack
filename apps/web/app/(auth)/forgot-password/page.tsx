import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-[#060d1a] p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#060d1a] border border-slate-200 dark:border-[#1a2744] rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 md:p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Reset Password
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Enter your email and we'll send you a reset link.
            </p>
          </div>

          <form className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="w-full px-3 py-2 border border-slate-300 dark:border-[#1a2744] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#060d1a] text-slate-900 dark:text-slate-100"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 dark:bg-blue-700 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              Send Reset Link
            </button>
          </form>

          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
