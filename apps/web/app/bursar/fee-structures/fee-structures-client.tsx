'use client'

import { useState } from 'react'
import { AddFeeStructureModal } from './add-fee-structure-modal'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, BookOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Term { id: string; name: string }
interface ClassRecord { id: string; name: string }
interface FeeStructure {
  id: string
  description: string
  amount: number
  academic_terms: { name: string } | null
  classes: { name: string } | null
}

interface Props {
  schoolId: string
  structures: FeeStructure[]
  terms: Term[]
  classes: ClassRecord[]
}

const formatKES = (amount: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(amount)

export function FeeStructuresClient({ schoolId, structures: initial, terms, classes }: Props) {
  const [open, setOpen] = useState(false)
  const [structures, setStructures] = useState(initial)

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fee Structures</h1>
          <p className="text-sm text-muted-foreground mt-1">Define standard fees for each class and term.</p>
        </div>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 gap-2"
          onClick={() => setOpen(true)}
        >
          <Plus className="w-4 h-4" />
          New Structure
        </Button>
      </div>

      {structures.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 mx-auto flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">No fee structures yet</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2 mb-4">
            Create a fee structure to start billing students for this term.
          </p>
          <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4" />
            Add First Structure
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {structures.map((s) => (
            <Card key={s.id} className="border-slate-200 dark:border-slate-800 group hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex justify-between items-start">
                  <span>{s.description || 'General Fee'}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-lg font-bold">{formatKES(s.amount)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Term: <span className="text-foreground font-medium">{s.academic_terms?.name || 'All Terms'}</span></p>
                  <p>Class: <span className="text-foreground font-medium">{s.classes?.name || 'All Classes'}</span></p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddFeeStructureModal
        open={open}
        onClose={() => {
          setOpen(false)
          // Refresh by reloading the router
          window.location.reload()
        }}
        schoolId={schoolId}
        terms={terms}
        classes={classes}
      />
    </>
  )
}
