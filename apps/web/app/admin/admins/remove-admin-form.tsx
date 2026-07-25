'use client'

import { Trash2 } from 'lucide-react'
import { removeSubAdmin } from './actions'

export function RemoveAdminById({ id }: { id: string }) {
  return (
    <form
      action={async () => {
        await removeSubAdmin(id)
      }}
    >
      <button
        type="submit"
        className="p-1.5 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        title="Remove admin"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </form>
  )
}
