'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Power, ShieldAlert, CalendarRange, X, CheckCircle2 } from 'lucide-react'
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

export function SessionsClient({ initialYears, initialTerms }: { initialYears: AcademicYear[], initialTerms: AcademicTerm[] }) {
  const router = useRouter()
  const [years, setYears] = useState(initialYears)
  const [terms, setTerms] = useState(initialTerms)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [showYearModal, setShowYearModal] = useState(false)
  const [showTermModalFor, setShowTermModalFor] = useState<string | null>(null)

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
      const res = await createAcademicYear(name, startDate, endDate)
      if (res.error) throw new Error(res.error)
      if (!res.data) throw new Error('No data returned')
      setYears([res.data, ...years])
      resetForm()
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to create year')
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
      const res = await createAcademicTerm(showTermModalFor, name, startDate, endDate)
      if (res.error) throw new Error(res.error)
      if (!res.data) throw new Error('No data returned')
      setTerms([...terms, res.data])
      resetForm()
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to create term')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (id: string, type: 'year' | 'term', activate: boolean) => {
    if (!activate) {
      alert('To deactivate this session, simply activate another session instead.')
      return
    }

    if (!confirm(`Are you sure you want to activate this ${type}? This will deactivate any currently active session and broadcast a notification.`)) return
    
    setLoadingId(id)
    setError(null)
    try {
      let yrId = id
      let tmId: string | undefined = undefined

      if (type === 'term') {
        const t = terms.find(x => x.id === id)
        if (!t || !t.year_id) throw new Error("Term or year missing")
        yrId = t.year_id
        tmId = id
      }

      const res = await toggleActiveSession(yrId, tmId)
      if (res.error) throw new Error(res.error)
      
      setYears(years.map(y => ({ ...y, is_active: y.id === yrId })))
      if (type === 'term') {
        setTerms(terms.map(t => ({ ...t, is_active: t.id === tmId })))
      } else {
        setTerms(terms.map(t => ({ ...t, is_active: false })))
      }
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to toggle status')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Active Session Status */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[50px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-blue-200" />
              <h2 className="text-lg font-bold">Currently Active Session</h2>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black tracking-tight">{activeYear ? activeYear.name : 'No Active Year'}</span>
              <span className="text-blue-200 font-medium">— {activeTerm ? activeTerm.name : 'No Active Term'}</span>
            </div>
          </div>
          <button 
            onClick={() => setShowYearModal(true)}
            className="shrink-0 bg-white/20 hover:bg-white/30 text-white border border-white/30 transition-colors px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 backdrop-blur-md"
          >
            <Plus className="w-4 h-4" /> New Academic Year
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {years.map(year => {
          const yearTerms = terms.filter(t => t.year_id === year.id)
          
          return (
            <div key={year.id} className={`bg-white dark:bg-slate-900/50 border ${year.is_active ? 'border-blue-500/50 shadow-md ring-1 ring-blue-500/20' : 'border-slate-200 dark:border-slate-800 shadow-sm'} rounded-3xl overflow-hidden transition-all`}>
              <div className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b ${year.is_active ? 'border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/5' : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20'}`}>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-foreground">{year.name}</h3>
                    {year.is_active && (
                      <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest">
                        Active Year
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(year.start_date).toLocaleDateString()} — {new Date(year.end_date).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex items-center gap-3 shrink-0">
                  <button 
                    onClick={() => setShowTermModalFor(year.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Term
                  </button>
                  <button 
                    onClick={() => handleToggle(year.id, 'year', !year.is_active)}
                    disabled={loadingId === year.id}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors border ${
                      year.is_active 
                        ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20' 
                        : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
                    } disabled:opacity-50`}
                    title={year.is_active ? "Deactivate Year" : "Activate Year"}
                  >
                    {loadingId === year.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {yearTerms.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {yearTerms.map(term => (
                    <div key={term.id} className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-1.5 h-12 rounded-full ${term.is_active ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-foreground">{term.name}</h4>
                            {term.is_active && (
                              <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(term.start_date).toLocaleDateString()} — {new Date(term.end_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleToggle(term.id, 'term', !term.is_active)}
                        disabled={loadingId === term.id}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors border ${
                          term.is_active 
                            ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-500 hover:border-rose-200 dark:hover:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-900/20' 
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-emerald-600 hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                        } disabled:opacity-50`}
                      >
                        {loadingId === term.id ? 'Updating...' : term.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No terms created for this year yet.
                </div>
              )}
            </div>
          )
        })}
        {years.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 mx-auto flex items-center justify-center mb-4">
              <CalendarRange className="w-8 h-8 text-blue-500" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">No Academic Years</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
              Get started by creating your first academic year.
            </p>
          </div>
        )}
      </div>

      {/* Creation Modal */}
      {(showYearModal || showTermModalFor) && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="font-bold text-lg text-foreground">
                Create {showYearModal ? 'Academic Year' : 'Academic Term'}
              </h2>
              <button onClick={resetForm} className="p-2 -mr-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={showYearModal ? handleCreateYear : handleCreateTerm} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={showYearModal ? "e.g., 2024/2025" : "e.g., Term 1"}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
                  />
                </div>
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center transition-colors disabled:opacity-50 shadow-sm"
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
