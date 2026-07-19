'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Power, ShieldAlert, CalendarRange, X } from 'lucide-react'
import { createAcademicYear, createAcademicTerm, toggleActiveSession } from '@/app/actions/sessions'

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
    <div className="space-y-6 pb-24">
      
      {/* Current Session Banner */}
      <div className="bg-[#121827] border border-slate-800 rounded-2xl p-6 flex items-center justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-1">Current Active Session</p>
          {activeYear ? (
            <h2 className="text-2xl font-bold text-slate-100">
              {activeYear.name} {activeTerm ? <span className="text-slate-400 font-medium">/ {activeTerm.name}</span> : ''}
            </h2>
          ) : (
            <h2 className="text-2xl font-bold text-slate-500">No Active Session</h2>
          )}
        </div>
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 relative z-10">
          <CalendarRange className="w-6 h-6 text-blue-400" />
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800 text-red-400 p-4 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-200">Academic Timeline</h2>
        <button 
          onClick={() => setShowYearModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Academic Year
        </button>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {years.map(year => (
          <div key={year.id} className={`p-6 rounded-2xl border transition-colors ${year.is_active ? 'border-blue-500/30 bg-[#121827]' : 'border-slate-800 bg-[#0b0f19]'}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-200 flex items-center gap-3">
                  {year.name}
                  {year.is_active && <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold">Active</span>}
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  {new Date(year.start_date).toLocaleDateString()} — {new Date(year.end_date).toLocaleDateString()}
                </p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowTermModalFor(year.id)}
                  className="px-4 py-2 bg-[#1a2133] hover:bg-[#232b40] border border-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition-colors"
                >
                  Add Term
                </button>
                {!year.is_active && (
                  <button
                    onClick={() => handleActivate(year.id)}
                    disabled={loadingId === year.id}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1a2133] hover:bg-blue-600 border border-slate-700 hover:border-blue-500 text-slate-300 hover:text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 group"
                  >
                    {loadingId === year.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4 text-slate-400 group-hover:text-blue-200" />}
                    Activate
                  </button>
                )}
              </div>
            </div>

            {/* Terms List */}
            {terms.filter(t => t.year_id === year.id).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {terms.filter(t => t.year_id === year.id).map(term => (
                  <div key={term.id} className={`p-4 rounded-xl border flex flex-col justify-between transition-colors ${
                    term.is_active ? 'border-blue-500/30 bg-blue-500/5' : 'border-slate-800 bg-[#121827]'
                  }`}>
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-slate-200">{term.name}</h4>
                        {term.is_active && <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>}
                      </div>
                      <p className="text-xs text-slate-400">
                        {new Date(term.start_date).toLocaleDateString()} — {new Date(term.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    
                    {!term.is_active && year.is_active && (
                      <button
                        onClick={() => handleActivate(year.id, term.id)}
                        disabled={loadingId === term.id}
                        className="flex items-center justify-center gap-1.5 w-full py-2 bg-[#1a2133] hover:bg-blue-600 text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 border border-slate-700 hover:border-blue-500 group"
                      >
                        {loadingId === term.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-200" />}
                        Activate Term
                      </button>
                    )}
                    {term.is_active && (
                      <div className="py-2 text-center text-xs font-semibold text-blue-400 border border-blue-500/20 bg-blue-500/10 rounded-lg">
                        Currently Active
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500 italic py-4">No terms added to this year yet.</div>
            )}
          </div>
        ))}
      </div>

      {/* MODALS */}
      {(showYearModal || showTermModalFor) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#121827] border border-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="font-bold text-slate-200">
                {showYearModal ? 'Add Academic Year' : 'Add Academic Term'}
              </h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={showYearModal ? handleCreateYear : handleCreateTerm} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Name</label>
                <input 
                  type="text"
                  required
                  placeholder={showYearModal ? "e.g., 2026/2027" : "e.g., Term 1"}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-700 text-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Start Date</label>
                  <input 
                    type="date"
                    required
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-[#0b0f19] border border-slate-700 text-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">End Date</label>
                  <input 
                    type="date"
                    required
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full bg-[#0b0f19] border border-slate-700 text-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 [color-scheme:dark]"
                  />
                </div>
              </div>
              <div className="pt-2">
                <button 
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
