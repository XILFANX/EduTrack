'use client'

import React, { createContext, useState, useCallback, ReactNode, useContext } from 'react'
import { AlertTriangle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

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
    throw new Error('useConfirm must be used within a ConfirmProvider')
  }
  return context
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions>({
    title: '',
    description: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'default',
  })
  
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null)

  const confirm = useCallback((newOptions: ConfirmOptions) => {
    setOptions({
      title: newOptions.title,
      description: newOptions.description ?? '',
      confirmText: newOptions.confirmText ?? 'Confirm',
      cancelText: newOptions.cancelText ?? 'Cancel',
      variant: newOptions.variant ?? 'default',
    })
    setIsOpen(true)

    return new Promise<boolean>((resolve) => {
      setResolvePromise(() => resolve)
    })
  }, [])

  const handleConfirm = () => {
    setIsOpen(false)
    if (resolvePromise) resolvePromise(true)
  }

  const handleCancel = () => {
    setIsOpen(false)
    if (resolvePromise) resolvePromise(false)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog open={isOpen} onOpenChange={(open) => {
        if (!open) handleCancel()
      }}>
        <AlertDialogContent className="bg-slate-900 border-slate-800 text-white p-6 max-w-sm rounded-3xl sm:max-w-sm outline-none shadow-2xl">
          <AlertDialogHeader className="flex flex-col items-center text-center space-y-4 pt-4">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-inner">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <AlertDialogTitle className="text-[22px] font-bold tracking-tight text-white">
                {options.title}
              </AlertDialogTitle>
              {options.description && (
                <AlertDialogDescription className="text-[13px] leading-relaxed text-slate-400 font-medium px-4">
                  {options.description}
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
              {options.cancelText}
            </Button>
            <Button 
              variant={options.variant === 'destructive' ? 'destructive' : 'default'}
              onClick={handleConfirm}
              className={`flex-1 font-semibold rounded-xl h-11 ${
                options.variant === 'destructive' 
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20'
              }`}
            >
              {options.confirmText}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  )
}
