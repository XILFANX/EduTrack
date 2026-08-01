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
        className="p-1.5 text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
        title="Remove admin"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </form>
  )
}
