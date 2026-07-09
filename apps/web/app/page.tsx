import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { GraduationCap, BookOpen, Users, Receipt, Megaphone, ArrowRight, Activity, Settings } from 'lucide-react'
import { ModeToggleLanding } from '@/components/shared/mode-toggle-landing'

// --- Landing Page Components ---

function NavBar() {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 relative rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-white shadow-sm">
              <Image src="/logo.png" alt="EduTrack" fill className="object-cover" />
            </div>
            <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">EduTrack</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-500 transition-colors">Features</a>
            <a href="#portals" className="text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-500 transition-colors">Who we serve</a>
            <Link href="/contact" className="text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-500 transition-colors">Contact</Link>
          </div>
          <div className="flex items-center gap-3">
            <ModeToggleLanding />
            <Link href="/login" className="hidden sm:inline-block text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-500 transition-colors ml-2">Log in</Link>
            <Link href="/signup" className="text-sm font-medium px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md hover:shadow-lg active:scale-95 duration-200">
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

function HeroSection() {
  return (
    <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
      {/* Decorative background blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 dark:bg-blue-500/5 blur-3xl rounded-full -z-10" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-6 border border-blue-200 dark:border-blue-500/20">
          <GraduationCap className="w-3.5 h-3.5" />
          <span>The Modern Education System</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4 max-w-4xl leading-tight">
          School Management<br />
          &amp;<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-400">
            Seamless Administration.
          </span>
        </h1>
        <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed">
          The all-in-one platform for principals, teachers, and parents. Automate fee collection via M-Pesa, track attendance, manage grades, and connect the entire school.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/signup" className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium text-sm transition-all shadow-md hover:shadow-lg active:scale-95 duration-200 flex items-center justify-center gap-2">
            Start your school <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/login" className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm transition-all active:scale-95 duration-200 text-center">
            I am a Teacher
          </Link>
          <Link href="/login" className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm transition-all active:scale-95 duration-200 text-center">
            I am a Parent
          </Link>
        </div>
      </div>
    </section>
  )
}

function FeatureCard({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
    </div>
  )
}

function FeaturesSection() {
  const features = [
    {
      icon: Receipt,
      title: 'Automated Fee Engine',
      description: 'Trigger M-Pesa STK pushes directly to parents. Generate invoices, track arrears, and automate reconciliations for the Bursar.'
    },
    {
      icon: BookOpen,
      title: 'Academics & Grades',
      description: 'A beautiful spreadsheet-style gradebook for teachers. Track termly exams, continuous assessments, and generate reports.'
    },
    {
      icon: Users,
      title: 'Attendance Tracking',
      description: 'Lightning-fast daily registers. Teachers can mark attendance in seconds, and parents are instantly in the loop.'
    },
    {
      icon: Megaphone,
      title: 'Unified Communications',
      description: 'Ditch WhatsApp groups. Secure direct messaging between parents and teachers, plus global announcements from the Principal.'
    },
    {
      icon: Activity,
      title: 'Transport & Store',
      description: 'Dedicated portals for operational staff. Manage bus routes, fleet tracking, and live inventory ledgers.'
    },
    {
      icon: Settings,
      title: 'Role-Based Portals',
      description: 'Six customized, secure portals ensuring everyone from the Principal to the Parent sees exactly what they need.'
    }
  ]

  return (
    <section id="features" className="py-16 bg-slate-50 dark:bg-slate-950/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4">Everything you need to run your school</h2>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400">
            EduTrack replaces a dozen disjointed tools with one elegant platform designed specifically for modern education.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <FeatureCard key={i} {...f} />
          ))}
        </div>
      </div>
    </section>
  )
}

function PortalSection() {
  const portals = [
    {
      emoji: '🏛️',
      role: 'Principal / Admin',
      tagline: 'I manage the entire school',
      color: 'from-blue-600 to-cyan-500',
      bgLight: 'bg-blue-50 border-blue-200',
      bgDark: 'dark:bg-blue-950/30 dark:border-blue-800/50',
      textAccent: 'text-blue-700 dark:text-blue-400',
      benefits: [
        'Global overview of operations',
        'Staff and class management',
        'Send school-wide announcements',
      ],
      cta: 'Create free account',
      href: '/signup',
      ctaStyle: 'bg-blue-600 hover:bg-blue-700 text-white',
      secondary: null,
    },
    {
      emoji: '👨‍🏫',
      role: 'Teachers & Staff',
      tagline: 'I educate and operate',
      color: 'from-indigo-600 to-blue-500',
      bgLight: 'bg-indigo-50 border-indigo-200',
      bgDark: 'dark:bg-indigo-950/30 dark:border-indigo-800/50',
      textAccent: 'text-indigo-700 dark:text-indigo-400',
      benefits: [
        'Take lightning-fast attendance',
        'Enter exam grades effortlessly',
        'Communicate safely with parents',
      ],
      cta: 'Use invite link',
      href: '/login',
      ctaStyle: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      secondary: { label: 'Learn how invites work', href: '/help' },
    },
    {
      emoji: '👨‍👩‍👧',
      role: 'Parents',
      tagline: 'I have children enrolled',
      color: 'from-sky-500 to-cyan-500',
      bgLight: 'bg-sky-50 border-sky-200',
      bgDark: 'dark:bg-sky-950/30 dark:border-sky-800/50',
      textAccent: 'text-sky-700 dark:text-sky-400',
      benefits: [
        'Pay fees securely via M-Pesa',
        'Track academic performance',
        'Receive direct updates from teachers',
      ],
      cta: 'Sign in to your portal',
      href: '/login',
      ctaStyle: 'bg-sky-600 hover:bg-sky-700 text-white',
      secondary: { label: 'Contact your school for access', href: '/help' },
    },
  ]

  return (
    <section id="portals" className="py-20 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium mb-6 border border-blue-200 dark:border-blue-500/20">
            Choose your portal
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Who are you?</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            EduTrack is built for every person involved in education — each with their own tailored, secure portal.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {portals.map((portal) => (
            <div
              key={portal.role}
              className={`rounded-3xl border p-7 flex flex-col gap-5 transition-all hover:shadow-lg hover:-translate-y-0.5 ${portal.bgLight} ${portal.bgDark}`}
            >
              <div>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${portal.color} flex items-center justify-center text-white text-2xl mb-4 shadow-md`}>
                  {portal.emoji}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{portal.role}</h3>
                <p className={`text-sm font-medium mt-0.5 ${portal.textAccent}`}>{portal.tagline}</p>
              </div>
              <ul className="space-y-2 flex-1">
                {portal.benefits.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span className={`mt-0.5 shrink-0 font-bold ${portal.textAccent}`}>✓</span>
                    {b}
                  </li>
                ))}
              </ul>
              <div className="space-y-2">
                <a
                  href={portal.href}
                  className={`w-full flex items-center justify-center text-sm font-semibold px-4 py-2.5 rounded-xl transition-all active:scale-95 ${portal.ctaStyle}`}
                >
                  {portal.cta} →
                </a>
                {portal.secondary && (
                  <a
                    href={portal.secondary.href}
                    className="w-full flex items-center justify-center text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {portal.secondary.label}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="bg-slate-50 dark:bg-slate-950 py-16 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 relative rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-white">
                <Image src="/logo.png" alt="EduTrack" fill className="object-cover" />
              </div>
              <span className="font-bold text-xl text-slate-900 dark:text-white">EduTrack</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs leading-relaxed mb-6">
              The modern operating system for education. Simple, powerful, and beautifully designed.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Product</h4>
            <ul className="space-y-3">
              <li><a href="#features" className="text-sm text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-500">Features</a></li>
              <li><Link href="/parent/dashboard" className="text-sm text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-500">Parent Portal</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Resources</h4>
            <ul className="space-y-3">
              <li><Link href="/help" className="text-sm text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-500">Help Center</Link></li>
              <li><Link href="/faq" className="text-sm text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-500">FAQs</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Company</h4>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-sm text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-500">About Us</Link></li>
              <li><Link href="/contact" className="text-sm text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-500">Contact</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            &copy; {new Date().getFullYear()} EduTrack Inc. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-4 md:gap-6 justify-center">
            <Link href="/terms" className="text-sm text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="text-sm text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

// --- Main Page Component ---

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
      <main>
        <HeroSection />
        <FeaturesSection />
        <PortalSection />
      </main>
      <Footer />
    </div>
  )
}
