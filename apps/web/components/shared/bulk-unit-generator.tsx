'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Layers } from 'lucide-react'

interface Props {
  propertyId: string
  landlordId: string
  onCreated: (count: number) => void
  planLimits?: { maxUnits: number, currentCount: number } | null
}

const UNIT_TYPES = ['bedsitter', '1br', '2br', '3br', 'studio', 'shop', 'office', 'other']

export function BulkUnitGenerator({ propertyId, landlordId, onCreated, planLimits }: Props) {
  const [open, setOpen] = useState(false)
  const [startNum, setStartNum] = useState(1)
  const [count, setCount] = useState(10)
  const [defaultRent, setDefaultRent] = useState('')
  const [defaultDeposit, setDefaultDeposit] = useState('')
  const [defaultType, setDefaultType] = useState('1br')
  const [prefix, setPrefix] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Preview of unit numbers
  const preview = Array.from({ length: Math.min(count, 5) }, (_, i) => `${prefix}${startNum + i}`)
  const hasMore = count > 5

  async function handleGenerate() {
    if (planLimits && planLimits.currentCount + count > planLimits.maxUnits) {
      const allowed = Math.max(0, planLimits.maxUnits - planLimits.currentCount);
      setError(`Subscription limit reached. You can only add ${allowed} more unit(s). Upgrade for more.`);
      return;
    }
    if (!defaultRent || isNaN(parseFloat(defaultRent))) { setError('Enter a valid rent amount'); return }
    if (count < 1 || count > 50) { setError('Count must be between 1 and 50'); return }

    setError(null)
    setSaving(true)

    const supabase = createClient()
    const units = Array.from({ length: count }, (_, i) => ({
      landlord_id: landlordId,
      property_id: propertyId,
      unit_number: `${prefix}${startNum + i}`,
      rent_amount: parseFloat(defaultRent),
      deposit_amount: defaultDeposit ? parseFloat(defaultDeposit) : null,
      type: defaultType || null,
      status: 'vacant',
    }))

    const { error: insErr } = await supabase.from('units').insert(units)
    if (insErr) { setError(insErr.message); setSaving(false); return }

    setSaving(false)
    setOpen(false)
    onCreated(count)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm border border-border bg-card hover:bg-muted text-foreground px-3 py-2 rounded-lg transition-colors font-medium"
      >
        <Layers className="w-4 h-4 text-violet-500" />
        Bulk generate units
      </button>
    )
  }

  return (
    <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-violet-800 dark:text-violet-300 flex items-center gap-2">
          <Layers className="w-4 h-4" /> Bulk Generate Units
        </p>
        <button onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">✕ Cancel</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Unit prefix (optional)</label>
          <input
            className="w-full border border-border rounded-lg px-2.5 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="e.g. A, B, GF"
            value={prefix}
            onChange={e => setPrefix(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Start number</label>
          <input
            type="number" min={1}
            className="w-full border border-border rounded-lg px-2.5 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
            value={startNum}
            onChange={e => setStartNum(parseInt(e.target.value) || 1)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Count (1–50)</label>
          <input
            type="number" min={1} max={50}
            className="w-full border border-border rounded-lg px-2.5 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
            value={count}
            onChange={e => setCount(Math.min(50, parseInt(e.target.value) || 1))}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Default rent *</label>
          <input
            type="number"
            className="w-full border border-border rounded-lg px-2.5 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="15000"
            value={defaultRent}
            onChange={e => setDefaultRent(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Default deposit</label>
          <input
            type="number"
            className="w-full border border-border rounded-lg px-2.5 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="30000"
            value={defaultDeposit}
            onChange={e => setDefaultDeposit(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Unit type</label>
          <select
            className="w-full border border-border rounded-lg px-2.5 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
            value={defaultType}
            onChange={e => setDefaultType(e.target.value)}
          >
            {UNIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-lg border border-border bg-card px-3 py-2">
        <p className="text-xs font-medium text-muted-foreground mb-1.5">Preview — will create {count} unit{count !== 1 ? 's' : ''}:</p>
        <div className="flex flex-wrap gap-1.5">
          {preview.map(n => (
            <span key={n} className="text-xs bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-md font-mono font-medium">{n}</span>
          ))}
          {hasMore && <span className="text-xs text-muted-foreground self-center">…and {count - 5} more</span>}
        </div>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800/40">{error}</p>}

      <button
        onClick={handleGenerate}
        disabled={saving}
        className="w-full bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60"
      >
        {saving ? `Creating ${count} units…` : `✓ Create ${count} units`}
      </button>
    </div>
  )
}
