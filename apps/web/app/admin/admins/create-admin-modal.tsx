'use client'
import { UX } from '@/lib/ux'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Loader2 } from 'lucide-react'
import { addSubAdmin } from './actions'
import { useRouter } from 'next/navigation'

export function CreateAdminModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!fullName.trim() || !email.trim() || !phoneNumber.trim()) {
      setError('All fields are required')
      return
    }

    setLoading(true)
    const res = await addSubAdmin({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phoneNumber: phoneNumber.trim()
    })
    setLoading(false)

    if (res.error) {
      setError(res.error)
    } else {
      UX.successModal({ title: 'Sub-admin added successfully. They can now log in.' })
      router.refresh()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#060d1a] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-[#1a2744]">
          <h2 className="text-lg font-bold text-foreground">Add Platform Admin</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#0d1b2e] flex items-center justify-center text-slate-500 hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="e.g. Jane Doe"
              className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-[#1a2744] bg-slate-50 dark:bg-[#060d1a] text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. jane@edutrack.com"
              className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-[#1a2744] bg-slate-50 dark:bg-[#060d1a] text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Phone Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
              placeholder="e.g. 0712345678"
              className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-[#1a2744] bg-slate-50 dark:bg-[#060d1a] text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button disabled={loading} className="w-full bg-[#1D6FEB] hover:bg-[#1558C8] gap-2 mt-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Grant Access
          </Button>
        </form>
      </div>
    </div>
  )
}
