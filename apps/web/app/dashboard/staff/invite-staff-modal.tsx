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
    setSalutation(SALUTATIONS[0])
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

    const res = await inviteStaff({ salutation, fullName, phoneNumber, role, schoolId, classId: classId || undefined })
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
    msg += `_This link expires in 7 days._`
    return msg
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
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
                Share this with <strong>{salutation} {fullName}</strong>
                {role === 'class_teacher' && result.className ? (
                  <> — <strong>{ROLE_LABEL[role]}</strong> of <strong>{result.className}</strong> at <strong>{result.schoolName}</strong></>
                ) : (
                  <> — <strong>{ROLE_LABEL[role]}</strong> at <strong>{result.schoolName}</strong></>
                )}
              </p>
            </div>

            {/* Link box */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Invite Link</p>
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
                  Share via WhatsApp
                </a>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={handleClose}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
