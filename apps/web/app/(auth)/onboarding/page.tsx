'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { completeOnboarding, type OnboardingData } from './actions'
import { GraduationCap, School, CheckCircle2, Camera, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRef } from 'react'

const STEPS = [
  { id: 1, title: 'School Details', desc: 'Tell us about your school' },
  { id: 2, title: 'Curriculum Type', desc: 'What curriculum does your school follow?' },
  { id: 3, title: 'Region & Preferences', desc: 'Final setup & confirmation' },
]

const CURRICULUM_OPTIONS = [
  { id: 'cbc', name: 'CBC', desc: 'Competency-Based Curriculum — Kenya (Grade 1 to 9)', flag: '🇰🇪' },
  { id: '844', name: '8-4-4', desc: 'Traditional Kenyan system — Standard 1 to Form 6', flag: '🇰🇪' },
  { id: 'igcse', name: 'IGCSE / A-Levels', desc: 'Cambridge international curriculum', flag: '🌍' },
  { id: 'other', name: 'Other / Mixed', desc: 'Custom or hybrid curriculum', flag: '📚' },
]

const COUNTRIES = [
  { code: 'KE', name: 'Kenya',        flag: '🇰🇪', currency: 'KES' },
  { code: 'UG', name: 'Uganda',       flag: '🇺🇬', currency: 'UGX' },
  { code: 'TZ', name: 'Tanzania',     flag: '🇹🇿', currency: 'TZS' },
  { code: 'RW', name: 'Rwanda',       flag: '🇷🇼', currency: 'RWF' },
  { code: 'NG', name: 'Nigeria',      flag: '🇳🇬', currency: 'NGN' },
  { code: 'GH', name: 'Ghana',        flag: '🇬🇭', currency: 'GHS' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', currency: 'ZAR' },
  { code: 'US', name: 'United States',flag: '🇺🇸', currency: 'USD' },
  { code: 'GB', name: 'United Kingdom',flag:'🇬🇧', currency: 'GBP' },
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
  const [countryCode, setCountryCode] = useState('KE')
  const [feeDueDay, setFeeDueDay] = useState(5)
  const [adminTitle, setAdminTitle] = useState<'principal' | 'headteacher'>('principal')
  
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const progress = (step / STEPS.length) * 100

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Logo must be under 5 MB.'); return }
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  async function handleComplete() {
    setLoading(true)
    setError(null)
    
    let logoUrl: string | null = null
    
    if (logoFile) {
      setUploadingLogo(true)
      try {
        const supabase = createClient()
        const ext = logoFile.name.split('.').pop() ?? 'jpg'
        const slug = schoolName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30)
        const path = `${slug}-${Date.now()}.${ext}`
        
        const { error: upErr } = await supabase.storage
          .from('school-logos')
          .upload(path, logoFile, { upsert: true })
          
        if (upErr) throw new Error(upErr.message)
        
        const { data: urlData } = supabase.storage.from('school-logos').getPublicUrl(path)
        logoUrl = urlData.publicUrl
      } catch (err: any) {
        setError(`Logo upload failed: ${err.message}`)
        setLoading(false)
        setUploadingLogo(false)
        return
      }
      setUploadingLogo(false)
    }

    const data: OnboardingData = {
      schoolName,
      schoolPhone,
      schoolAddress,
      curriculumType,
      countryCode,
      feeDueDay,
      adminTitle,
      logoUrl,
    }
    try {
      const res = await completeOnboarding(data)
      if ('error' in res) {
        setError(res.error)
        setLoading(false)
      } else {
        window.location.href = '/dashboard'
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
            <Image src="/logo.png" alt="EduTrack" fill className="object-cover " />
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
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-400 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 transition-colors shrink-0 overflow-hidden group relative"
                    >
                      {logoPreview ? (
                        <img src={logoPreview} alt="preview" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">School Logo <span className="text-muted-foreground font-normal">(Optional)</span></p>
                      <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG or WebP · Max 5 MB</p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        {logoPreview ? 'Change logo' : 'Upload logo'}
                      </button>
                      {logoPreview && (
                        <button
                          type="button"
                          onClick={() => { setLogoFile(null); setLogoPreview(null) }}
                          className="ml-3 text-xs text-red-500 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                      onChange={handleLogoChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="schoolName">School name *</Label>
                    <Input
                      id="schoolName"
                      placeholder="e.g. Nairobi Academy"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                    />
                  </div>
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
                <div className="space-y-2">
                  <Label>Your official title</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input 
                        type="radio" 
                        name="adminTitle" 
                        value="principal" 
                        checked={adminTitle === 'principal'} 
                        onChange={() => setAdminTitle('principal')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      Principal
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input 
                        type="radio" 
                        name="adminTitle" 
                        value="headteacher" 
                        checked={adminTitle === 'headteacher'} 
                        onChange={() => setAdminTitle('headteacher')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      Headteacher
                    </label>
                  </div>
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
              </div>
            )}

            {/* ── Step 3: Country / Billing Region & Final ── */}
            {step === 3 && (
              <div className="space-y-6">
                
                {/* Region */}
                <div className="space-y-2">
                  <Label>Country (Billing Region)</Label>
                  <p className="text-xs text-muted-foreground">
                    This determines your local currency and pricing.
                  </p>
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-1 border rounded-md">
                    {COUNTRIES.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => setCountryCode(c.code)}
                        className={`text-left p-2 rounded-lg border transition-all flex items-center gap-3 ${
                          countryCode === c.code
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-600'
                            : 'border-transparent hover:border-blue-200 bg-muted/30'
                        }`}
                      >
                        <span className="text-lg">{c.flag}</span>
                        <span className="font-medium text-sm text-foreground">{c.name}</span>
                        <span className="ml-auto text-[10px] font-mono text-muted-foreground">{c.currency}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fees Due Day */}
                <div className="space-y-2">
                  <Label>Term fee due day</Label>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {[1, 2, 5, 10, 15].map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setFeeDueDay(day)}
                        className={`py-2 rounded-lg border text-sm font-semibold transition-colors ${
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
                      { label: 'Curriculum', value: curriculumType.toUpperCase() },
                      { label: 'Region', value: COUNTRIES.find(c => c.code === countryCode)?.name },
                      { label: 'Fees due', value: `Day ${feeDueDay}` },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between">
                        <span>{label}</span>
                        <span className="font-medium text-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
              </div>
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
              disabled={loading || uploadingLogo}
            >
              {loading || uploadingLogo ? 'Setting up...' : '🎓 Go to dashboard'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
