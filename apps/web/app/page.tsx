import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { 
  GraduationCap, BookOpen, Users, Receipt, Megaphone, 
  ArrowRight, Activity, Settings, HelpCircle, Globe
} from 'lucide-react'
import { ModeToggleLanding } from '@/components/shared/mode-toggle-landing'

// ─── Theme tokens (blue / cyan — EduTrack only) ─────────────────────────────
const T = {
  accent:       'text-blue-600 dark:text-blue-400',
  accentHover:  'hover:text-blue-600 dark:hover:text-blue-400',
  bg:           'bg-blue-600 hover:bg-blue-700',
  bgLight:      'bg-blue-50 dark:bg-blue-500/10',
  border:       'border-blue-200 dark:border-blue-500/20',
  grad:         'from-blue-600 to-cyan-400',
  selBg:        'bg-blue-50 dark:bg-blue-900/30',
  selText:      'text-blue-700 dark:text-blue-400',
  selBorder:    'border-blue-200 dark:border-blue-800/50',
}

// ─── Compact Feature Row ──────────────────────────────────────────────────────
function FeatureRow({ icon: Icon, title, description }: {
  icon: React.ElementType; title: string; description: string
}) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800/50 hover:shadow-sm transition-all group">
      <div className={`shrink-0 w-9 h-9 rounded-lg ${T.bgLight} flex items-center justify-center ${T.accent}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-0.5">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

// ─── Portal Card ──────────────────────────────────────────────────────────────
function PortalCard({ emoji, role, tagline, color, bg, textAccent, benefits, cta, href, ctaStyle, secondary }: {
  emoji: string; role: string; tagline: string; color: string; bg: string;
  textAccent: string; benefits: string[]; cta: string; href: string;
  ctaStyle: string; secondary?: { label: string; href: string } | null
}) {
  return (
    <div className={`rounded-2xl border p-5 flex flex-col gap-4 transition-all hover:shadow-md hover:-translate-y-0.5 ${bg}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-lg shadow-sm shrink-0`}>
          {emoji}
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{role}</h3>
          <p className={`text-xs font-medium ${textAccent}`}>{tagline}</p>
        </div>
      </div>
      <ul className="space-y-1.5 flex-1">
        {benefits.map((b) => (
          <li key={b} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span className={`mt-0.5 shrink-0 font-bold ${textAccent}`}>✓</span>
            {b}
          </li>
        ))}
      </ul>
      <div className="space-y-1.5">
        <a href={href} className={`w-full flex items-center justify-center text-xs font-semibold px-3 py-2 rounded-lg transition-all active:scale-95 ${ctaStyle}`}>
          {cta} →
        </a>
        {secondary && (
          <a href={secondary.href} className={`w-full flex items-center justify-center text-xs font-medium text-slate-500 dark:text-slate-400 ${T.accentHover} transition-colors`}>
            {secondary.label}
          </a>
        )}
      </div>
    </div>
  )
}

// ─── NavBar ───────────────────────────────────────────────────────────────────
function NavBar() {
  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Who we serve', href: '#portals' },
    { label: 'Contact', href: '/contact' },
    { label: 'Docs', href: '/help' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 relative rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-white shadow-sm shrink-0">
              <Image src="/logo.png" alt="EduTrack" fill className="object-cover" />
            </div>
            <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">EduTrack</span>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((l) => (
              <a key={l.label} href={l.href} className={`text-sm font-medium text-slate-600 dark:text-slate-300 ${T.accentHover} transition-colors`}>{l.label}</a>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <ModeToggleLanding />
            <Link href="/login" className={`text-sm font-medium text-slate-600 dark:text-slate-300 ${T.accentHover} transition-colors hidden sm:block`}>Log in</Link>
            <Link href="/signup" className={`text-sm font-semibold px-4 py-1.5 rounded-full ${T.bg} text-white transition-all shadow-sm hover:shadow-md active:scale-95`}>
              Get Started
            </Link>
          </div>
        </div>

        {/* Mobile nav — always visible below the header row on small screens */}
        <div className="md:hidden flex overflow-x-auto no-scrollbar gap-4 pb-2 pt-0.5">
          {navLinks.map((l) => (
            <a key={l.label} href={l.href} className={`text-xs font-medium whitespace-nowrap text-slate-500 dark:text-slate-400 ${T.accentHover} transition-colors shrink-0`}>{l.label}</a>
          ))}
        </div>
      </div>
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section id="hero" className="relative pt-20 md:pt-24 pb-12 md:pb-20 overflow-hidden">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 dark:bg-blue-500/5 blur-3xl rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${T.bgLight} ${T.accent} text-xs font-semibold mb-5 border ${T.border}`}>
          <GraduationCap className="w-3 h-3" />
          <span>The Modern Education System</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4 max-w-3xl leading-tight">
          School Management &amp;{' '}
          <span className={`text-transparent bg-clip-text bg-gradient-to-r ${T.grad}`}>
            Seamless Administration.
          </span>
        </h1>

        <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto mb-8 leading-relaxed">
          The all-in-one platform for principals, teachers, and parents. Automate fee collection via M-Pesa, track attendance, manage grades, and connect the entire school.
        </p>

        {/* Role CTAs — all three always visible, wrap on small screens */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/signup" className="px-5 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-sm transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2">
            Start your school <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link href="/login" className="px-5 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-white font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95">
            I am a Teacher
          </Link>
          <Link href="/login" className="px-5 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-white font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95">
            I am a Parent
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────────
function FeaturesSection() {
  const features = [
    { icon: Receipt, title: 'Automated Fee Engine', description: 'Trigger M-Pesa STK pushes. Generate invoices, track arrears, and automate reconciliations for the Bursar.' },
    { icon: BookOpen, title: 'Academics & Grades', description: 'Spreadsheet-style gradebook for teachers. Track termly exams, continuous assessments, and generate reports.' },
    { icon: Users, title: 'Attendance Tracking', description: 'Lightning-fast daily registers. Teachers can mark attendance in seconds, parents are instantly in the loop.' },
    { icon: Megaphone, title: 'Unified Communications', description: 'Secure direct messaging between parents and teachers, plus global announcements from the Principal.' },
    { icon: Activity, title: 'Transport & Store', description: 'Dedicated portals for operational staff. Manage bus routes, fleet tracking, and live inventory ledgers.' },
    { icon: Settings, title: 'Role-Based Portals', description: 'Six customized, secure portals ensuring everyone from the Principal to the Parent sees exactly what they need.' },
  ]

  return (
    <section id="features" className="py-14 bg-slate-50 dark:bg-slate-950/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-3">Everything you need to run your school</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            EduTrack replaces a dozen disjointed tools with one elegant platform.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {features.map((f, i) => <FeatureRow key={i} {...f} />)}
        </div>
      </div>
    </section>
  )
}

// ─── Portals ──────────────────────────────────────────────────────────────────
function PortalSection() {
  const portals = [
    {
      emoji: '🏛️', role: 'Principal / Admin', tagline: 'I manage the entire school',
      color: 'from-blue-600 to-cyan-500',
      bg: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800/50',
      textAccent: 'text-blue-700 dark:text-blue-400',
      benefits: ['Global overview of operations', 'Staff and class management', 'Send school-wide announcements'],
      cta: 'Create free account', href: '/signup', ctaStyle: 'bg-blue-600 hover:bg-blue-700 text-white', secondary: null,
    },
    {
      emoji: '👨‍🏫', role: 'Teachers & Staff', tagline: 'I educate and operate',
      color: 'from-indigo-600 to-blue-500',
      bg: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-800/50',
      textAccent: 'text-indigo-700 dark:text-indigo-400',
      benefits: ['Take lightning-fast attendance', 'Enter exam grades effortlessly', 'Communicate safely with parents'],
      cta: 'Use invite link', href: '/login', ctaStyle: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      secondary: { label: 'Learn how invites work', href: '/help' },
    },
    {
      emoji: '👨‍👩‍👧', role: 'Parents', tagline: 'I have children enrolled',
      color: 'from-sky-500 to-cyan-500',
      bg: 'bg-sky-50 border-sky-200 dark:bg-sky-950/30 dark:border-sky-800/50',
      textAccent: 'text-sky-700 dark:text-sky-400',
      benefits: ['Pay fees securely via M-Pesa', 'Track academic performance', 'Receive direct updates from teachers'],
      cta: 'Sign in to your portal', href: '/login', ctaStyle: 'bg-sky-600 hover:bg-sky-700 text-white',
      secondary: { label: 'Contact your school for access', href: '/help' },
    },
  ]

  return (
    <section id="portals" className="py-14 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${T.bgLight} ${T.accent} text-xs font-medium mb-4 border ${T.border}`}>
            Choose your portal
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-3">Who are you?</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            EduTrack is built for every person involved in education — each with their own tailored, secure portal.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {portals.map((p) => <PortalCard key={p.role} {...p} />)}
        </div>
      </div>
    </section>
  )
}

// ─── Docs CTA ─────────────────────────────────────────────────────────────────
function DocsSection() {
  return (
    <section className="py-14 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className={`shrink-0 w-10 h-10 rounded-xl ${T.bgLight} ${T.accent} flex items-center justify-center`}>
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">Need help getting started?</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
                Read our comprehensive guides on setting up your school, managing fee structures, and inviting parents.
              </p>
            </div>
          </div>
          <div className="flex flex-row sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
            <Link href="/help/00-getting-started" className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg ${T.bg} text-white font-medium text-sm transition-all shadow-sm active:scale-95`}>
              Getting Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link href="/help" className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95">
              All Docs
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-slate-50 dark:bg-slate-950 py-12 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 relative rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-white">
                <Image src="/logo.png" alt="EduTrack" fill className="object-cover" />
              </div>
              <span className="font-bold text-base text-slate-900 dark:text-white">EduTrack</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed max-w-xs">
              The modern operating system for education. Simple, powerful, and beautifully designed.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-3 text-sm">Product</h4>
            <ul className="space-y-2">
              {[['Features', '#features'], ['Who we serve', '#portals'], ['Parent Portal', '/parent/dashboard']].map(([l, h]) => (
                <li key={l}><a href={h} className={`text-xs text-slate-500 dark:text-slate-400 ${T.accentHover} transition-colors`}>{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-3 text-sm">Resources</h4>
            <ul className="space-y-2">
              {[['Help Center', '/help'], ['API Docs', '/api-docs'], ['Blog', '/blog'], ['FAQs', '/faq']].map(([l, h]) => (
                <li key={l}><Link href={h} className={`text-xs text-slate-500 dark:text-slate-400 ${T.accentHover} transition-colors`}>{l}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-3 text-sm">Company</h4>
            <ul className="space-y-2">
              {[['About Us', '/about'], ['Contact', '/contact'], ['Careers', '/careers']].map(([l, h]) => (
                <li key={l}><Link href={h} className={`text-xs text-slate-500 dark:text-slate-400 ${T.accentHover} transition-colors`}>{l}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-slate-400 dark:text-slate-500 text-xs">&copy; {new Date().getFullYear()} EduTrack Inc. All rights reserved.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {[['Terms', '/terms'], ['Privacy', '/privacy'], ['Security', '/security'], ['Cookies', '/cookies']].map(([l, h]) => (
              <Link key={l} href={h} className={`text-xs text-slate-400 dark:text-slate-500 ${T.accentHover} transition-colors`}>{l}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── Root Page ────────────────────────────────────────────────────────────────
export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    if (user.email === process.env.PRODUCT_ADMINISTRATOR_EMAIL) {
      redirect('/admin/dashboard')
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      redirect('/onboarding')
    }

    switch (profile.role) {
      case 'admin': redirect('/admin/dashboard')
      case 'principal':
        if (!profile.school_id) redirect('/onboarding')
        redirect('/dashboard')
      case 'class_teacher':
      case 'subject_teacher': redirect('/teacher/dashboard')
      case 'bursar': redirect('/bursar/dashboard')
      case 'librarian': redirect('/library/dashboard')
      case 'storekeeper': redirect('/store/dashboard')
      case 'transport_matron': redirect('/transport/dashboard')
      case 'parent': redirect('/parent/dashboard')
      default: redirect('/onboarding')
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 selection:bg-blue-200 dark:selection:bg-blue-900">
      <NavBar />
      <main className="pt-14">
        <HeroSection />
        <FeaturesSection />
        <PortalSection />
        <DocsSection />
      </main>
      <Footer />
    </div>
  )
}
