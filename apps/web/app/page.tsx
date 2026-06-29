import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { Building2, CreditCard, Users, Settings, Wrench, Globe, ArrowRight } from 'lucide-react'
import { ModeToggleLanding } from '@/components/shared/mode-toggle-landing'

// --- Landing Page Components ---

function NavBar() {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 relative rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-white shadow-sm">
              <Image src="/logo.jpeg" alt="EstateTrack" fill className="object-cover scale-[1.2]" />
            </div>
            <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">EstateTrack</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-violet-600 dark:text-slate-300 dark:hover:text-violet-500 transition-colors">Features</a>
            <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-violet-600 dark:text-slate-300 dark:hover:text-violet-500 transition-colors">Pricing</a>
            <Link href="/faq" className="text-sm font-medium text-slate-600 hover:text-violet-600 dark:text-slate-300 dark:hover:text-violet-500 transition-colors">FAQ</Link>
          </div>
          <div className="flex items-center gap-3">
            <ModeToggleLanding />
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-violet-600 dark:text-slate-300 dark:hover:text-violet-500 transition-colors ml-2">Log in</Link>
            <Link href="/signup" className="text-sm font-medium px-4 py-2 rounded-full bg-violet-600 hover:bg-violet-700 text-white transition-all shadow-md hover:shadow-lg active:scale-95 duration-200">
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
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Decorative background blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-500/10 dark:bg-violet-500/5 blur-3xl rounded-full -z-10" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 text-sm font-medium mb-8 border border-violet-200 dark:border-violet-500/20">
          <Globe className="w-4 h-4" />
          <span>Now available globally</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-8">
          Property management,<br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-400">
            simplified globally.
          </span>
        </h1>
        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          The all-in-one platform for landlords, property managers, and tenants. Automate rent collection, track maintenance, and scale your portfolio effortlessly.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/signup" className="w-full sm:w-auto px-8 py-4 rounded-full bg-violet-600 hover:bg-violet-700 text-white font-medium text-lg transition-all shadow-xl hover:shadow-violet-600/25 active:scale-95 duration-200 flex items-center justify-center gap-2">
            Start for free <ArrowRight className="w-5 h-5" />
          </Link>
          <a href="#features" className="w-full sm:w-auto px-8 py-4 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-medium text-lg transition-all active:scale-95 duration-200 text-center">
            How it works
          </a>
        </div>
      </div>
    </section>
  )
}

function FeatureCard({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) {
  return (
    <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-400 to-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-6">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
    </div>
  )
}

function FeaturesSection() {
  const features = [
    {
      icon: CreditCard,
      title: 'Automated Payments',
      description: 'Collect rent seamlessly from tenants worldwide with automated invoicing, reminders, and integrated payment gateways.'
    },
    {
      icon: Users,
      title: 'Tenant Portal',
      description: 'Give your tenants a beautiful self-service dashboard to pay rent, submit maintenance requests, and view lease documents.'
    },
    {
      icon: Wrench,
      title: 'Maintenance Tracking',
      description: 'Streamline repair requests from submission to resolution. Assign tasks to staff and keep tenants updated automatically.'
    },
    {
      icon: Building2,
      title: 'Portfolio Insights',
      description: 'Get real-time insights into occupancy rates, revenue, and expenses across your entire property portfolio.'
    },
    {
      icon: Globe,
      title: 'Global Ready',
      description: 'Built for an international audience. Manage properties in any country with localized currency and reporting features.'
    },
    {
      icon: Settings,
      title: 'Role-Based Access',
      description: 'Invite your whole team. Assign granular permissions for property managers, caretakers, and accountants.'
    }
  ]

  return (
    <section id="features" className="py-24 bg-slate-50 dark:bg-slate-950/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">Everything you need to run your properties</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            EstateTrack replaces a dozen disjointed tools with one elegant platform designed specifically for modern property management.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <FeatureCard key={i} {...f} />
          ))}
        </div>
      </div>
    </section>
  )
}

import { PricingSection } from '@/components/landing/pricing-section'

