'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BookMarked } from 'lucide-react'
import { createSubject } from './actions'
import { getTeachers } from '../classes/actions' // Reuse the getTeachers action
import { useRouter } from 'next/navigation'

interface AddSubjectModalProps {
  open: boolean
  onClose: () => void
  schoolId: string
}

export function AddSubjectModal({ open, onClose, schoolId }: AddSubjectModalProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [teachers, setTeachers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      getTeachers(schoolId).then(setTeachers)
    }
  }, [open, schoolId])

  function handleClose() {
    setName('')
    setTeacherId('')
    setError(null)
    onClose()
  }

  async function handleSave() {
    setLoading(true)
    setError(null)

    if (!name.trim()) {
      setError('Subject name is required.')
      setLoading(false)
      return
    }

    const res = await createSubject(schoolId, name, teacherId || undefined)
    setLoading(false)

    if (res.error) {
      setError(res.error)
    } else {
      router.refresh()
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
            <Input
              id="subjectName"
              placeholder="e.g. Mathematics"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subjectTeacher">Assign Default Teacher (Optional)</Label>
            <select
              id="subjectTeacher"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="w-full bg-background border border-input text-foreground rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value="">None</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.full_name}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">The primary teacher for this subject.</p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg border border-red-200 dark:border-red-900/50">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" className="flex-1" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Saving…' : 'Create Subject'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
