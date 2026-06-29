import Link from 'next/link'
import Image from 'next/image'

export default function InviteNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="w-16 h-16 relative mx-auto rounded-full overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 bg-white">
          <Image src="/logo.jpeg" alt="EstateTrack" fill className="object-cover scale-[1.2]" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Invite Not Found</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
            This invite link is invalid or has been removed. Please ask your property manager to share a new link.
          </p>
        </div>
        <Link
          href="/"
          className="inline-block px-6 py-2.5 rounded-full bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm transition-colors"
        >
          Go to EstateTrack
        </Link>
      </div>
    </div>
  )
}
