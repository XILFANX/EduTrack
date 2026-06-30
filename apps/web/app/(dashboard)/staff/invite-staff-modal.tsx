'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { inviteStaff, type StaffRole } from './actions'
import { Copy, Check, UserPlus, ExternalLink } from 'lucide-react'

const ROLE_OPTIONS: { value: StaffRole; label: string; desc: string }[] = [
  { value: 'class_teacher', label: 'Class Teacher', desc: 'Manages a specific class, onboards parents' },
  { value: 'subject_teacher', label: 'Subject Teacher', desc: 'Enters grades for assigned subjects' },
  { value: 'bursar', label: 'Bursar', desc: 'Manages fees, M-Pesa, and invoices' },
  { value: 'librarian', label: 'Librarian', desc: 'Manages books and library fines' },
  { value: 'storekeeper', label: 'Storekeeper', desc: 'Logs kitchen and stationery inventory' },
  { value: 'transport_matron', label: 'Transport Matron', desc: 'Manages bus routes and boarding logs' },
]

interface InviteStaffModalProps {
  open: boolean
  onClose: () => void
  schoolId: string
  onSuccess: () => void
}

export function InviteStaffModal({ open, onClose, schoolId, onSuccess }: InviteStaffModalProps) {
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [role, setRole] = useState<StaffRole>('class_teacher')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function handleClose() {
    setFullName('')
    setPhoneNumber('')
    setRole('class_teacher')
    setError(null)
    setInviteUrl(null)
    setCopied(false)
    onClose()
  }

  async function handleInvite() {
    if (!fullName.trim()) { setError('Please enter the staff member\'s full name.'); return }
    if (!phoneNumber.trim()) { setError('Please enter their phone number.'); return }
    setLoading(true)
    setError(null)

    const res = await inviteStaff({ fullName, phoneNumber, role, schoolId })
    setLoading(false)

    if ('error' in res) {
      setError(res.error)
    } else {
      const baseUrl = window.location.origin
      setInviteUrl(`${baseUrl}/invite/${res.token}`)
      onSuccess()
    }
  }

  async function handleCopy() {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
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

        {!inviteUrl ? (
          <div className="space-y-4">
            {/* Role picker */}
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1">
                {ROLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRole(opt.value)}
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
                Share this link with <strong>{fullName}</strong> via WhatsApp. They will click it and verify their phone number to activate their portal.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Access Link</p>
              <p className="text-xs font-mono break-all text-foreground select-all">{inviteUrl}</p>
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
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5 h-8 text-xs"
                  onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Hi ${fullName}, here is your EduTrack portal access link: ${inviteUrl}`)}`, '_blank')}
                >
                  <ExternalLink className="w-3 h-3" />
                  WhatsApp
                </Button>
              </div>
            </div>

            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleClose}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
