"use client"

import { useState } from "react"
import { sendInvoiceReminder } from "@/app/(dashboard)/rent/invoices/actions"
import { Bell } from "lucide-react"

export function RemindButton({ invoiceId, tenantName }: { invoiceId: string, tenantName: string }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRemind() {
    if (loading || success) return
    
    setLoading(true)
    setError(null)
    
    try {
      const result = await sendInvoiceReminder(invoiceId)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative inline-block text-left">
      <button 
        onClick={handleRemind}
        disabled={loading || success}
        title={`Send reminder to ${tenantName}`}
        className="text-xs bg-muted hover:bg-muted/80 text-foreground px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1.5 disabled:opacity-60"
      >
        <Bell className="w-3 h-3" />
        {loading ? 'Sending...' : success ? 'Sent!' : 'Remind'}
      </button>
      
      {error && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-red-50 text-red-600 text-xs p-2 rounded shadow-lg z-10 border border-red-100 animate-in fade-in zoom-in">
          {error}
        </div>
      )}
    </div>
  )
}
