'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { CreateSchoolModal } from './create-school-modal'

export function CreateSchoolButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-[#1D6FEB] hover:bg-[#1558C8] gap-2">
        <Plus className="w-4 h-4" />
        New School
      </Button>
      {open && <CreateSchoolModal onClose={() => setOpen(false)} />}
    </>
  )
}
