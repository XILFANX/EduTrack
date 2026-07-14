'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BookMarked, Info } from 'lucide-react'
import { createSubject } from './actions'
import { getClasses } from '../classes/actions'
import { toast } from 'sonner'

interface AddSubjectModalProps {
  open: boolean
  onClose: () => void
  schoolId: string
  onSuccess: () => void
}

export function AddSubjectModal({ open, onClose, schoolId, onSuccess }: AddSubjectModalProps) {
  const [name, setName] = useState('')
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      getClasses(schoolId).then(setClasses)
    }
  }, [open, schoolId])

  function handleClose() {
    setName(''); setSelectedClassIds([]); setError(null)
    onClose()
  }

  function toggleClass(id: string) {
    setSelectedClassIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  async function handleSave() {
    setLoading(true); setError(null)
    if (!name.trim()) { setError('Subject name is required.'); setLoading(false); return }
    const res = await createSubject(schoolId, name, selectedClassIds)
    setLoading(false)
    if (res.error) { setError(res.error) }
    else {
      toast.success(`"${name.trim()}" saved successfully!`)
      onSuccess()
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
            <Label>
              Assign to Classes <span className="text-muted-foreground font-normal">(Select multiple)</span>
            </Label>
            {classes.length === 0 ? (
              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg px-3 py-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0" />
                No classes yet. You can create the subject now and assign it later.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl">
                {classes.map(c => (
                  <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-lg transition">
                    <input
                      type="checkbox"
                      checked={selectedClassIds.includes(c.id)}
                      onChange={() => toggleClass(c.id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="truncate">{c.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/10 p-2 rounded-lg">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={handleClose} disabled={loading} className="rounded-xl">Cancel</Button>
          <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700 rounded-xl min-w-[100px]">
            {loading ? 'Saving...' : 'Save Subject'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
