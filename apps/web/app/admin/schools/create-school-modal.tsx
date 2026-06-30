'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Loader2 } from 'lucide-react'
import { createSchool } from './actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function CreateSchoolModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [curriculum, setCurriculum] = useState('8-4-4')
  const [tier, setTier] = useState('Trial')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!name.trim()) {
      setError('School name is required')
      return
    }

    setLoading(true)
    const res = await createSchool({
      name: name.trim(),
      domain: domain.trim() || undefined,
      curriculumType: curriculum,
      subscriptionPlan: tier
    })
    setLoading(false)

    if (res.error) {
      setError(res.error)
    } else {
      toast.success('School registered successfully')
      router.refresh()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-foreground">Register New School</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">School Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. St. Patrick's Academy"
              className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Custom Domain (Optional)</label>
            <input
              type="text"
              value={domain}
              onChange={e => setDomain(e.target.value)}
              placeholder="e.g. stpatricks.ac.ke"
              className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Curriculum</label>
              <select
                value={curriculum}
                onChange={e => setCurriculum(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              >
                <option value="8-4-4">8-4-4 (Numeric)</option>
                <option value="CBC">CBC (Competency)</option>
                <option value="IGCSE">IGCSE</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Plan</label>
              <select
                value={tier}
                onChange={e => setTier(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              >
                <option value="Trial">Trial (50)</option>
                <option value="Basic">Basic (300)</option>
                <option value="Standard">Standard (800)</option>
                <option value="Premium">Premium (Unltd)</option>
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2 mt-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Register School
          </Button>
        </form>
      </div>
    </div>
  )
}
