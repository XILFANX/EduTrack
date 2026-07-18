import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TeacherNav } from '@/components/teacher/teacher-nav'
import { LogOut } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profileResult } = await supabase
    .from('users')
    .select('full_name, role, school_id')
    .eq('id', user.id)
    .single()

  const profile = profileResult as any

  if (profile?.role !== 'class_teacher' && profile?.role !== 'subject_teacher') redirect('/login')

  // Fetch school branding
  const { data: schoolResult } = await supabase
    .from('schools')
    .select('name, logo_url')
    .eq('id', profile.school_id)
    .single()
  const school = schoolResult as any

  // Fetch a descriptive role context label
  let roleLabel = 'Teacher Portal'
  if (profile.role === 'class_teacher') {
    const { data: cls } = await supabase
      .from('classes')
      .select('name')
      .eq('class_teacher_id', user.id)
      .eq('school_id', profile.school_id)
      .single()
    if (cls) roleLabel = `Class Teacher · ${(cls as any).name}`
  } else {
    const { data: assignments } = await supabase
      .from('class_subjects')
      .select('subjects(name)')
      .eq('teacher_id', user.id)
      .eq('school_id', profile.school_id)
      .limit(1)
    const firstSubject = (assignments as any)?.[0]?.subjects?.name
    if (firstSubject) roleLabel = `Subject Teacher · ${firstSubject}`
    else roleLabel = 'Subject Teacher'
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* School branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
              {school?.logo_url ? (
                <img src={school.logo_url} alt={school.name} className="w-full h-full object-cover" />
              ) : (
                <Image src="/logo.png" alt="EduTrack" width={32} height={32} className="object-cover" />
              )}
            </div>
            <div>
              <p className="font-bold text-sm text-foreground leading-tight">{school?.name || 'School Portal'}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">{roleLabel}</p>
            </div>
          </div>
          
          <form action="/api/auth/signout" method="post">
            <button className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-4 pt-6">
        {children}
      </main>

      <TeacherNav role={profile.role} />
    </div>
  )
}
