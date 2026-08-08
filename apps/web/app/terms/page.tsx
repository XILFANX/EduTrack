import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service | EduTrack',
  description: 'Read the EduTrack Terms of Service. These terms govern your use of our school management SaaS platform, billing via Pesapal (Kenya) and Paddle (International), and your data rights.',
  keywords: ['EduTrack terms', 'school management SaaS terms', 'software terms of service', 'Paddle billing terms', 'Pesapal payment terms'],
  openGraph: {
    title: 'Terms of Service | EduTrack',
    description: 'Legal agreement governing your use of the EduTrack school management platform, including payment processing, data handling, and account responsibilities.',
    url: 'https://estatetrack.co.ke/terms',
    siteName: 'EduTrack',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'EduTrack Terms of Service',
    description: 'Legal agreement for using the EduTrack school management platform.',
  },
}

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060d1a] flex flex-col items-center justify-center p-4 selection:bg-cyan-200 dark:selection:bg-cyan-900">
      <div className="w-full max-w-2xl bg-white dark:bg-[#060d1a] border border-slate-200 dark:border-[#1a2744] rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8 md:p-12 text-center space-y-6">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Terms of Service</h1>
          <p className="text-lg text-slate-500 dark:text-slate-400">
            Legal agreements and terms for using EduTrack.
          </p>
          
          

          <div className="pt-8 mt-8 border-t border-slate-100 dark:border-[#1a2744]">
            <Link 
              href="/" 
              className="inline-flex items-center justify-center text-sm font-medium text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
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
