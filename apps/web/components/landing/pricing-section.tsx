"use client"

import React from 'react'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

function PricingCard({ tier, price, description, features, highlighted = false, isAnnual = false }: {
  tier: string; price: string; description: string; features: string[]; highlighted?: boolean; isAnnual?: boolean
}) {
  return (
    <div className={`relative p-6 rounded-2xl flex flex-col ${highlighted ? 'bg-blue-600 border border-blue-500 shadow-xl z-10 text-white ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-950' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'}`}>
      {highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-300 to-blue-400 text-blue-950 text-sm font-bold rounded-full shadow-sm whitespace-nowrap">
          Most Popular
        </div>
      )}
      <div className="mb-6 mt-1">
        <h3 className={`text-lg font-bold mb-1 ${highlighted ? 'text-white' : ''}`}>{tier}</h3>
        <p className={`text-xs ${highlighted ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>{description}</p>
      </div>
      <div className="mb-6">
        <span className="text-3xl font-extrabold">{price}</span>
        {price !== 'Custom' && (
           <span className={`text-sm ${highlighted ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
             /{isAnnual ? 'year' : 'month'}
           </span>
        )}
      </div>
      <ul className="space-y-3 mb-6 flex-1">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2">
            <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${highlighted ? 'text-blue-200' : 'text-blue-500'}`} />
            <span className={`text-xs leading-snug ${highlighted ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>{feature}</span>
          </li>
        ))}
      </ul>
      <Link
        href="/signup"
        className={`w-full py-2.5 rounded-xl font-semibold text-sm text-center transition-all ${
          highlighted 
            ? 'bg-white text-blue-600 hover:bg-blue-50' 
            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
        }`}
      >
        Get Started
      </Link>
    </div>
  )
}

export function PricingSection() {
  const [isAnnual, setIsAnnual] = React.useState(false)

  // Standardized pricing for schools
  const plans = [
    {
      tier: "Trial",
      price: "Free",
      description: "Perfect for testing out the platform.",
      features: ['Up to 50 students', '1 School Campus', 'Basic support']
    },
    {
      tier: "Starter",
      price: isAnnual ? "$204" : "$20",
      description: "Perfect for small schools starting out.",
      features: ['Up to 250 students', '1 School Campus', 'Full platform access', 'Email & Web support']
    },
    {
      tier: "Growth",
      price: isAnnual ? "$459" : "$45",
      description: "For growing schools prioritizing automation.",
      features: ['Up to 500 students', '1 School Campus', 'Full platform access', 'Priority support'],
      highlighted: true
    },
    {
      tier: "Enterprise",
      price: "Custom",
      description: "Enterprise scale software for managing large institutions.",
      features: ['Unlimited students', 'Multiple Campuses', 'White-label options', 'Custom API integrations']
    }
  ]

  return (
    <section id="pricing" className="py-14 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium mb-4 border border-blue-200 dark:border-blue-500/20">
            Pricing
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">Simple, transparent pricing</h2>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 mb-2">
            Designed for you. <span className="font-semibold text-slate-900 dark:text-white">30-day free trial</span>. No credit card required.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Start for free, upgrade when you need to.
          </p>

          <div className="flex items-center justify-center gap-3 mt-6">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>Monthly</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAnnual ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
              Annually <span className="text-blue-600 dark:text-blue-400 font-bold ml-1">Save 17%</span>
            </span>
          </div>

          <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-500/20 rounded-xl inline-block">
            <p className="text-xs font-medium text-blue-800 dark:text-blue-200">
              ✨ <span className="font-bold">All plans include:</span> Automated Fee Engine, Academics & Grades, Attendance Tracking, and Unified Communications.
            </p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <PricingCard key={i} {...plan} isAnnual={isAnnual} />
          ))}
        </div>
      </div>
    </section>
  )
}
