'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { LogStockModal } from './log-stock-modal'

interface Props {
  schoolId: string
  userId: string
}

export function LogStockButton({ schoolId, userId }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-amber-600 hover:bg-amber-700 gap-2">
        <Plus className="w-4 h-4" />
        Log Stock
      </Button>
      {open && <LogStockModal schoolId={schoolId} userId={userId} onClose={() => setOpen(false)} />}
    </>
  )
}
