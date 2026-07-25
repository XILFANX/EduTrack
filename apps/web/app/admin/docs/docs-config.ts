import type { LucideIcon } from 'lucide-react'
import { Terminal, Database, Shield, Cpu, Activity, ChevronRight } from 'lucide-react'

export type DevGuideItem = { slug: string; title: string; icon?: LucideIcon }
export type DevGuideGroup = { category: string; items: DevGuideItem[] }

export const devGuides: DevGuideGroup[] = [
  {
    category: 'Core',
    items: [
      { slug: '00-mission-and-overview', title: 'Mission & Overview', icon: Terminal },
      { slug: '01-architecture', title: 'Architecture', icon: Cpu },
      { slug: '03-api-reference', title: 'API Reference', icon: Activity },
      { slug: '04-data-model', title: 'Data Model', icon: Database },
      { slug: '05-multi-tenancy-and-security', title: 'Multi-Tenancy', icon: Shield },
    ]
  },
  {
    category: 'Modules',
    items: [
      { slug: '02-modules/01-admin-portal', title: 'Admin Portal' },
      { slug: '02-modules/02-principal-dashboard', title: 'Principal Dashboard' },
      { slug: '02-modules/03-teacher-portal', title: 'Teacher Portal' },
      { slug: '02-modules/04-bursar-portal', title: 'Bursar Portal' },
      { slug: '02-modules/05-parent-portal', title: 'Parent Portal' },
      { slug: '02-modules/06-ancillary-services', title: 'Ancillary Services' },
    ]
  },
  {
    category: 'Meta',
    items: [
      { slug: '06-decisions/01-single-users-table', title: 'ADR: Single Users Table' },
      { slug: '07-known-issues-and-tech-debt', title: 'Tech Debt' },
      { slug: '08-onboarding', title: 'Onboarding' },
      { slug: '09-glossary', title: 'Glossary' },
    ]
  }
]
