'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { inviteStaff, getClasses, type StaffRole } from './actions'
import { Copy, Check, UserPlus } from 'lucide-react'

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

interface InviteStaffModalProps {
  open: boolean
  onClose: () => void
  schoolId: string
  onSuccess: () => void
}

export function InviteStaffModal({ open, onClose, schoolId, onSuccess }: InviteStaffModalProps) {
  const [fullName, setFullName]       = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [role, setRole]               = useState<StaffRole>('class_teacher')
  const [classId, setClassId]         = useState<string>('')
  const [classes, setClasses]         = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [result, setResult]           = useState<{ url: string; schoolName: string; className?: string } | null>(null)
  const [copied, setCopied]           = useState(false)

  // Load classes whenever modal opens or role changes to class_teacher
  useEffect(() => {
    if (open && role === 'class_teacher') {
      getClasses(schoolId).then(setClasses)
    }
  }, [open, role, schoolId])

  function handleClose() {
    setFullName('')
    setPhoneNumber('')
    setRole('class_teacher')
    setClassId('')
    setError(null)
    setResult(null)
    setCopied(false)
    onClose()
  }

  async function handleInvite() {
    if (!fullName.trim()) { setError("Please enter the staff member's full name."); return }
    if (!phoneNumber.trim()) { setError('Please enter their phone number.'); return }
    
    setLoading(true)
    setError(null)

    const res = await inviteStaff({ fullName, phoneNumber, role, schoolId, classId: classId || undefined })
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
    let msg = `Hello ${fullName}! 👋\n\n`
    msg += `You have been invited to join *${result.schoolName}* on EduTrack as a *${roleLabel}*`
    if (role === 'class_teacher' && result.className) {
      msg += ` for *${result.className}*`
    }
    msg += `.\n\n`
    msg += `Please click the link below to create your account and access your portal:\n\n`
    msg += `${result.url}\n\n`
    msg += `_This is a permanent link — bookmark it to return anytime._`
    return msg
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            Invite Staff Member
          </DialogTitle>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            {/* Role picker */}
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="grid grid-cols-1 gap-2 max-h-44 overflow-y-auto pr-1">
                {ROLE_OPTIONS.map((opt) => (
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

            <div className="space-y-2">
              <Label htmlFor="staffName">Full name *</Label>
              <Input
                id="staffName"
                placeholder="e.g. Grace Wanjiku"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="staffPhone">Phone number *</Label>
              <Input
                id="staffPhone"
                type="tel"
                placeholder="0712 345 678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                They will verify this number to activate their portal.
              </p>
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
          /* ── Success: Show invite link ── */
          <div className="space-y-5 pt-2">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8" />
              </div>
              <p className="font-bold text-lg text-foreground">Invite link generated!</p>
              <p className="text-sm text-muted-foreground">
                Share this with <strong>{fullName}</strong>
                {role === 'class_teacher' && result.className ? (
                  <> — <strong>{ROLE_LABEL[role]}</strong> of <strong>{result.className}</strong> at <strong>{result.schoolName}</strong></>
                ) : (
                  <> — <strong>{ROLE_LABEL[role]}</strong> at <strong>{result.schoolName}</strong></>
                )}
              </p>
            </div>

            {/* Link box */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Permanent Access Link</p>
              <p className="text-xs font-mono break-all text-foreground select-all">{result.url}</p>
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5 h-8 text-xs"
                  onClick={handleCopy}
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </Button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(buildWhatsAppMessage())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 h-8 text-xs font-medium bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-md transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                  WhatsApp
                </a>
              </div>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              This link is permanent — it won&apos;t expire. The same link can be used to log in again in the future.
            </p>

            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleClose}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
