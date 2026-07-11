'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, CheckCircle2, UserPlus, Copy } from 'lucide-react'
import { inviteParent } from './actions'

interface InviteParentModalProps {
  open: boolean
  onClose: () => void
  studentId: string
  studentName: string
  schoolId: string
  onSuccess?: () => void
}

const SALUTATIONS = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.']

export function InviteParentModal({ open, onClose, studentId, studentName, schoolId, onSuccess }: InviteParentModalProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [salutation, setSalutation] = useState('')
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Success state
  const [inviteToken, setInviteToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function handleClose() {
    setStep(1)
    setSalutation('')
    setFullName('')
    setPhoneNumber('')
    setError(null)
    setInviteToken(null)
    setCopied(false)
    onClose()
  }

  async function handleGenerateInvite() {
    setError(null)
    if (!salutation || !fullName || !phoneNumber) {
      setError('Please fill in all fields.')
      return
    }

    setLoading(true)
    const res = await inviteParent({
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      salutation,
      studentId,
      schoolId
    })
    setLoading(false)

    if ('error' in res && res.error) {
      setError(res.error)
    } else if (res.token) {
      setInviteToken(res.token)
      setStep(2)
      if (onSuccess) onSuccess()
    }
  }

  function handleCopy() {
    if (!inviteToken) return
    const link = `${window.location.origin}/invite/${inviteToken}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl">
        {step === 1 ? (
          <>
            <DialogHeader className="mb-4">
              <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                Invite Parent
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Generate an invite link for <strong>{studentName}</strong>'s parent or guardian.
              </p>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1 space-y-1.5">
                  <Label>Salutation *</Label>
                  <select 
                    value={salutation} 
                    onChange={e => setSalutation(e.target.value)}
                    className="w-full bg-background border border-input text-foreground rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  >
                    <option value="">Select</option>
                    {SALUTATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                
                <div className="col-span-2 space-y-1.5">
                  <Label>Full Name *</Label>
                  <Input 
                    placeholder="e.g. John Doe" 
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Phone Number (WhatsApp) *</Label>
                <Input 
                  placeholder="e.g. 0712345678" 
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">Used for OTP password resets.</p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-xl">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button variant="outline" className="flex-1" onClick={handleClose} disabled={loading}>
                  Cancel
                </Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleGenerateInvite} disabled={loading}>
                  {loading ? 'Generating...' : 'Generate Invite'}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-4 space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground">Invite Link Ready</h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Share this link with {salutation} {fullName}. They can use it to create their parent account and view {studentName}'s progress.
              </p>
            </div>

            <div className="flex items-center gap-2 max-w-sm mx-auto">
              <div className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-500 font-mono truncate">
                {window.location.origin}/invite/{inviteToken}
              </div>
              <Button size="icon" variant="outline" onClick={handleCopy} className="shrink-0 h-10 w-10">
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>

            <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white" onClick={handleClose}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
