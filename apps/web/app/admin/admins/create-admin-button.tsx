'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { CreateAdminModal } from './create-admin-modal'

export function CreateAdminButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-[#1D6FEB] hover:bg-[#1558C8] gap-2">
        <Plus className="w-4 h-4" />
        Add Admin
      </Button>
      {open && <CreateAdminModal onClose={() => setOpen(false)} />}
    </>
  )
}
