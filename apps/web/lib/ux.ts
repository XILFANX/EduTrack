'use client'

export interface SuccessModalOptions {
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export interface ErrorModalOptions {
  title: string
  description?: string
}

export const UX = {
  successModal: (options: SuccessModalOptions) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ux-success-modal', { detail: options }))
    }
  },
  errorModal: (options: ErrorModalOptions | string) => {
    if (typeof window !== 'undefined') {
      const detail = typeof options === 'string' 
        ? { title: 'An error occurred', description: options } 
        : options
      window.dispatchEvent(new CustomEvent('ux-error-modal', { detail }))
    }
  },
  toast: (message: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ux-toast', { detail: message }))
    }
  }
}
