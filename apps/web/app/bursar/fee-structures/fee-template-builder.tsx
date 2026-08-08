'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Receipt, Plus, Trash2, Loader2, Copy, Send,
  BookOpen, ChevronDown, AlertCircle, CheckCircle2, Edit2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useConfirmDialog, ConfirmDialog } from '@/components/ui/confirm-dialog'
import { UX } from '@/lib/ux'
import { createFeeTemplate, deleteFeeTemplate, generateInvoicesFromTemplate, duplicateTemplateFromTerm } from '@/app/actions/fee-structures'

const formatKES = (n: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n)

interface FeeItem { description: string; amount: number; sort_order: number }
interface Template {
  id: string; name: string; class_id: string | null; term_id: string; year_id: string; created_at: string
  fee_items: FeeItem[]; classes: { name: string } | null; academic_terms: { name: string } | null
}
interface Props {
  schoolId: string; initialTemplates: Template[]; terms: any[]; years: any[]; classes: any[]
}

// ─── Create Template Modal ────────────────────────────────────────────────────

function CreateTemplateModal({ open, onClose, years, terms, classes, schoolId }: {
  open: boolean; onClose: () => void; years: any[]; terms: any[]; classes: any[]; schoolId: string
}) {
  const [name, setName] = useState('')
  const [yearId, setYearId] = useState(years.find((y: any) => y.is_active)?.id || years[0]?.id || '')
  const [termId, setTermId] = useState('')
  const [classId, setClassId] = useState<string | null>(null)
  const [items, setItems] = useState<FeeItem[]>([{ description: '', amount: 0, sort_order: 0 }])
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const filteredTerms = terms.filter((t: any) => t.year_id === yearId)
  const total = items.reduce((s, i) => s + Number(i.amount || 0), 0)

  function addItem() { setItems(prev => [...prev, { description: '', amount: 0, sort_order: prev.length }]) }
  function removeItem(idx: number) { setItems(prev => prev.filter((_, i) => i !== idx)) }
  function updateItem(idx: number, field: keyof FeeItem, value: string | number) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setErr('Template name is required.'); return }
    if (!termId) { setErr('Select an academic term.'); return }
    const validItems = items.filter(i => i.description.trim() && Number(i.amount) > 0)
    if (validItems.length === 0) { setErr('Add at least one fee item with a description and amount.'); return }

    setSaving(true); setErr(null)
    const res = await createFeeTemplate({
      name: name.trim(), termId, yearId, classId,
      items: validItems.map((item, idx) => ({ ...item, amount: Number(item.amount), sort_order: idx }))
    })
    setSaving(false)
    if (res.error) { setErr(res.error); return }
    UX.successModal({ title: 'Fee template created!' })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[560px] rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Fee Template</DialogTitle>
          <p className="text-sm text-muted-foreground">Define the fee components for a term. You can then generate invoices from this template.</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Name */}
          <div className="space-y-2">
            <Label>Template Name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Form 3 Term 1 2026 Fees" autoFocus />
          </div>

          {/* Year + Term */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Academic Year *</Label>
              <select value={yearId} onChange={e => { setYearId(e.target.value); setTermId('') }}
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl">
                {years.map((y: any) => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Term *</Label>
              <select value={termId} onChange={e => setTermId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl">
                <option value="">Select term</option>
                {filteredTerms.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          {/* Class (optional) */}
          <div className="space-y-2">
            <Label>Class <span className="text-muted-foreground font-normal text-xs">(leave blank for all classes)</span></Label>
            <select value={classId || ''} onChange={e => setClassId(e.target.value || null)}
              className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl">
              <option value="">All Classes (School-wide)</option>
              {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Fee Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Fee Components *</Label>
              <button type="button" onClick={addItem}
                className="flex items-center gap-1.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline">
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      value={item.description}
                      onChange={e => updateItem(idx, 'description', e.target.value)}
                      placeholder={idx === 0 ? 'e.g. Tuition Fee' : idx === 1 ? 'e.g. Lunch' : 'e.g. Activity Fee'}
                      className="text-sm"
                    />
                  </div>
                  <div className="w-32">
                    <Input
                      type="number"
                      min={0}
                      value={item.amount || ''}
                      onChange={e => updateItem(idx, 'amount', e.target.value)}
                      placeholder="KES"
                      className="text-sm text-right font-semibold"
                    />
                  </div>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)}
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between px-3 py-2.5 bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/40 rounded-xl">
              <span className="text-sm font-bold text-cyan-700 dark:text-cyan-300">Total per Student</span>
              <span className="text-base font-black text-cyan-700 dark:text-cyan-300">{formatKES(total)}</span>
            </div>
          </div>

          {err && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800">{err}</p>}

          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
            <Button type="submit" disabled={saving} className="rounded-xl bg-[#1D6FEB] hover:bg-[#1558C8] text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Template
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Invoice Generator Confirm ────────────────────────────────────────────────

function InvoiceGeneratorModal({ open, onClose, template }: { open: boolean; onClose: () => void; template: Template | null }) {
  const router = useRouter()
  const [generating, startGen] = useTransition()

  function handleGenerate() {
    if (!template) return
    startGen(async () => {
      const res = await generateInvoicesFromTemplate(template.id)
      if (res.error) { UX.errorModal(res.error); onClose(); return }
      UX.successModal({ title: `${(res as any).count} invoices generated successfully!` })
      onClose()
      router.refresh()
    })
  }

  if (!template) return null
  const total = template.fee_items.reduce((s, i) => s + Number(i.amount), 0)

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[440px] rounded-3xl">
        <DialogHeader>
          <DialogTitle>Generate Invoices</DialogTitle>
          <p className="text-sm text-muted-foreground">This will create one invoice per enrolled student using this template.</p>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <p className="font-bold text-foreground">{template.name}</p>
            <div className="space-y-1.5">
              {template.fee_items.sort((a, b) => a.sort_order - b.sort_order).map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.description}</span>
                  <span className="font-semibold text-foreground">{formatKES(item.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm pt-2 border-t border-border font-black">
                <span className="text-foreground">Total</span>
                <span className="text-cyan-600 dark:text-cyan-400">{formatKES(total)}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Applies to: <strong>{template.classes?.name || 'All Classes'}</strong> · {template.academic_terms?.name}
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
            <Button onClick={handleGenerate} disabled={generating} className="rounded-xl bg-[#1D6FEB] hover:bg-[#1558C8] text-white gap-2">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Generate Invoices
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Builder ─────────────────────────────────────────────────────────────

export function FeeTemplateBuilder({ schoolId, initialTemplates, terms, years, classes }: Props) {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>(initialTemplates)
  const [createModal, setCreateModal] = useState(false)
  const [invoiceModal, setInvoiceModal] = useState<{ open: boolean; template: Template | null }>({ open: false, template: null })
  const { dialogProps, confirm } = useConfirmDialog()

  async function handleDelete(t: Template) {
    const ok = await confirm({
      title: 'Delete Fee Template',
      description: `Delete "${t.name}"? This will not remove existing invoices, but new ones can no longer be generated from this template.`,
      confirmLabel: 'Delete Template',
      variant: 'danger',
    })
    if (!ok) return
    const res = await deleteFeeTemplate(t.id)
    if (res.error) { UX.errorModal(res.error); return }
    setTemplates(prev => prev.filter(x => x.id !== t.id))
    UX.successModal({ title: 'Template deleted' })
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Hero */}
      <div className="bg-gradient-to-br from-cyan-600 via-cyan-500 to-cyan-500 rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[50px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Fee Templates</h1>
              <p className="text-cyan-100 text-sm mt-0.5">Build multi-component fee structures and generate bulk invoices</p>
            </div>
          </div>
          <Button onClick={() => setCreateModal(true)} className="bg-white text-cyan-700 hover:bg-cyan-50 font-bold rounded-xl gap-2 shrink-0">
            <Plus className="w-4 h-4" /> New Template
          </Button>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-16 bg-card border-2 border-dashed border-border rounded-3xl">
          <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-foreground">No Fee Templates Yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm mx-auto">
            Create a fee template with multiple components (tuition, lunch, activities) to generate invoices.
          </p>
          <Button onClick={() => setCreateModal(true)} className="bg-[#1D6FEB] hover:bg-[#1558C8] text-white rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Create First Template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => {
            const total = t.fee_items.reduce((s, i) => s + Number(i.amount), 0)
            return (
              <div key={t.id} className="bg-card border border-border rounded-2xl p-5 group flex flex-col gap-4 hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground leading-tight">{t.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t.classes?.name || 'All Classes'} · {t.academic_terms?.name || '—'}
                    </p>
                  </div>
                  <button onClick={() => handleDelete(t)}
                    className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Fee items */}
                <div className="space-y-1.5 flex-1">
                  {t.fee_items.sort((a, b) => a.sort_order - b.sort_order).map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.description}</span>
                      <span className="font-semibold text-foreground">{formatKES(item.amount)}</span>
                    </div>
                  ))}
                </div>

                {/* Total + actions */}
                <div className="border-t border-border pt-3 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-foreground">Total</span>
                    <span className="text-base font-black text-cyan-600 dark:text-cyan-400">{formatKES(total)}</span>
                  </div>
                  <Button
                    className="w-full rounded-xl bg-[#1D6FEB] hover:bg-[#1558C8] text-white gap-2 text-sm"
                    onClick={() => setInvoiceModal({ open: true, template: t })}
                  >
                    <Send className="w-3.5 h-3.5" /> Generate Invoices
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <CreateTemplateModal
        open={createModal}
        onClose={() => { setCreateModal(false); router.refresh() }}
        years={years} terms={terms} classes={classes} schoolId={schoolId}
      />
      <InvoiceGeneratorModal
        open={invoiceModal.open}
        onClose={() => setInvoiceModal({ open: false, template: null })}
        template={invoiceModal.template}
      />
      <ConfirmDialog {...dialogProps} />
    </div>
  )
}
