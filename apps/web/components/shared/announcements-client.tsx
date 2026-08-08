'use client'

import { useState } from 'react'
import { broadcastAnnouncement } from '@/app/actions/chat'
import { Loader2 } from 'lucide-react'

interface AudienceOption {
  value: string
  label: string
}

interface Props {
  audienceOptions: AudienceOption[]
  defaultAudience?: string
  subjectPlaceholder?: string
}

export function AnnouncementsClient({ audienceOptions, defaultAudience, subjectPlaceholder = "e.g. Important Update" }: Props) {
  const [target, setTarget] = useState(defaultAudience || audienceOptions[0]?.value || 'all')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<{type: 'success' | 'error', text: string} | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setStatus(null)

    try {
      await broadcastAnnouncement(title, body, target)
      setStatus({ type: 'success', text: 'Announcement broadcasted successfully!' })
      setTitle('')
      setBody('')
    } catch (err: any) {
      setStatus({ type: 'error', text: err.message || 'A network error occurred.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {status && (
        <div className={`p-3 rounded-xl text-sm font-medium ${status.type === 'success' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-red-500/10 text-red-500 dark:text-red-400'}`}>
          {status.text}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Target Audience</label>
        <select 
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="w-full bg-[#0b0f19] border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
        >
          {audienceOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Announcement Title</label>
        <input 
          type="text" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={subjectPlaceholder}
          required
          className="w-full bg-[#0b0f19] border border-slate-700 text-slate-200 placeholder:text-slate-600 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Message Body</label>
        <textarea 
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type the details here..."
          required
          rows={4}
          className="w-full bg-[#0b0f19] border border-slate-700 text-slate-200 placeholder:text-slate-600 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
        />
      </div>

      <button 
        type="submit" 
        disabled={submitting || !title || !body}
        className="w-full bg-[#1D6FEB] hover:bg-[#1558C8] text-white font-semibold py-2.5 rounded-xl transition-all shadow-md disabled:opacity-50 flex justify-center items-center h-11"
      >
        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Broadcast'}
      </button>
    </form>
  )
}
