'use client'

import { useConfirmDialog, ConfirmDialog } from '@/components/ui/confirm-dialog'
import { deleteUserAccount } from './actions'
import { useRouter } from 'next/navigation'

export default function DeleteAccountButton() {
  const { dialogProps, confirm, setLoading } = useConfirmDialog()
  const router = useRouter()

  async function handleDelete() {
    const isConfirmed = await confirm({
      title: "Delete Account",
      description: "Are you absolutely sure? This action is permanent and will remove all your data from the school system.",
      confirmLabel: "Delete Account",
      variant: "danger"
    })

    if (!isConfirmed) return

    setLoading(true)
    const res = await deleteUserAccount()
    setLoading(false)

    if (res?.error) {
      alert(res.error)
    } else {
      router.push('/login')
    }
  }

  return (
    <>
      <button 
        onClick={handleDelete}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
      >
        Delete Account
      </button>
      <ConfirmDialog {...dialogProps} />
    </>
  )
}
