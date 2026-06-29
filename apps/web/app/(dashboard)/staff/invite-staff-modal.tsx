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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="w-5 h-5 text-blue-600" />
            Invite Staff Member
          </DialogTitle>
        </DialogHeader>

        {!inviteUrl ? (
          <div className="space-y-4 pt-2">
            {/* Role picker */}
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                {ROLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRole(opt.value)}
                    className={`text-left px-3 py-2.5 rounded-xl border transition-all text-sm ${
                      role === opt.value
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-600'
                        : 'border-border hover:border-blue-300'
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

            <div className="flex gap-3 pt-1">
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
          <div className="space-y-4 pt-2">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <p className="font-semibold text-foreground">Invite link generated!</p>
              <p className="text-sm text-muted-foreground">
                Share this link with <strong>{fullName}</strong> via WhatsApp. They will click it and verify their phone number to activate their portal.
              </p>
            </div>

            <div className="bg-muted rounded-xl p-3 space-y-2">
              <p className="text-xs font-mono break-all text-foreground">{inviteUrl}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={handleCopy}
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Hi ${fullName}, here is your EduTrack portal access link: ${inviteUrl}`)}`, '_blank')}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  WhatsApp
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              This link is permanent — they can bookmark it to log in again anytime.
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
