'use client'

import { useState, useRef } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { updateSchoolLogo } from './actions'

export function SchoolSettingsClient({ school }: { school: any }) {
  const [logoUrl, setLogoUrl] = useState<string | null>(school?.logo_url)
  const [photoUploading, setPhotoUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('Logo must be under 5 MB.'); return }
    
    setPhotoUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'jpg'
      const slug = school.name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30)
      const path = `${slug}-${Date.now()}.${ext}`
      
      const { error: upErr } = await supabase.storage
        .from('school-logos')
        .upload(path, file, { upsert: true })
        
      if (upErr) throw new Error(upErr.message)
      
      const { data: urlData } = supabase.storage.from('school-logos').getPublicUrl(path)
      const newLogoUrl = urlData.publicUrl

      const res = await updateSchoolLogo(newLogoUrl)
      if ('success' in res) {
        setLogoUrl(newLogoUrl)
      } else {
        alert(res.error)
      }
    } catch (err: any) {
      alert(`Logo upload failed: ${err.message}`)
    } finally {
      setPhotoUploading(false)
    }
  }

  const initials = school?.name
    ? school.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'SC'

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
      <div className="flex items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="w-24 h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-sm flex items-center justify-center relative overflow-hidden group">
          {logoUrl ? (
            <img src={logoUrl} alt={`${school.name} logo`} className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-bold text-slate-400 dark:text-slate-500">{initials}</span>
          )}
          <div 
            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {photoUploading ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/jpeg,image/png,image/webp" 
            onChange={handleLogoUpload} 
            disabled={photoUploading}
          />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">School Logo</h2>
          <p className="text-sm text-slate-500">Update your official school logo.</p>
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Upload new logo
          </button>
        </div>
      </div>

      <div className="space-y-5">
        <p className="text-slate-500 text-sm">Basic information about your school as registered on EduTrack.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">School Name</label>
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium text-foreground">
              {school?.name || '—'}
            </div>
          </div>
          {school?.address && (
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Address</label>
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium text-foreground">
                {school.address}
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-400 pt-2">
          To update school details, please contact EduTrack support or your system administrator.
        </p>
      </div>
    </div>
  )
}
