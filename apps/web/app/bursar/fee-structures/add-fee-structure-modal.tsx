'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createFeeStructure } from './actions'
import { BookOpen } from 'lucide-react'

interface Term {
  id: string
  name: string
}

interface ClassRecord {
  id: string
  name: string
}

interface AddFeeStructureModalProps {
  open: boolean
  onClose: () => void
  schoolId: string
  terms: Term[]
  classes: ClassRecord[]
}

export function AddFeeStructureModal({ open, onClose, schoolId, terms, classes }: AddFeeStructureModalProps) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [termId, setTermId] = useState<string>('')
  const [classId, setClassId] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Use the active term by default if possible
  if (!termId && terms.length > 0) {
    setTermId(terms[0].id)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) { setError('Description is required'); return }
    if (!amount || isNaN(Number(amount))) { setError('Valid amount is required'); return }
    if (!termId) { setError('Term is required'); return }

    setLoading(true)
    setError(null)

    const res = await createFeeStructure({
      schoolId,
      termId,
      classId: classId === 'all' ? null : classId,
      amount: Number(amount),
      description,
    })

    setLoading(false)

    if (res.error) {
      setError(res.error)
    } else {
      setDescription('')
      setAmount('')
      setClassId('all')
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            Add Fee Structure
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              placeholder="e.g. Term 1 Tuition Fee"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (KES) *</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              placeholder="e.g. 15000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Academic Term *</Label>
              <Select value={termId} onValueChange={setTermId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Class (Optional)</Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg border border-red-200 dark:border-red-900/50">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              disabled={loading}
            >
              {loading ? 'Saving…' : 'Save Structure'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
