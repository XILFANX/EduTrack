import Link from 'next/link'
import { BookOpen, Settings, Users, CreditCard, Wrench, HelpCircle, FileText, ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'Help Center | EduTrack',
  description: 'Browse guides, tutorials, and support articles to get the most out of EduTrack.',
}

const guides = [
  { slug: '00-getting-started', title: 'Getting Started', icon: BookOpen, desc: 'Your first steps on the platform.' },
  { slug: '01-property-setup', title: 'Property Setup', icon: Settings, desc: 'How to add properties and units.' },
  { slug: '02-tenant-management', title: 'Tenant Management', icon: Users, desc: 'Invite and manage your tenants.' },
  { slug: '03-rent-and-payments', title: 'Rent & Payments', icon: CreditCard, desc: 'Invoices, tracking, and reconciliation.' },
  { slug: '04-maintenance', title: 'Maintenance', icon: Wrench, desc: 'Handle repair requests seamlessly.' },
  { slug: '05-faq-and-troubleshooting', title: 'FAQs', icon: HelpCircle, desc: 'Common questions and issues.' },
  { slug: '06-account-and-billing', title: 'Account & Billing', icon: FileText, desc: 'Manage your subscription tier.' },
]

export default function HelpCenterPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6">
          How can we help?
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
          Explore our comprehensive guides and tutorials to get the most out of EduTrack. Built for principals, teachers, and parents.
        </p>
      </div>
      
      <div className="grid sm:grid-cols-2 gap-6">
        {guides.map((guide) => {
          const Icon = guide.icon
          return (
            <Link 
              key={guide.slug} 
              href={`/help/${guide.slug}`}
              className="group p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-md transition-all hover:border-violet-300 dark:hover:border-violet-700 block"
            >
              <div className="flex flex-col h-full justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-slate-800 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-6 group-hover:bg-violet-100 dark:group-hover:bg-violet-900/50 transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{guide.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">{guide.desc}</p>
                </div>
                <div className="flex items-center text-sm font-medium text-violet-600 dark:text-violet-400">
                  Read Guide <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
