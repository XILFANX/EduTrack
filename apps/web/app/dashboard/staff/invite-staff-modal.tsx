'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { inviteStaff, getClasses, getUnoccupiedSubjects, type StaffRole } from './actions'
import { Copy, Check, UserPlus } from 'lucide-react'
import { FileUpload } from '@/components/ui/file-upload'

const ROLE_OPTIONS: { value: StaffRole; label: string; desc: string }[] = [
  { value: 'class_teacher',    label: 'Class Teacher',    desc: 'Manages a specific class, onboards parents' },
  { value: 'subject_teacher',  label: 'Subject Teacher',  desc: 'Enters grades for assigned subjects' },
  { value: 'bursar',           label: 'Bursar',           desc: 'Manages fees, M-Pesa, and invoices' },
  { value: 'librarian',        label: 'Librarian',        desc: 'Manages books and library fines' },
  { value: 'storekeeper',      label: 'Storekeeper',      desc: 'Logs kitchen and stationery inventory' },
  { value: 'transport_matron', label: 'Transport Matron', desc: 'Manages bus routes and boarding logs' },
]

const ROLE_LABEL: Record<string, string> = {
  class_teacher:    'Class Teacher',
  subject_teacher:  'Subject Teacher',
  bursar:           'Bursar',
  librarian:        'Librarian',
  storekeeper:      'Storekeeper',
  transport_matron: 'Transport Matron',
}

const SALUTATIONS = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.', 'Mdm.', 'Rev.']

interface InviteStaffModalProps {
  open: boolean
  onClose: () => void
  schoolId: string
  onSuccess: () => void
}

