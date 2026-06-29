"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Trash2 } from "lucide-react"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function DeleteAccountDialog() {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch('/api/user/delete', { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete account')
      
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error(error)
      setIsDeleting(false)
      alert("An error occurred while deleting your account. Please try again or contact support.")
    }
  }

  return (
    <div className="mt-12 rounded-xl border border-red-200 bg-red-50 p-5 dark:bg-red-950/20 dark:border-red-900/50">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-red-800 dark:text-red-400 font-semibold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            Danger Zone
          </h3>
          <p className="text-red-600 dark:text-red-300 text-sm mt-1 max-w-lg">
            Permanently delete your account, properties, tenants, and all associated data. This action is irreversible.
          </p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/50 dark:hover:bg-red-900/80 dark:text-red-300 rounded-lg font-medium text-sm transition-colors shrink-0">
              <Trash2 className="w-4 h-4" />
              Delete Account
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                account, remove your properties, tenants, invoices, and payment history from our
                servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors disabled:opacity-50 inline-flex items-center justify-center"
              >
                {isDeleting ? 'Deleting...' : 'Yes, delete my account'}
              </button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
