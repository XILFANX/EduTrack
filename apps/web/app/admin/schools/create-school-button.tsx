'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { CreateSchoolModal } from './create-school-modal'

export function CreateSchoolButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
        <Plus className="w-4 h-4" />
        New School
      </Button>
      {open && <CreateSchoolModal onClose={() => setOpen(false)} />}
    </>
  )
}
