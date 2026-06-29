"use client"

import { useState, useCallback } from "react"

interface ConfirmDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "danger" | "warning" | "default"
  loading?: boolean
  children?: React.ReactNode
}

const VARIANT_STYLES = {
  danger: {
    icon: "⚠️",
    iconBg: "bg-red-100 dark:bg-red-900/30",
    confirmBtn: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
  },
  warning: {
    icon: "⚠️",
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    confirmBtn: "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500",
  },
  default: {
    icon: "❓",
    iconBg: "bg-violet-100 dark:bg-violet-900/30",
    confirmBtn: "bg-violet-600 hover:bg-violet-700 focus:ring-violet-500",
  },
}

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  loading = false,
  children,
}: ConfirmDialogProps) {
  if (!open) return null

  const styles = VARIANT_STYLES[variant]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 fade-in duration-200">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-full ${styles.iconBg} flex items-center justify-center mx-auto text-xl`}>
          {styles.icon}
        </div>

        {/* Text */}
        <div className="text-center space-y-1.5">
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>

        {/* Custom Content */}
        {children && <div>{children}</div>}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 bg-muted hover:bg-muted/80 text-foreground font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 ${styles.confirmBtn} text-white font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-offset-2`}
          >
            {loading ? "Processing…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Hook for easily managing confirm dialog state.
 * Usage:
 *   const { dialogProps, confirm } = useConfirmDialog()
 *   <ConfirmDialog {...dialogProps} />
 *   await confirm({ title: "...", description: "..." })
 */
export function useConfirmDialog() {
  const [state, setState] = useState<{
    open: boolean
    title: string
    description: string
    confirmLabel?: string
    variant?: "danger" | "warning" | "default"
    loading: boolean
    resolve?: (confirmed: boolean) => void
  }>({
    open: false,
    title: "",
    description: "",
    loading: false,
  })

  const confirm = useCallback(
    (opts: {
      title: string
      description: string
      confirmLabel?: string
      variant?: "danger" | "warning" | "default"
    }): Promise<boolean> => {
      return new Promise((resolve) => {
        setState({
          open: true,
          title: opts.title,
          description: opts.description,
          confirmLabel: opts.confirmLabel,
          variant: opts.variant,
          loading: false,
          resolve,
        })
      })
    },
    []
  )

  const setLoading = useCallback((v: boolean) => {
    setState((s) => ({ ...s, loading: v }))
  }, [])

  const dialogProps: ConfirmDialogProps = {
    open: state.open,
    title: state.title,
    description: state.description,
    confirmLabel: state.confirmLabel,
    variant: state.variant,
    loading: state.loading,
    onConfirm: () => {
      state.resolve?.(true)
      if (!state.loading) setState((s) => ({ ...s, open: false }))
    },
    onCancel: () => {
      state.resolve?.(false)
      setState((s) => ({ ...s, open: false }))
    },
  }

  const close = useCallback(() => {
    setState((s) => ({ ...s, open: false }))
  }, [])

  return { dialogProps, confirm, setLoading, close }
}
