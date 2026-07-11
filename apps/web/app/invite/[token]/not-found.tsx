import Link from 'next/link'
import Image from 'next/image'

export default function InviteNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="w-16 h-16 relative mx-auto rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 bg-white">
          <Image src="/logo.png" alt="EduTrack" fill className="object-cover" />
        </div>
        <div className="space-y-3">
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            EduTrack — School Management System
          </p>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Invite Not Found</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
            This invite link is invalid or has been removed. Please ask your school administrator or class teacher to share a new invite link with you.
          </p>
        </div>
        <Link
          href="/"
          className="inline-block px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors"
        >
          Go to EduTrack
        </Link>
      </div>
    </div>
  )
}