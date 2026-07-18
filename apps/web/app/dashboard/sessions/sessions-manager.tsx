'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Power, ShieldAlert, CalendarRange } from 'lucide-react'
import { createAcademicYear, createAcademicTerm, toggleActiveSession } from '@/app/actions/sessions'
import { Card, CardContent } from '@/components/ui/card'

interface AcademicYear {
  id: string
  name: string
  start_date: string
  end_date: string
  is_active: boolean
}

interface AcademicTerm {
  id: string
  year_id: string | null
  name: string
  start_date: string
  end_date: string
  is_active: boolean
}

export function SessionsManager({ initialYears, initialTerms }: { initialYears: AcademicYear[], initialTerms: AcademicTerm[] }) {
  const router = useRouter()
  const [years, setYears] = useState(initialYears)
  const [terms, setTerms] = useState(initialTerms)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [showYearModal, setShowYearModal] = useState(false)
  const [showTermModalFor, setShowTermModalFor] = useState<string | null>(null) // year_id

  // Form State
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const activeYear = years.find(y => y.is_active)
  const activeTerm = terms.find(t => t.is_active)

  const resetForm = () => {
    setName('')
    setStartDate('')
    setEndDate('')
    setShowYearModal(false)
    setShowTermModalFor(null)
  }

  const handleCreateYear = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const newYear = await createAcademicYear(name, startDate, endDate)
      setYears([newYear, ...years])
      resetForm()
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateTerm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showTermModalFor) return
    setSubmitting(true)
    setError(null)
    try {
      const newTerm = await createAcademicTerm(showTermModalFor, name, startDate, endDate)
      setTerms([...terms, newTerm])
      resetForm()
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleActivate = async (yearId: string, termId?: string) => {
    if (!confirm('Are you sure you want to activate this session? This will alert all staff and deactivate the current session.')) return
    
    setLoadingId(termId || yearId)
    try {
      await toggleActiveSession(yearId, termId)
      
      // Optimistically update UI
      setYears(years.map(y => ({ ...y, is_active: y.id === yearId })))
      setTerms(terms.map(t => ({ ...t, is_active: t.id === termId })))
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Current Session Banner */}
      <Card className="bg-emerald-500/10 border-emerald-500/20 shadow-none">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1">Current Active Session</p>
            {activeYear ? (
              <h2 className="text-2xl font-bold text-foreground">
                {activeYear.name} {activeTerm ? `• ${activeTerm.name}` : ''}
              </h2>
            ) : (
              <h2 className="text-2xl font-bold text-foreground text-slate-400">No Active Session</h2>
            )}
          </div>
          <ShieldAlert className="w-12 h-12 text-emerald-500/20" />
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-foreground">Academic Timeline</h2>
        <button 
          onClick={() => setShowYearModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> New Academic Year
        </button>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {years.map(year => (
          <div key={year.id} className={`p-6 rounded-3xl border transition-colors ${year.is_active ? 'border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/20' : 'border-border bg-card'}`}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-foreground flex items-center gap-3">
                  {year.name}
                  {year.is_active && <span className="bg-emerald-500 text-white text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold">Active</span>}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(year.start_date).toLocaleDateString()} — {new Date(year.end_date).toLocaleDateString()}
                </p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowTermModalFor(year.id)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-foreground text-sm font-medium rounded-full transition-colors"
                >
                  Add Term
                </button>
                {!year.is_active && (
                  <button
                    onClick={() => handleActivate(year.id)}
                    disabled={loadingId === year.id}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-sm font-medium rounded-full transition-colors"
                  >
                    {loadingId === year.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                    Activate Year
                  </button>
                )}
              </div>
            </div>

            {/* Terms inside this year */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {terms.filter(t => t.year_id === year.id).map(term => (
                <div key={term.id} className={`p-4 rounded-2xl border transition-colors ${term.is_active ? 'border-emerald-500 bg-white dark:bg-slate-900 shadow-md ring-1 ring-emerald-500' : 'border-border bg-slate-50/50 dark:bg-slate-950/50'}`}>
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-foreground">{term.name}</h4>
                    {term.is_active ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    ) : (
                      <button
                        onClick={() => handleActivate(year.id, term.id)}
                        disabled={loadingId === term.id}
                        title="Set as active term"
                        className="text-slate-400 hover:text-amber-500 transition-colors"
                      >
                        {loadingId === term.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(term.start_date).toLocaleDateString()} — {new Date(term.end_date).toLocaleDateString()}
                  </p>
                </div>
              ))}
              {terms.filter(t => t.year_id === year.id).length === 0 && (
                <div className="col-span-full text-sm text-slate-400 p-4 border border-dashed border-border rounded-2xl text-center">
                  No terms created for this year yet.
                </div>
              )}
            </div>
          </div>
        ))}

        {years.length === 0 && (
          <div className="text-center py-20 bg-card border border-border rounded-3xl">
            <CalendarRange className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground">No Academic Sessions</h3>
            <p className="text-muted-foreground mt-2">Create your first academic year to get started.</p>
          </div>
        )}
      </div>

      {/* Modal overlays for simple forms */}
      {(showYearModal || showTermModalFor) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-3xl p-6 shadow-2xl border border-border animate-in zoom-in-95">
            <h3 className="text-xl font-bold mb-4">
              {showYearModal ? 'New Academic Year' : 'New Academic Term'}
            </h3>
            <form onSubmit={showYearModal ? handleCreateYear : handleCreateTerm} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Name</label>
                <input 
                  type="text" 
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder={showYearModal ? "e.g. 2024/2025" : "e.g. Term 1"} 
                  required
                  className="w-full bg-background border border-border rounded-xl px-4 py-2 mt-1 focus:ring-2 focus:ring-blue-500/50 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Start Date</label>
                  <input 
                    type="date" 
                    value={startDate} onChange={e => setStartDate(e.target.value)} required
                    className="w-full bg-background border border-border rounded-xl px-4 py-2 mt-1 focus:ring-2 focus:ring-blue-500/50 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-muted-foreground">End Date</label>
                  <input 
                    type="date" 
                    value={endDate} onChange={e => setEndDate(e.target.value)} required
                    className="w-full bg-background border border-border rounded-xl px-4 py-2 mt-1 focus:ring-2 focus:ring-blue-500/50 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4 mt-4 border-t border-border">
                <button 
                  type="button" 
                  onClick={resetForm}
                  className="flex-1 py-2.5 rounded-xl font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl font-medium bg-blue-600 hover:bg-blue-700 text-white flex justify-center items-center transition-colors disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
