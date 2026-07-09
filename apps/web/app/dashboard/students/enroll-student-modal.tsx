'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { enrollStudent, type EnrollStudentData } from './actions'
import { GraduationCap, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'

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

const STEPS = ['Student Details', 'Class Assignment', 'Confirm']

export function EnrollStudentModal({ open, onClose, classes, onSuccess }: EnrollStudentModalProps) {
  const [step, setStep] = useState(1)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('')
  const [classId, setClassId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  function reset() {
    setStep(1)
    setFirstName('')
    setLastName('')
    setDob('')
    setGender('')
    setClassId(null)
    setError(null)
    setDone(false)
    setLoading(false)
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleNext() {
    setError(null)
    if (step === 1) {
      if (!firstName.trim()) return setError('First name is required.')
      if (!lastName.trim()) return setError('Last name is required.')
    }
    setStep(s => s + 1)
  }

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    const data: EnrollStudentData = { firstName, lastName, dob, gender, classId, parentName: '', parentPhone: '' }
    const res = await enrollStudent(data)
    setLoading(false)
    if ('error' in res) {
      setError(res.error)
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
                <p className="font-bold text-foreground text-lg">{firstName} {lastName}</p>
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
              {/* ── Step 1: Student Details ── */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>First Name *</Label>
                      <Input
                        id="enroll-first-name"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        placeholder="e.g. Amina"
                        autoFocus
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Last Name *</Label>
                      <Input
                        id="enroll-last-name"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        placeholder="e.g. Wanjiru"
                      />
                    </div>
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
              )}

              {/* ── Step 2: Class Assignment ── */}
              {step === 2 && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Select a class to assign <span className="font-semibold text-foreground">{firstName}</span> to, or skip to assign later.</p>
                  <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                    <button
                      type="button"
                      onClick={() => setClassId(null)}
                      className={`text-left px-4 py-3 rounded-xl border text-sm transition-all ${
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
                        className={`text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
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
              )}

              {/* ── Step 3: Confirm ── */}
              {step === 3 && (
                <div className="space-y-3">
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-2 text-sm">
                    {[
                      { label: 'Full Name', value: `${firstName} ${lastName}` },
                      { label: 'Date of Birth', value: dob || 'Not provided' },
                      { label: 'Gender', value: gender || 'Not provided' },
                      { label: 'Class', value: selectedClass?.name ?? 'Unassigned' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-semibold text-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">An admission number will be auto-generated upon enrollment.</p>
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
                    Next <ChevronRight className="w-4 h-4" />
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