function PortalSection() {
  const portals = [
    {
      emoji: '🏢',
      role: 'Landlord / Property Manager',
      tagline: 'I own or manage properties',
      color: 'from-violet-500 to-fuchsia-500',
      bgLight: 'bg-violet-50 border-violet-200',
      bgDark: 'dark:bg-violet-950/30 dark:border-violet-800/50',
      textAccent: 'text-violet-700 dark:text-violet-400',
      benefits: [
        'Collect rent via M-Pesa or card',
        'Track invoices, arrears & expenses',
        'Manage maintenance requests',
      ],
      cta: 'Create free account',
      href: '/signup',
      ctaStyle: 'bg-violet-600 hover:bg-violet-700 text-white',
      secondary: null,
    },
    {
      emoji: '🔑',
      role: 'Caretaker / Staff',
      tagline: 'I manage day-to-day operations',
      color: 'from-blue-600 to-indigo-500',
      bgLight: 'bg-blue-50 border-blue-200',
      bgDark: 'dark:bg-blue-950/30 dark:border-blue-800/50',
      textAccent: 'text-blue-700 dark:text-blue-400',
      benefits: [
        'Handle maintenance assignments',
        'Update request statuses in real-time',
        'View tenants in your managed buildings',
      ],
      cta: 'Use invite link',
      href: '/login',
      ctaStyle: 'bg-blue-600 hover:bg-blue-700 text-white',
      secondary: { label: 'Learn how invites work', href: '/help' },
    },
    {
      emoji: '🏠',
      role: 'Tenant',
      tagline: 'I live in a managed property',
      color: 'from-indigo-500 to-violet-500',
      bgLight: 'bg-indigo-50 border-indigo-200',
      bgDark: 'dark:bg-indigo-950/30 dark:border-indigo-800/50',
      textAccent: 'text-indigo-700 dark:text-indigo-400',
      benefits: [
        'Pay rent with M-Pesa or card',
        'Submit & track maintenance requests',
        'View your lease and payment history',
      ],
      cta: 'Sign in to your portal',
      href: '/login',
      ctaStyle: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      secondary: { label: 'Contact your landlord for access', href: '/help' },
    },
  ]

  return (
    <section id="portals" className="py-20 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 text-sm font-medium mb-6 border border-violet-200 dark:border-violet-500/20">
            Choose your portal
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Who are you?</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            EstateTrack is built for every person involved in property management — each with their own tailored portal.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {portals.map((portal) => (
            <div
              key={portal.role}
              className={`rounded-3xl border p-7 flex flex-col gap-5 transition-all hover:shadow-lg hover:-translate-y-0.5 ${portal.bgLight} ${portal.bgDark}`}
            >
              {/* Icon + role */}
              <div>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${portal.color} flex items-center justify-center text-white text-2xl mb-4 shadow-md`}>
                  {portal.emoji}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{portal.role}</h3>
                <p className={`text-sm font-medium mt-0.5 ${portal.textAccent}`}>{portal.tagline}</p>
              </div>
              {/* Benefits */}
              <ul className="space-y-2 flex-1">
                {portal.benefits.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span className={`mt-0.5 shrink-0 font-bold ${portal.textAccent}`}>✓</span>
                    {b}
                  </li>
                ))}
              </ul>
              {/* CTAs */}
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
                    className="w-full flex items-center justify-center text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
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
                <Image src="/logo.jpeg" alt="EstateTrack" fill className="object-cover scale-[1.2]" />
              </div>
              <span className="font-bold text-xl text-slate-900 dark:text-white">EstateTrack</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs leading-relaxed mb-6">
              The modern operating system for property management. Simple, powerful, and built for global scale.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Product</h4>
            <ul className="space-y-3">
              <li><a href="#features" className="text-sm text-slate-500 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-500">Features</a></li>
              <li><a href="#pricing" className="text-sm text-slate-500 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-500">Pricing</a></li>
              <li><Link href="/tenant/dashboard" className="text-sm text-slate-500 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-500">Tenant Portal</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Resources</h4>
            <ul className="space-y-3">
              <li><Link href="/help" className="text-sm text-slate-500 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-500">Help Center</Link></li>
              <li><Link href="/api-docs" className="text-sm text-slate-500 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-500">API Documentation</Link></li>
              <li><Link href="/blog" className="text-sm text-slate-500 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-500">Blog</Link></li>
              <li><Link href="/faq" className="text-sm text-slate-500 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-500">FAQs</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Company</h4>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-sm text-slate-500 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-500">About Us</Link></li>
              <li><Link href="/contact" className="text-sm text-slate-500 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-500">Contact</Link></li>
              <li><Link href="/careers" className="text-sm text-slate-500 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-500">Careers</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            &copy; {new Date().getFullYear()} EstateTrack Inc. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-4 md:gap-6 justify-center">
            <Link href="/terms" className="text-sm text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="text-sm text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Privacy Policy</Link>
            <Link href="/security" className="text-sm text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Security</Link>
            <Link href="/cookies" className="text-sm text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Cookie Policy</Link>
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

  // Dynamic country detection for pricing via headers
  const headersList = await headers()
  const countryCode = headersList.get('x-vercel-ip-country') || 'KE' // Default to KE natively if IP header is missing
  const isKenya = countryCode === 'KE'

  // If user is authenticated, redirect them to their dashboard
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      redirect('/onboarding')
    }

    switch (profile.role) {
      case 'tenant':
        redirect('/tenant/dashboard')
      case 'caretaker':
        redirect('/caretaker/dashboard')
      case 'property_manager':
      case 'accountant':
        redirect('/manager/dashboard')
      case 'platform_owner':
        redirect('/admin/dashboard')
      case 'landlord':
      default:
        redirect('/dashboard')
    }
  }

  // If user is NOT authenticated, show the landing page
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 selection:bg-violet-200 dark:selection:bg-violet-900">
      <NavBar />
      <main>
        <HeroSection />
        <PortalSection />
        <FeaturesSection />
        <PricingSection isKenya={isKenya} />
      </main>
      <Footer />
    </div>
  )
}
