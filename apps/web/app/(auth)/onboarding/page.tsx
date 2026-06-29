'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { completeOnboarding, type OnboardingData } from './actions'
import { GraduationCap, School, CheckCircle2 } from 'lucide-react'

const STEPS = [
  { id: 1, title: 'School Details', desc: 'Tell us about your school' },
  { id: 2, title: 'Curriculum Type', desc: 'What curriculum does your school follow?' },
  { id: 3, title: 'Subscription Plan', desc: 'Choose the right tier for your school' },
  { id: 4, title: 'Almost done!', desc: 'Final preferences & confirmation' },
]

const CURRICULUM_OPTIONS = [
  {
    id: 'cbc',
    name: 'CBC',
    desc: 'Competency-Based Curriculum — Kenya (Grade 1 to 9)',
    flag: '🇰🇪',
  },
  {
    id: '844',
    name: '8-4-4',
    desc: 'Traditional Kenyan system — Standard 1 to Form 6',
    flag: '🇰🇪',
  },
  {
    id: 'igcse',
    name: 'IGCSE / A-Levels',
    desc: 'Cambridge international curriculum',
    flag: '🌍',
  },
  {
    id: 'other',
    name: 'Other / Mixed',
    desc: 'Custom or hybrid curriculum',
    flag: '📚',
  },
]

const PLANS = [
  { id: 'trial', name: 'Trial', price: 'Free', desc: 'Up to 50 students' },
  { id: 'basic', name: 'Basic', price: 'KES 3,500', desc: 'Up to 300 students' },
  { id: 'standard', name: 'Standard', price: 'KES 7,500', desc: 'Up to 800 students' },
  { id: 'premium', name: 'Premium', price: 'Custom', desc: 'Unlimited students' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [schoolName, setSchoolName] = useState('')
  const [schoolPhone, setSchoolPhone] = useState('')
  const [schoolAddress, setSchoolAddress] = useState('')
  const [curriculumType, setCurriculumType] = useState<'cbc' | '844' | 'igcse' | 'other'>('cbc')
  const [subscriptionPlan, setSubscriptionPlan] = useState('trial')
  const [feeDueDay, setFeeDueDay] = useState(5)

  const progress = (step / STEPS.length) * 100

  async function handleComplete() {
    setLoading(true)
    setError(null)
    const data: OnboardingData = {
      schoolName,
      schoolPhone,
      schoolAddress,
      curriculumType,
      subscriptionPlan,
      feeDueDay,
    }
    try {
      const res = await completeOnboarding(data)
      if ('error' in res) {
        setError(res.error)
        setLoading(false)
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
      setLoading(false)
    }
  }

  function handleNext() {
    setError(null)
    if (step === 1 && !schoolName.trim()) {
      setError('Please enter your school name.')
      return
    }
    if (step === 1 && !schoolPhone.trim()) {
      setError('Please enter a school phone number.')
      return
    }
    setStep(step + 1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 relative mx-auto rounded-full overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 bg-white">
            <Image src="/logo.jpeg" alt="EduTrack" fill className="object-cover scale-[1.2]" />
          </div>
          <p className="text-blue-600 dark:text-blue-400 font-bold text-xl">EduTrack</p>
          <h1 className="text-2xl font-bold text-foreground">Set up your school</h1>
          <p className="text-muted-foreground text-sm">
            Step {step} of {STEPS.length} — {STEPS[step - 1].title}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <Card className="shadow-lg border border-border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-card-foreground flex items-center gap-2">
              <School className="w-5 h-5 text-blue-600" />
              {STEPS[step - 1].title}
            </CardTitle>
            <CardDescription>{STEPS[step - 1].desc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* ── Step 1: School Details ── */}
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="schoolName">School name *</Label>
                  <Input
                    id="schoolName"
                    placeholder="e.g. Nairobi Academy"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    This appears on report cards, receipts, and leaving certificates.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schoolPhone">School phone number *</Label>
                  <Input
                    id="schoolPhone"
                    type="tel"
                    placeholder="0712 345 678"
                    value={schoolPhone}
                    onChange={(e) => setSchoolPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schoolAddress">School address</Label>
                  <Input
                    id="schoolAddress"
                    placeholder="e.g. Westlands, Nairobi"
                    value={schoolAddress}
                    onChange={(e) => setSchoolAddress(e.target.value)}
                  />
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-400">
                  🏫 <strong>You&apos;ll add classes, subjects, and staff from your dashboard</strong> after setup.
                </div>
              </>
            )}

            {/* ── Step 2: Curriculum ── */}
            {step === 2 && (
              <div className="grid grid-cols-1 gap-3">
                {CURRICULUM_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setCurriculumType(opt.id as OnboardingData['curriculumType'])}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      curriculumType === opt.id
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-600'
                        : 'border-border hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{opt.flag}</span>
                      <div>
                        <p className="font-bold text-foreground">{opt.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                      </div>
                      {curriculumType === opt.id && (
                        <CheckCircle2 className="w-5 h-5 text-blue-600 ml-auto shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
                <p className="text-xs text-muted-foreground">
                  This determines how grades are recorded — numeric (8-4-4 / IGCSE) or rubric-based (CBC).
                </p>
              </div>
            )}

            {/* ── Step 3: Subscription Plan ── */}
            {step === 3 && (
              <div className="grid grid-cols-1 gap-3">
                {PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSubscriptionPlan(plan.id)}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      subscriptionPlan === plan.id
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-600'
                        : 'border-border hover:border-blue-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-foreground">{plan.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{plan.desc}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600 dark:text-blue-400">{plan.price}</p>
                        <p className="text-[10px] text-muted-foreground">/ term</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* ── Step 4: Final Preferences ── */}
            {step === 4 && (
              <>
                <div className="space-y-2">
                  <Label>Term fee due day</Label>
                  <p className="text-sm text-muted-foreground">
                    On which day of the month do school fees become due?
                  </p>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {[1, 2, 5, 10, 15].map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setFeeDueDay(day)}
                        className={`py-3 rounded-lg border text-sm font-semibold transition-colors ${
                          feeDueDay === day
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-border text-foreground hover:border-blue-400 hover:bg-muted'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="border-t border-border pt-4 mt-4 space-y-2">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-blue-600" /> Summary
                  </p>
                  <div className="text-sm text-muted-foreground space-y-1.5 bg-muted/50 rounded-xl p-4">
                    {[
                      { label: 'School', value: schoolName || '—' },
                      { label: 'Phone', value: schoolPhone || '—' },
                      { label: 'Curriculum', value: curriculumType.toUpperCase() },
                      { label: 'Plan', value: subscriptionPlan.charAt(0).toUpperCase() + subscriptionPlan.slice(1) },
                      { label: 'Fees due', value: `Day ${feeDueDay} of each month` },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between">
                        <span>{label}</span>
                        <span className="font-medium text-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-md border border-red-200 dark:border-red-800/40">
                {error}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 1 && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setStep(step - 1)}
              disabled={loading}
            >
              ← Back
            </Button>
          )}
          {step < STEPS.length ? (
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={handleNext}
              disabled={loading}
            >
              Continue →
            </Button>
          ) : (
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={handleComplete}
              disabled={loading}
            >
              {loading ? 'Setting up your school…' : '🎓 Go to my dashboard'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
