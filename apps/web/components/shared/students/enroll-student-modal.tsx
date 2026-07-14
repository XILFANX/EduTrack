'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { enrollStudent, type EnrollStudentData } from './actions'
import { GraduationCap, ChevronLeft, ChevronRight, CheckCircle2, Hash, Camera, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Class {
  id: string
  name: string
}

interface EnrollStudentModalProps {
  open: boolean
  onClose: () => void
  classes: Class[]
  onSuccess: () => void
}

const STEPS = ['Student Details', 'Confirm & Enroll']

export function EnrollStudentModal({ open, onClose, classes, onSuccess }: EnrollStudentModalProps) {
  const [step, setStep] = useState(1)
  const [admissionNumber, setAdmissionNumber] = useState('')
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('')
  const [classId, setClassId] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setStep(1)
    setAdmissionNumber('')
    setFirstName('')
    setMiddleName('')
    setLastName('')
    setDob('')
    setGender('')
    setClassId(null)
    setPhotoFile(null)
    setPhotoPreview(null)
    setError(null)
    setDone(false)
    setLoading(false)
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Photo must be under 5 MB.'); return }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleNext() {
    setError(null)
    const adm = admissionNumber.trim()
    if (!adm) return setError('Admission number is required.')
    if (!/^[a-zA-Z0-9]+$/.test(adm)) return setError('Admission number can only contain letters and numbers (no spaces or special characters).')
    if (!firstName.trim()) return setError('First name is required.')
    if (!lastName.trim()) return setError('Surname is required.')
    setStep(2)
  }

  async function handleSubmit() {
    setLoading(true)
    setError(null)

    // Upload photo first if provided
    let photoUrl: string | undefined
    if (photoFile) {
      try {
        const supabase = createClient()
        const ext = photoFile.name.split('.').pop() ?? 'jpg'
        const path = `${admissionNumber.trim()}-${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('student-photos')
          .upload(path, photoFile, { upsert: true })
        if (upErr) throw new Error(upErr.message)
        const { data: urlData } = supabase.storage.from('student-photos').getPublicUrl(path)
        photoUrl = urlData.publicUrl
      } catch (err: any) {
        setLoading(false)
        setError(`Photo upload failed: ${err.message}`)
        return
      }
    }

    const data: EnrollStudentData = {
      admissionNumber,
      firstName,
      middleName,
      lastName,
      dob,
      gender,
      classId,
      photoUrl,
    }
    const res = await enrollStudent(data)
    setLoading(false)
    if ('error' in res) {
      setError(res.error)
      setStep(1)
    } else {
      setDone(true)
      onSuccess()
    }
  }

  const selectedClass = classes.find(c => c.id === classId)

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-0 overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-slate-100 dark:bg-slate-800">
          <div
            className="h-1 bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
            style={{ width: `${done ? 100 : ((step - 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-6">
          <DialogHeader className="mb-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  {done ? 'Student Enrolled!' : `Enroll Student — Step ${step} of ${STEPS.length}`}
                </DialogTitle>
                <p className="text-xs text-muted-foreground">{done ? 'The student has been added to the registry.' : STEPS[step - 1]}</p>
              </div>
            </div>
          </DialogHeader>

          {/* ── Success State ── */}
          {done ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-bold text-foreground text-lg">{firstName} {middleName ? middleName + ' ' : ''}{lastName}</p>
                <p className="text-sm text-muted-foreground font-mono mt-0.5">{admissionNumber}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Assigned to <span className="font-medium text-foreground">{selectedClass?.name ?? 'No class'}</span>
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={handleClose}>Done</Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => { reset() }}>
                  Enroll Another
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* ── Step 1: Student Details + Class + Admission Number ── */}
              {step === 1 && (
                <div className="space-y-4">
                  {/* Photo Upload */}
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="w-16 h-16 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-400 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 transition-colors shrink-0 overflow-hidden group relative"
                    >
                      {photoPreview ? (
                        <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">Student Photo <span className="text-muted-foreground font-normal">(Optional)</span></p>
                      <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG or WebP · Max 5 MB</p>
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="mt-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        {photoPreview ? 'Change photo' : 'Upload photo'}
                      </button>
                      {photoPreview && (
                        <button
                          type="button"
                          onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
                          className="ml-3 text-xs text-red-500 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </div>

                  {/* Admission Number — prominent */}
                  <div className="space-y-1.5">
                    <Label htmlFor="enroll-adm" className="flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-blue-500" />
                      Admission Number *
                    </Label>
                    <Input
                      id="enroll-adm"
                      value={admissionNumber}
                      onChange={e => setAdmissionNumber(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                      placeholder="e.g. ADM001"
                      autoFocus
                    />
                    <p className="text-[11px] text-muted-foreground">This is the key identifier used throughout the system. Must be unique per student.</p>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>First Name *</Label>
                        <Input
                          id="enroll-first-name"
                          value={firstName}
                          onChange={e => setFirstName(e.target.value)}
                          placeholder="e.g. Amina"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Surname *</Label>
                        <Input
                          id="enroll-last-name"
                          value={lastName}
                          onChange={e => setLastName(e.target.value)}
                          placeholder="e.g. Wanjiru"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Middle Name <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                      <Input
                        id="enroll-middle-name"
                        value={middleName}
                        onChange={e => setMiddleName(e.target.value)}
                        placeholder="e.g. Nduta"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Date of Birth</Label>
                      <Input
                        id="enroll-dob"
                        type="date"
                        value={dob}
                        onChange={e => setDob(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <div className="flex gap-2">
                        {['Male', 'Female'].map(g => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setGender(g)}
                            className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition-all ${
                              gender === g
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-slate-200 dark:border-slate-700 text-muted-foreground hover:border-blue-300'
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Class Assignment — inline in step 1 */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
                    <Label>Assign to Class <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                      <button
                        type="button"
                        onClick={() => setClassId(null)}
                        className={`text-left px-4 py-2.5 rounded-xl border text-sm transition-all ${
                          classId === null
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-600 text-blue-700 dark:text-blue-300 font-semibold'
                            : 'border-slate-200 dark:border-slate-700 text-muted-foreground hover:border-blue-300'
                        }`}
                      >
                        Unassigned
                      </button>
                      {classes.map(cls => (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => setClassId(cls.id)}
                          className={`text-left px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                            classId === cls.id
                              ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-600 text-blue-700 dark:text-blue-300'
                              : 'border-slate-200 dark:border-slate-700 text-foreground hover:border-blue-300'
                          }`}
                        >
                          {cls.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 2: Confirm ── */}
              {step === 2 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                    {photoPreview ? (
                      <img src={photoPreview} alt="" className="w-12 h-12 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                        <span className="text-base font-bold text-blue-700 dark:text-blue-300">{firstName[0]}{lastName[0]}</span>
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-foreground">{firstName} {middleName ? middleName + ' ' : ''}{lastName}</p>
                      <p className="text-xs font-mono text-muted-foreground">{admissionNumber}</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-2 text-sm">
                    {[
                      { label: 'Date of Birth', value: dob || 'Not provided' },
                      { label: 'Gender', value: gender || 'Not provided' },
                      { label: 'Class', value: selectedClass?.name ?? 'Unassigned' },
                      { label: 'Photo', value: photoFile ? photoFile.name : 'No photo' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-semibold text-foreground text-right ml-4 truncate max-w-[160px]">{value}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Please confirm these details are correct before enrolling.
                  </p>
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800/40">
                  {error}
                </p>
              )}

              {/* Navigation */}
              <div className="flex gap-2 pt-1">
                {step > 1 && (
                  <Button variant="outline" className="flex-1 gap-1" onClick={() => setStep(s => s - 1)} disabled={loading}>
                    <ChevronLeft className="w-4 h-4" /> Back
                  </Button>
                )}
                {step < STEPS.length ? (
                  <Button className="flex-1 gap-1 bg-blue-600 hover:bg-blue-700" onClick={handleNext}>
                    Review <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? 'Enrolling…' : 'Confirm & Enroll'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
