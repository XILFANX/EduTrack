import React from 'react'
import { toast } from 'sonner'
import { FeedbackToast, FeedbackAction } from '@/components/ui/feedback-toast'

interface FeedbackOptions {
  title: string
  description?: string
  action?: FeedbackAction
  duration?: number
}

export const showFeedback = (options: FeedbackOptions) => {
  toast.custom((t) => (
    <FeedbackToast 
      t={t} 
      type="success" 
      dismiss={toast.dismiss} 
      {...options} 
    />
  ), { duration: options.duration || 5000 })
}

export const showError = (options: FeedbackOptions | string) => {
  const opts = typeof options === 'string' ? { title: options } : options
  toast.custom((t) => (
    <FeedbackToast 
      t={t} 
      type="error" 
      dismiss={toast.dismiss} 
      {...opts} 
    />
  ), { duration: opts.duration || 7000 })
}
