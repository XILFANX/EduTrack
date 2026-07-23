import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/admin-sidebar'

export const metadata: Metadata = {
  title: 'EduTrack Admin',
  manifest: '/admin/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'EduTrack Admin',
  },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // In EduTrack, we redirect to admin/dashboard if user.email === PRODUCT_ADMINISTRATOR_EMAIL
  // Let's ensure only the product admin can access this layout
  if (user.email !== process.env.PRODUCT_ADMINISTRATOR_EMAIL) {
    // If not the root product admin, check if they are a regular school admin/user
    // and redirect them to the correct dashboard. For safety, just /dashboard
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row">
      {/* Desktop Sidebar (hidden on mobile for now, or you could add a drawer) */}
      <div className="hidden md:block w-64 shrink-0">
        <AdminSidebar />
      </div>

      {/* Mobile Top Header (only visible on small screens) */}
      <header className="md:hidden bg-slate-950 text-white p-4 flex items-center justify-between border-b border-slate-800">
        <div className="font-bold">EduTrack Admin</div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen max-w-full overflow-hidden">
        {/* Desktop Top Header (optional, for notifications) */}
        <header className="hidden md:flex h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 items-center justify-end px-8 shrink-0 sticky top-0 z-40">
           <div className="text-sm font-medium text-slate-500">Platform Administrator</div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
