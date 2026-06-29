import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Contact Us | EstateTrack',
  description: 'Get in touch with the EstateTrack team for support, partnership inquiries, or general questions. Email us at estatetrack@gmail.com.',
  keywords: ['contact EstateTrack', 'EstateTrack support', 'property management support', 'estatetrack@gmail.com'],
  openGraph: {
    title: 'Contact EstateTrack',
    description: 'Reach out to our team for support, enterprise inquiries, or partnership opportunities. We are here to help.',
    url: 'https://estatetrack.co.ke/contact',
    siteName: 'EstateTrack',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Contact EstateTrack',
    description: 'Questions or support? Contact the EstateTrack team at estatetrack@gmail.com.',
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
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Contact Us</h1>
          <p className="text-lg text-slate-500 dark:text-slate-400">
            Have questions? Email us at estatetrack@gmail.com
          </p>
          
          
          <div className="pt-6 pb-2">
            <a href="mailto:estatetrack@gmail.com" className="inline-block bg-violet-600 hover:bg-violet-700 text-white font-medium px-8 py-3 rounded-full transition-transform active:scale-95 shadow-md">
              Email estatetrack@gmail.com
            </a>
          </div>
          

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