export function InviteStaffModal({ open, onClose, schoolId, onSuccess }: InviteStaffModalProps) {
  const [salutation, setSalutation]   = useState<string>(SALUTATIONS[0])
  const [fullName, setFullName]       = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [role, setRole]               = useState<StaffRole>('class_teacher')
  const [classId, setClassId]         = useState<string>('')
  const [classSubjectId, setClassSubjectId] = useState<string>('')
  const [classes, setClasses]         = useState<{ id: string; name: string }[]>([])
  const [unoccupiedSubjects, setUnoccupiedSubjects] = useState<{ id: string; label: string }[]>([])
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [result, setResult]           = useState<{ url: string; schoolName: string; className?: string } | null>(null)
  const [copied, setCopied]           = useState(false)
  const [photoUrl, setPhotoUrl]       = useState<string | null>(null)

  // Load classes whenever modal opens or role changes to class_teacher
  useEffect(() => {
    if (open) {
      if (role === 'class_teacher') getClasses(schoolId).then(setClasses)
      if (role === 'subject_teacher') getUnoccupiedSubjects(schoolId).then(setUnoccupiedSubjects)
    }
  }, [open, role, schoolId])

  function handleClose() {
    setSalutation(SALUTATIONS[0])
    setFullName('')
    setPhoneNumber('')
    setRole('class_teacher')
    setClassId('')
    setClassSubjectId('')
    setError(null)
    setResult(null)
    setCopied(false)
    setPhotoUrl(null)
    onClose()
  }

  async function handleInvite() {
    if (!fullName.trim()) { setError("Please enter the staff member's full name."); return }
    if (!phoneNumber.trim()) { setError('Please enter their phone number.'); return }

    setLoading(true)
    setError(null)

    const res = await inviteStaff({ salutation, fullName, phoneNumber, role, schoolId,
      classId: role === 'class_teacher' ? classId : undefined,
      classSubjectId: role === 'subject_teacher' ? classSubjectId : undefined,
      photoUrl: photoUrl || undefined
    })
    setLoading(false)

    if ('error' in res) {
      setError(res.error)
    } else {
      const baseUrl = window.location.origin
      setResult({
        url: `${baseUrl}/invite/${res.token}`,
        schoolName: res.schoolName,
        className: res.className,
      })
      onSuccess()
    }
  }

  async function handleCopy() {
    if (!result) return
    await navigator.clipboard.writeText(result.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  function buildWhatsAppMessage() {
    if (!result) return ''
    const roleLabel = ROLE_LABEL[role] ?? role
    const displayName = `${salutation} ${fullName}`
    let msg = `Hello ${displayName}! 👋\n\n`
    msg += `You have been invited to join *${result.schoolName}* on EduTrack as a *${roleLabel}*`
    if (role === 'class_teacher' && result.className) {
      msg += ` for *${result.className}*`
    }
    msg += `.\n\n`
    msg += `Click the link below to set up your account:\n${result.url}\n\n`
    msg += `_This link is permanent and does not expire._`
    return msg
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            Invite Staff Member
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-6 pb-6 pt-4">

        {!result ? (
          <div className="space-y-4">
            {/* Role Selector */}
            <div className="space-y-2">
              <Label>Role *</Label>
              <div className="grid grid-cols-1 gap-2">
                {ROLE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setRole(opt.value); setClassId('') }}
                    className={`text-left px-3 py-2 rounded-xl border transition-all text-sm ${
                      role === opt.value
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-600'
                        : 'border-slate-200 dark:border-slate-800 hover:border-blue-300'
                    }`}
                  >
                    <p className="font-semibold text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Class picker — only for class_teacher */}
            {role === 'class_teacher' && (
              <div className="space-y-2">
                <Label htmlFor="staffClass">Assign to class <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                {classes.length === 0 ? (
                  <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg px-3 py-2">
                    No classes found. You can invite the teacher now and assign a class later.
                  </p>
                ) : (
                  <select
                    id="staffClass"
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full bg-background border border-input text-foreground rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  >
                    <option value="">Select a class…</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Subject picker — only for subject_teacher */}
            {role === 'subject_teacher' && (
              <div className="space-y-2">
                <Label htmlFor="staffSubject">Assign Subject <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                {unoccupiedSubjects.length === 0 ? (
                  <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg px-3 py-2">
                    No unoccupied subjects found. You can invite the teacher now and assign them subjects later.
                  </p>
                ) : (
                  <select
                    id="staffSubject"
                    value={classSubjectId}
                    onChange={(e) => setClassSubjectId(e.target.value)}
                    className="w-full bg-background border border-input text-foreground rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  >
                    <option value="">Select an unoccupied subject…</option>
                    {unoccupiedSubjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.label}</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Salutation + Full Name */}
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <div className="flex gap-2">
                <select
                  value={salutation}
                  onChange={e => setSalutation(e.target.value)}
                  className="w-24 bg-background border border-input text-foreground rounded-xl px-2 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition shrink-0"
                >
                  {SALUTATIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <Input
                  id="staffName"
                  placeholder="e.g. Grace Wanjiku"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="flex-1"
                />
              </div>
              {salutation && fullName && (
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Will be addressed as: <strong>{salutation} {fullName}</strong>
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="staffPhone">Phone Number *</Label>
              <Input
                id="staffPhone"
                type="tel"
                placeholder="+254 7XX XXX XXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                They will verify this number to activate their portal.
              </p>
            </div>

            {/* Photo Upload (Optional) */}
            <div className="space-y-2">
              <Label>Profile Photo <span className="text-muted-foreground font-normal">(Optional)</span></Label>
              {photoUrl ? (
                <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <img src={photoUrl} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 dark:border-slate-600" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Photo uploaded</p>
                    <p className="text-xs text-muted-foreground">Will be shown on their profile.</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setPhotoUrl(null)} className="text-red-500 hover:text-red-600">Remove</Button>
                </div>
              ) : (
                <FileUpload
                  bucket="student-photos"
                  folder={`staff/${schoolId}`}
                  maxFiles={1}
                  accept="image/*"
                  onUploadSuccess={(urls) => setPhotoUrl(urls[0])}
                  onUploadError={(err) => setError(`Photo upload failed: ${err.message}`)}
                />
              )}
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg border border-red-200 dark:border-red-900/50">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handleInvite}
                disabled={loading}
              >
                {loading ? 'Generating link…' : 'Generate Invite Link'}
              </Button>
            </div>
          </div>
        ) : (
          /* ── Success: Invite link created ── */
          <div className="space-y-5 pt-1">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
                <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="font-bold text-xl text-foreground">Invite link created!</p>
              <p className="text-sm text-muted-foreground">
                Share this link with <strong>{salutation} {fullName}</strong>. They'll use it to set up their account.
              </p>
            </div>

            {/* Link display box */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Permanent Invite Link</p>
              <p className="text-xs font-mono break-all text-foreground select-all leading-relaxed">{result.url}</p>
            </div>

            {/* Actions */}
            <div className="space-y-2.5">
              <button
                onClick={handleCopy}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>

              <Button variant="outline" className="w-full h-11" onClick={handleClose}>
                Back to Dashboard
              </Button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(buildWhatsAppMessage())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-11 flex items-center justify-center gap-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] active:bg-[#1aad50] text-white font-semibold text-sm transition-colors"
              >
                {/* WhatsApp circle logo */}
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white shrink-0" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.38 1.25 4.79L2.05 22l5.5-1.44c1.37.73 2.92 1.15 4.49 1.15h.01C17.5 21.71 22 17.26 22 11.8c0-2.66-1.04-5.17-2.92-7.05A9.93 9.93 0 0012.04 2zm0 1.67c2.24 0 4.35.87 5.94 2.46a8.33 8.33 0 012.45 5.68c0 4.59-3.74 8.32-8.34 8.32a8.33 8.33 0 01-4.23-1.15l-.3-.18-3.14.82.84-3.07-.2-.32a8.28 8.28 0 01-1.27-4.42c0-4.6 3.74-8.34 8.25-8.34zm-2.78 4.4c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.09s.9 2.43 1.02 2.6c.13.17 1.77 2.7 4.28 3.68.6.26 1.07.41 1.43.52.6.19 1.15.16 1.58.1.48-.07 1.48-.61 1.69-1.19.21-.58.21-1.08.15-1.19-.06-.1-.23-.16-.48-.28-.25-.13-1.48-.73-1.71-.81-.23-.09-.4-.13-.56.13-.17.25-.64.81-.79.98-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25a7.58 7.58 0 01-1.4-1.74c-.15-.25-.02-.39.11-.51.12-.11.25-.29.38-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.36-.77-1.86-.2-.49-.4-.42-.56-.43h-.48z"/>
                </svg>
                Share via WhatsApp
              </a>
            </div>

            <p className="text-center text-xs text-muted-foreground italic">
              This link is permanent — it won't expire. The same link can be used to log in again in the future.
            </p>
          </div>
        )}
        </div>{/* end scroll wrapper */}
      </DialogContent>
    </Dialog>
  )
}
