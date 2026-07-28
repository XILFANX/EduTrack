import React from 'react'
import { CheckCircle2, XCircle, Info, LucideIcon, X } from 'lucide-react'
import { Button } from './button'

export interface FeedbackAction {
  label: string
  onClick: () => void
}

export interface FeedbackToastProps {
  t: string | number
  type: 'success' | 'error' | 'info'
  title: string
  description?: string
  action?: FeedbackAction
  dismiss: (id: string | number) => void
}

export function FeedbackToast({ t, type, title, description, action, dismiss }: FeedbackToastProps) {
  const isError = type === 'error'
  const isSuccess = type === 'success'

  const Icon: LucideIcon = isSuccess ? CheckCircle2 : isError ? XCircle : Info
  
  return (
    <div className={`w-[360px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 overflow-hidden relative`}>
      {/* Theme Top Accent */}
      <div className={`absolute top-0 left-0 w-full h-1 ${isError ? 'bg-red-500' : 'bg-blue-500'}`} />
      
      <button 
        onClick={() => dismiss(t)}
        className="absolute top-3 right-3 text-slate-500 hover:text-slate-300 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex flex-col items-center text-center mt-2">
        <div className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center border shadow-inner ${
          isError 
            ? 'bg-red-500/10 text-red-400 border-red-500/20' 
            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
        }`}>
          <Icon className="w-6 h-6" />
        </div>
        
        <h3 className="text-[17px] font-bold text-white tracking-tight mb-1">{title}</h3>
        {description && (
          <p className="text-[13px] text-slate-400 font-medium px-2 leading-relaxed">
            {description}
          </p>
        )}
        
        {action && (
          <div className="mt-5 w-full flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => dismiss(t)}
              className="flex-1 h-9 rounded-lg bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 font-semibold"
            >
              Dismiss
            </Button>
            <Button 
              onClick={() => {
                action.onClick()
                dismiss(t)
              }}
              className={`flex-1 h-9 rounded-lg font-semibold text-white shadow-lg ${
                isError 
                  ? 'bg-red-600 hover:bg-red-700 shadow-red-900/20' 
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/20'
              }`}
            >
              {action.label}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
