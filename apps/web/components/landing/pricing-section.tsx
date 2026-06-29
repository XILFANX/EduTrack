"use client"

import React from 'react'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

function PricingCard({ tier, price, description, features, highlighted = false, isAnnual = false }: {
  tier: string; price: string; description: string; features: string[]; highlighted?: boolean; isAnnual?: boolean
}) {
  return (
    <div className={`relative p-8 rounded-3xl flex flex-col ${highlighted ? 'bg-violet-600 border border-violet-500 shadow-xl lg:scale-105 z-10 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'}`}>
      {highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-fuchsia-300 to-fuchsia-400 text-violet-950 text-sm font-bold rounded-full shadow-sm whitespace-nowrap">
          Most Popular
        </div>
      )}
      <div className="mb-8 mt-2">
        <h3 className={`text-xl font-bold mb-2 ${highlighted ? 'text-white' : ''}`}>{tier}</h3>
        <p className={`text-sm h-10 ${highlighted ? 'text-violet-100' : 'text-slate-500 dark:text-slate-400'}`}>{description}</p>
      </div>
      <div className="mb-8">
        <span className="text-4xl font-extrabold">{price}</span>
        {price !== 'Custom' && (
           <span className={`text-sm ${highlighted ? 'text-violet-100' : 'text-slate-500 dark:text-slate-400'}`}>
             /{isAnnual ? 'year' : 'month'}
           </span>
        )}
      </div>
      <ul className="space-y-4 mb-8 flex-1">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3">
            <CheckCircle2 className={`w-5 h-5 shrink-0 ${highlighted ? 'text-violet-200' : 'text-violet-500'}`} />
            <span className={`text-sm leading-snug ${highlighted ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>{feature}</span>
          </li>
        ))}
      </ul>
      <Link
        href="/signup"
        className={`w-full py-4 rounded-xl font-semibold text-center transition-all ${
          highlighted 
            ? 'bg-white text-violet-600 hover:bg-violet-50' 
            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
        }`}
      >
        Get Started
      </Link>
    </div>
  )
}

export function PricingSection({ isKenya }: { isKenya: boolean }) {
  const [isAnnual, setIsAnnual] = React.useState(false)

  const plans = isKenya ? [
    {
      tier: "Trial",
      price: "Free",
      description: "Perfect for testing out the platform.",
      features: ['Up to 10 units', 'Unlimited properties', 'Basic support']
    },
    {
      tier: "Starter",
      price: isAnnual ? "KES 20,400" : "KES 2,000",
      description: "Perfect for individual landlords starting out.",
      features: ['Up to 50 units', 'Unlimited properties', 'Full platform access', 'Email & Web support']
    },
    {
      tier: "Growth",
      price: isAnnual ? "KES 45,900" : "KES 4,500",
      description: "For growing portfolios prioritizing automation.",
      features: ['Up to 100 units', 'Unlimited properties', 'Full platform access', 'Priority support'],
      highlighted: true
    },
    {
      tier: "Enterprise",
      price: "Custom",
      description: "Enterprise scale software for managing unlimited units.",
      features: ['Unlimited units', 'Unlimited properties', 'White-label options', 'Custom API integrations']
    }
  ] : [
    {
      tier: "Trial",
      price: "Free",
      description: "Perfect for testing out the platform.",
      features: ['Up to 10 units', 'Unlimited properties', 'Basic support']
    },
    {
      tier: "Starter",
      price: isAnnual ? "$204" : "$20",
      description: "Perfect for individual landlords starting out.",
      features: ['Up to 50 units', 'Unlimited properties', 'Full platform access', 'Email & Web support']
    },
    {
      tier: "Growth",
      price: isAnnual ? "$459" : "$45",
      description: "For growing portfolios prioritizing automation.",
      features: ['Up to 100 units', 'Unlimited properties', 'Full platform access', 'Priority support'],
      highlighted: true
    },
    {
      tier: "Enterprise",
      price: "Custom",
      description: "Enterprise scale software for managing unlimited units.",
      features: ['Unlimited units', 'Unlimited properties', 'White-label options', 'Custom API integrations']
    }
  ]

  return (
    <section id="pricing" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">Simple, transparent pricing</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-2">
            Designed for you. <span className="font-semibold text-slate-900 dark:text-white">30-day free trial</span>. No credit card required.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
            Start for free, upgrade when you need to. No hidden or per-tenant fees.
          </p>

          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>Monthly</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative inline-flex h-7 w-14 items-center rounded-full bg-violet-600 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-600 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  isAnnual ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
              Annually <span className="text-violet-600 dark:text-violet-400 font-bold ml-1">Save 17%</span>
            </span>
          </div>

          <div className="mt-8 p-4 bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-500/20 rounded-xl inline-block">
            <p className="text-sm font-medium text-violet-800 dark:text-violet-200">
              ✨ <span className="font-bold">All plans include:</span> Core Rent Engine, Automated Receipting, Expense Tracking, Arrears Management, and Unlimited Staff Accounts.
            </p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan, i) => (
            <PricingCard key={i} {...plan} isAnnual={isAnnual} />
          ))}
        </div>
      </div>
    </section>
  )
}
