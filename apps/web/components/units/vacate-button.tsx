"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { vacateTenant } from "@/app/(dashboard)/tenants/[id]/vacate-action"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

export function VacateUnitButton({ tenantId }: { tenantId: string }) {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const router = useRouter()

  const handleVacate = async () => {
    setLoading(true)
    setResult(null)
    try {
      const today = new Date().toISOString().split('T')[0]
      const res = await vacateTenant(tenantId, today)
      
      if (res.error) {
        setResult({ type: "error", message: res.error })
        setShowConfirm(false)
      } else {
        setResult({ type: "success", message: "Tenant vacated successfully!" })
        setShowConfirm(false)
        setTimeout(() => router.refresh(), 1500)
      }
    } catch (err: unknown) {
      setResult({ type: "error", message: err instanceof Error ? err.message : "Something went wrong" })
      setShowConfirm(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button 
        type="button"
        onClick={() => setShowConfirm(true)}
        disabled={loading}
        className="text-xs bg-violet-100 hover:bg-violet-200 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400 dark:hover:bg-violet-500/30 font-semibold px-3 py-1.5 rounded-lg transition-colors mt-3 w-full"
      >
        {loading ? 'Vacating…' : 'Vacate Tenant'}
      </button>

      {result && (
        <p className={`text-xs mt-1.5 text-center font-medium ${result.type === "success" ? "text-emerald-600" : "text-red-500"}`}>
          {result.message}
        </p>
      )}

      <ConfirmDialog
        open={showConfirm}
        title="Vacate this tenant?"
        description="This will free the unit, mark the tenant as moved out, and expire their active lease. This action cannot be undone."
        confirmLabel="Yes, Vacate"
        cancelLabel="Keep Tenant"
        variant="danger"
        loading={loading}
        onConfirm={handleVacate}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  )
}
