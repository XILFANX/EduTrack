'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, BookOpen, Layers, Info, CheckCircle2 } from 'lucide-react'
import { createClass, createBulkClasses, getTeachers } from './actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface AddClassModalProps {
  open: boolean
  onClose: () => void
  schoolId: string
  curriculumType: string
}

export function AddClassModal({ open, onClose, schoolId, curriculumType }: AddClassModalProps) {
  const router = useRouter()
  const [mode, setMode] = useState<'single' | 'bulk'>('single')

  // Single mode state
  const [name, setName] = useState('')
  const [stream, setStream] = useState('') // e.g. "East", "Red", "North"
  const [teacherId, setTeacherId] = useState('')

  // Bulk mode state
  const [selectedBulk, setSelectedBulk] = useState<string[]>([])
  const [bulkStreams, setBulkStreams] = useState('') // comma-separated, e.g. "East, West"

  // Shared state
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
    setStream('')
    setTeacherId('')
    setSelectedBulk([])
    setBulkStreams('')
    setError(null)
    setMode('single')
    onClose()
  }

  // Predefined grades based on curriculum
  const getBulkOptions = () => {
    switch (curriculumType.toLowerCase()) {
      case 'cbc':
        return ['Playgroup', 'PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9']
      case '844':
      case '8-4-4':
        return ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Form 1', 'Form 2', 'Form 3', 'Form 4']
      case 'igcse':
        return ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12', 'Year 13']
      default:
        return ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8']
    }
  }

  const bulkOptions = getBulkOptions()

  function toggleBulkOption(option: string) {
    setSelectedBulk(prev =>
      prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]
    )
  }

  // Build final class names factoring in streams
  function buildBulkNames(): string[] {
    const rawStreams = bulkStreams
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    if (rawStreams.length === 0) return selectedBulk

    const names: string[] = []
    for (const grade of selectedBulk) {
      for (const s of rawStreams) {
        names.push(`${grade} ${s}`)
      }
    }
    return names
  }

  // Preview of generated names (max 5 shown)
  const bulkPreview = mode === 'bulk' && selectedBulk.length > 0 ? buildBulkNames() : []

  async function handleSave() {
    setLoading(true)
    setError(null)

    if (mode === 'single') {
      if (!name.trim()) {
        setError('Class name is required.')
        setLoading(false)
        return
      }
      // Combine name + stream
      const fullName = stream.trim() ? `${name.trim()} ${stream.trim()}` : name.trim()
      const res = await createClass(schoolId, fullName, teacherId || undefined)
      if (res.error) {
        setError(res.error)
      } else {
        toast.success(`Class "${fullName}" created!`)
        router.refresh()
        handleClose()
      }
    } else {
      if (selectedBulk.length === 0) {
        setError('Please select at least one class to add.')
        setLoading(false)
        return
      }
      const names = buildBulkNames()
      const res = await createBulkClasses(schoolId, names)
      if (res.error) {
        setError(res.error)
      } else {
        toast.success(`${names.length} class${names.length !== 1 ? 'es' : ''} created successfully!`)
        router.refresh()
        handleClose()
      }
    }
    setLoading(false)
  }

  const currLabel = curriculumType.toUpperCase()

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            Add Class
          </DialogTitle>
        </DialogHeader>

        {/* Mode Toggle */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4">
          <button
            type="button"
            className={`flex-1 text-sm font-medium py-1.5 rounded-lg transition-all flex items-center justify-center gap-2 ${mode === 'single' ? 'bg-white dark:bg-slate-900 shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setMode('single')}
          >
            <Plus className="w-4 h-4" /> Single
          </button>
          <button
            type="button"
            className={`flex-1 text-sm font-medium py-1.5 rounded-lg transition-all flex items-center justify-center gap-2 ${mode === 'bulk' ? 'bg-white dark:bg-slate-900 shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setMode('bulk')}
          >
            <Layers className="w-4 h-4" /> Bulk Auto-Generate
          </button>
        </div>

        <div className="space-y-4">
          {mode === 'single' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="className">Class Name *</Label>
                <Input
                  id="className"
                  placeholder={curriculumType.toLowerCase() === 'cbc' ? 'e.g. Grade 4' : 'e.g. Form 1'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="classStream">
                  Stream <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Input
                  id="classStream"
                  placeholder="e.g. East, Red, Blue, North…"
                  value={stream}
                  onChange={(e) => setStream(e.target.value)}
                />
                {name.trim() && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Will be saved as: <strong>{stream.trim() ? `${name.trim()} ${stream.trim()}` : name.trim()}</strong>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="classTeacher">Assign Class Teacher <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                <select
                  id="classTeacher"
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full bg-background border border-input text-foreground rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  <option value="">None</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.salutation ? `${t.salutation} ${t.full_name}` : t.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select classes ({currLabel} curriculum)</Label>
                <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                  {bulkOptions.map(opt => (
                    <label key={opt} className="flex items-center gap-2 p-2 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedBulk.includes(opt)}
                        onChange={() => toggleBulkOption(opt)}
                      />
                      <span className="text-sm font-medium">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulkStreams">
                  Add streams to all? <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Input
                  id="bulkStreams"
                  placeholder="e.g. East, West  or  Red, Blue, Green"
                  value={bulkStreams}
                  onChange={(e) => setBulkStreams(e.target.value)}
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="w-3 h-3 shrink-0" />
                  Separate streams with commas. Each grade × each stream = one class.
                </p>
              </div>

              {/* Preview */}
              {bulkPreview.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-500/20 rounded-xl px-3 py-2.5">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1.5">
                    Will create {bulkPreview.length} class{bulkPreview.length !== 1 ? 'es' : ''}:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {bulkPreview.slice(0, 8).map(n => (
                      <span key={n} className="text-xs bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700/50 text-foreground px-2 py-0.5 rounded-lg">
                        {n}
                      </span>
                    ))}
                    {bulkPreview.length > 8 && (
                      <span className="text-xs text-muted-foreground">+{bulkPreview.length - 8} more…</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

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
              {loading
                ? 'Saving…'
                : mode === 'single'
                  ? 'Create Class'
                  : `Generate ${buildBulkNames().length} Class${buildBulkNames().length !== 1 ? 'es' : ''}`
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
