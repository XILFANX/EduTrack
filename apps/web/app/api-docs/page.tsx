import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'API Documentation | EstateTrack',
  description: 'The EstateTrack Developer API is coming in Q3 2026. Integrate property portfolios, automate tenant workflows, and receive real-time payment webhooks via our RESTful API.',
  keywords: ['EstateTrack API', 'proptech developer API', 'property management REST API', 'rent webhook', 'coming soon API'],
  openGraph: {
    title: 'Developer API (Coming Q3 2026) | EstateTrack',
    description: 'EstateTrack is building a powerful REST API for developers to integrate property management data, automate workflows, and stream payment events.',
    url: 'https://estatetrack.co.ke/api-docs',
    siteName: 'EstateTrack',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'EstateTrack Developer API — Coming Q3 2026',
    description: 'A RESTful API for integrating property management workflows, tenants, and payments into your own systems.',
  },
}

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-violet-200 dark:selection:bg-violet-900">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8 md:p-12 text-center space-y-6">
          <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">API Documentation</h1>
          <p className="text-lg text-slate-500 dark:text-slate-400">
            Integrate your workflows with the EstateTrack API. Coming soon.
          </p>
          
          

          <div className="pt-8 mt-8 border-t border-slate-100 dark:border-slate-800">
            <Link 
              href="/" 
              className="inline-flex items-center justify-center text-sm font-medium text-slate-500 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
