'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { generateInvoices } from './actions'
import { Zap, AlertCircle, Check } from 'lucide-react'

interface Term { id: string; name: string; is_active?: boolean }
interface Class { id: string; name: string }

interface Props {
  open: boolean
  onClose: () => void
  schoolId: string
  terms: Term[]
  classes: Class[]
}

export function GenerateInvoicesModal({ open, onClose, schoolId, terms, classes }: Props) {
  const activeTerm = terms.find((t) => t.is_active) || terms[0]
  const [termId, setTermId] = useState(activeTerm?.id || '')
  const [classId, setClassId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null)

  function handleClose() {
    setError(null)
    setResult(null)
    onClose()
  }

  async function handleGenerate() {
    if (!termId) { setError('Select a term.'); return }
    if (!classId) { setError('Select a class.'); return }
    setLoading(true)
    setError(null)

    const res = await generateInvoices({ schoolId, termId, classId })
    setLoading(false)

    if ('error' in res) {
      setError(res.error ?? null)
    } else {
      setResult({ created: res.created ?? 0, skipped: res.skipped ?? 0 })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <Zap className="w-4 h-4 text-blue-600" />
            </div>
            Generate Invoices
          </DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8" />
            </div>
            <div>
              <p className="font-bold text-lg">Done!</p>
              <p className="text-sm text-muted-foreground mt-1">
                <span className="text-emerald-600 font-semibold">{result.created}</span> invoices created.
                {result.skipped > 0 && (
                  <span className="text-amber-500"> {result.skipped} students already had invoices and were skipped.</span>
                )}
              </p>
            </div>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={handleClose}>
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-300 flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                This will create one invoice per student in the selected class, based on all fee structures defined for the selected term. Students who already have invoices for this term will be skipped.
              </span>
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
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} {t.is_active ? '(Active)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Class *</Label>
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg border border-red-200">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? 'Generating…' : 'Generate Invoices'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
