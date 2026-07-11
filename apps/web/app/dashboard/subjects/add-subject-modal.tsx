'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BookMarked, Info, CheckCircle2 } from 'lucide-react'
import { createSubject } from './actions'
import { getTeachers, getClasses } from '../classes/actions'
import { toast } from 'sonner'

interface AddSubjectModalProps {
  open: boolean
  onClose: () => void
  schoolId: string
  onSuccess: (subject: any) => void
}

export function AddSubjectModal({ open, onClose, schoolId, onSuccess }: AddSubjectModalProps) {
  const [name, setName] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [classId, setClassId] = useState('')
  const [teachers, setTeachers] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      getTeachers(schoolId).then(setTeachers)
      getClasses(schoolId).then(setClasses)
    }
  }, [open, schoolId])

  function handleClose() {
    setName(''); setTeacherId(''); setClassId(''); setError(null)
    onClose()
  }

  async function handleSave() {
    setLoading(true); setError(null)
    if (!name.trim()) { setError('Subject name is required.'); setLoading(false); return }
    const res = await createSubject(schoolId, name, teacherId || undefined, classId || undefined)
    setLoading(false)
    if (res.error) { setError(res.error) }
    else {
      toast.success(`"${name.trim()}" added successfully!`)
      onSuccess(res.data)
      handleClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <BookMarked className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            Add Subject
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subjectName">Subject Name *</Label>
            <Input id="subjectName" placeholder="e.g. Mathematics" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subjectClass">
              Assign to Class <span className="text-muted-foreground font-normal">(Optional)</span>
            </Label>
            {classes.length === 0 ? (
              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg px-3 py-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0" />
                No classes yet. You can assign a class later.
              </p>
            ) : (
              <select
                id="subjectClass"
                value={classId}
                onChange={e => setClassId(e.target.value)}
                className="w-full bg-background border border-input text-foreground rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="">None — assign later</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subjectTeacher">
              Assign Teacher <span className="text-muted-foreground font-normal">(Optional)</span>
            </Label>
            {teachers.length === 0 ? (
              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg px-3 py-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0" />
                No teachers yet. You can assign one later.
              </p>
            ) : (
              <select
                id="subjectTeacher"
                value={teacherId}
                onChange={e => setTeacherId(e.target.value)}
                className="w-full bg-background border border-input text-foreground rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="">None — assign later</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
              </select>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg border border-red-200 dark:border-red-900/50">{error}</p>
          )}

          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" className="flex-1" onClick={handleClose} disabled={loading}>Cancel</Button>
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleSave} disabled={loading}>
              {loading ? 'Saving…' : 'Create Subject'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
