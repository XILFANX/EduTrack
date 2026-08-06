'use client'

import React, { createContext, useState, useCallback, ReactNode, useContext, useEffect } from 'react'
import { AlertTriangle, CheckCircle2, X, AlertCircle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { SuccessModalOptions, ErrorModalOptions } from '@/lib/ux'

export interface ConfirmOptions {
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
}

type ConfirmFunction = (options: ConfirmOptions) => Promise<boolean>

export const ConfirmContext = createContext<ConfirmFunction | undefined>(undefined)

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error('useConfirm must be used within a UXProvider')
  }
  return context
}

export function UXProvider({ children }: { children: ReactNode }) {
  // Confirm State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [confirmOpts, setConfirmOpts] = useState<ConfirmOptions>({ title: '' })
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null)

  // Success Modal State
  const [isSuccessOpen, setIsSuccessOpen] = useState(false)
  const [successOpts, setSuccessOpts] = useState<SuccessModalOptions | null>(null)

  // Error Modal State
  const [isErrorOpen, setIsErrorOpen] = useState(false)
  const [errorOpts, setErrorOpts] = useState<ErrorModalOptions | null>(null)

  // Toast State
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // Confirm API
  const confirm = useCallback((newOptions: ConfirmOptions) => {
    setConfirmOpts({
      title: newOptions.title,
      description: newOptions.description ?? '',
      confirmText: newOptions.confirmText ?? (newOptions.variant === 'destructive' ? 'Delete' : 'Confirm'),
      cancelText: newOptions.cancelText ?? 'Cancel',
      variant: newOptions.variant ?? 'default',
    })
    setIsConfirmOpen(true)
    return new Promise<boolean>((resolve) => {
      setResolvePromise(() => resolve)
    })
  }, [])

  const handleConfirm = () => { setIsConfirmOpen(false); if (resolvePromise) resolvePromise(true) }
  const handleCancel = () => { setIsConfirmOpen(false); if (resolvePromise) resolvePromise(false) }

  // Listeners
  useEffect(() => {
    const onSuccess = (e: any) => {
      setSuccessOpts(e.detail)
      setIsSuccessOpen(true)
      
      if (!e.detail.action) {
        setTimeout(() => setIsSuccessOpen(false), 3500)
      }
    }
    const onError = (e: any) => {
      setErrorOpts(e.detail)
      setIsErrorOpen(true)
    }
    const onToast = (e: any) => {
      setToastMsg(e.detail)
      setTimeout(() => setToastMsg(null), 3000)
    }

    window.addEventListener('ux-success-modal', onSuccess)
    window.addEventListener('ux-error-modal', onError)
    window.addEventListener('ux-toast', onToast)
    return () => {
      window.removeEventListener('ux-success-modal', onSuccess)
      window.removeEventListener('ux-error-modal', onError)
      window.removeEventListener('ux-toast', onToast)
    }
  }, [])

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {/* CONFIRM DIALOG */}
      <AlertDialog open={isConfirmOpen} onOpenChange={(open) => { if (!open) handleCancel() }}>
        <AlertDialogContent className="bg-slate-900 border-slate-800 text-white p-6 max-w-sm rounded-3xl sm:max-w-sm outline-none shadow-2xl backdrop-blur-md">
          <AlertDialogHeader className="flex flex-col items-center text-center space-y-4 pt-4">
            <div className="w-14 h-14 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-inner">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <AlertDialogTitle className="text-[22px] font-bold tracking-tight text-white">
                {confirmOpts.title}
              </AlertDialogTitle>
              {confirmOpts.description && (
                <AlertDialogDescription className="text-[13px] leading-relaxed text-slate-400 font-medium px-4">
                  {confirmOpts.description}
                </AlertDialogDescription>
              )}
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex sm:flex-row gap-3 sm:justify-center mt-6 w-full pb-2">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              className="flex-1 bg-slate-800 border-slate-700 hover:bg-slate-700 hover:text-white text-slate-300 font-semibold rounded-xl h-11"
            >
              {confirmOpts.cancelText}
            </Button>
            <Button 
              onClick={handleConfirm}
              className={`flex-1 font-semibold rounded-xl h-11 ${
                confirmOpts.variant === 'destructive' 
                  ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-900/20 border-none' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20'
              }`}
            >
              {confirmOpts.confirmText}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* SUCCESS MODAL (EDUTRACK THEME - CYAN/BLUE) */}
      <AlertDialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <AlertDialogContent className="bg-slate-900 border-t-[3px] border-t-cyan-500 border-x-slate-800 border-b-slate-800 text-white p-6 max-w-sm rounded-2xl outline-none shadow-2xl backdrop-blur-md relative overflow-hidden">
          <button 
            onClick={() => setIsSuccessOpen(false)} 
            className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          
          <AlertDialogHeader className="flex flex-col items-center text-center space-y-4 pt-2">
            <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-inner">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <AlertDialogTitle className="text-[20px] font-bold tracking-tight text-white">
                {successOpts?.title}
              </AlertDialogTitle>
              {successOpts?.description && (
                <AlertDialogDescription className="text-sm text-slate-400 font-medium px-4">
                  {successOpts.description}
                </AlertDialogDescription>
              )}
            </div>
          </AlertDialogHeader>
          
          <AlertDialogFooter className="flex sm:flex-row gap-3 sm:justify-center mt-6 w-full">
            <Button 
              variant="outline" 
              onClick={() => setIsSuccessOpen(false)}
              className="flex-1 bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl"
            >
              Done
            </Button>
            {successOpts?.action && (
              <Button 
                onClick={() => {
                  successOpts.action?.onClick()
                  setIsSuccessOpen(false)
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
              >
                {successOpts.action.label}
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ERROR MODAL */}
      <AlertDialog open={isErrorOpen} onOpenChange={setIsErrorOpen}>
        <AlertDialogContent className="bg-slate-900 border-t-[3px] border-t-orange-500 border-x-slate-800 border-b-slate-800 text-white p-6 max-w-sm rounded-2xl outline-none shadow-2xl backdrop-blur-md relative overflow-hidden">
          <button 
            onClick={() => setIsErrorOpen(false)} 
            className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          
          <AlertDialogHeader className="flex flex-col items-center text-center space-y-4 pt-2">
            <div className="w-14 h-14 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-inner">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <AlertDialogTitle className="text-[20px] font-bold tracking-tight text-white">
                {errorOpts?.title}
              </AlertDialogTitle>
              {errorOpts?.description && (
                <AlertDialogDescription className="text-sm text-slate-400 font-medium px-4">
                  {errorOpts.description}
                </AlertDialogDescription>
              )}
            </div>
          </AlertDialogHeader>
          
          <AlertDialogFooter className="flex sm:flex-row gap-3 sm:justify-center mt-6 w-full">
            <Button 
              onClick={() => setIsErrorOpen(false)}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl"
            >
              Got it
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MINOR TOAST */}
      <div 
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ease-in-out pointer-events-none
          ${toastMsg ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}
        `}
      >
        <div className="bg-slate-800/95 backdrop-blur shadow-xl border border-slate-700/50 text-white px-5 py-3 rounded-full text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-400" />
          {toastMsg}
        </div>
      </div>
    </ConfirmContext.Provider>
  )
}
