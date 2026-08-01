'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { CreateAdminModal } from './create-admin-modal'

export function CreateAdminButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-blue-600 hover:bg-blue-700 gap-2">
        <Plus className="w-4 h-4" />
        Add Admin
      </Button>
      {open && <CreateAdminModal onClose={() => setOpen(false)} />}
    </>
  )
}
