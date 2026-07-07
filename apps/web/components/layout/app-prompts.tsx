'use client'

import { useState, useEffect } from 'react'
import { Bell, Download, Share, PlusSquare, X } from 'lucide-react'

type PromptStep = 'install' | 'notification' | 'hidden'

export function AppPrompts() {
  const [step, setStep] = useState<PromptStep>('hidden')
  
  // Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIOS, setIsIOS] = useState(false)
  
  // Notification State
  const [pushLoading, setPushLoading] = useState(false)

  useEffect(() => {
    // 1. Check if prompts were dismissed this session
    if (sessionStorage.getItem('edutrack_prompts_dismissed') === 'true') {
      return
    }

    // 2. Check if already installed (Standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone
    
    // 3. Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(isIOSDevice)

    // 4. Capture Android/Chrome Install Prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      if (!isStandalone) {
        setStep('install')
      }
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // 5. Determine initial step if no event fired yet
    const timer = setTimeout(() => {
      if (isStandalone) {
        checkNotificationStatus()
      } else if (isIOSDevice) {
        setStep('install')
      } else if (!deferredPrompt) {
        checkNotificationStatus()
      }
    }, 1000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      clearTimeout(timer)
    }
  }, [deferredPrompt])

  const checkNotificationStatus = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setStep('hidden')
      return
    }
    
    if (Notification.permission === 'granted' || Notification.permission === 'denied') {
      setStep('hidden')
      return
    }

    try {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg) {
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          setStep('hidden')
          return
        }
      }
    } catch (e) {}

    setStep('notification')
  }

  const handleInstallClick = async () => {
    if (isIOS) return

    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
        checkNotificationStatus()
      }
    }
  }

  const handleInstallDismiss = () => {
    checkNotificationStatus()
  }

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  const handleEnablePush = async () => {
    setPushLoading(true)
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') {
        dismissAll()
        return
      }

      const reg = await navigator.serviceWorker.getRegistration()
      if (!reg) throw new Error('No service worker registered')
      
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) throw new Error('VAPID key not configured')

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub)
      })

      dismissAll()
    } catch (err) {
      console.error('Failed to subscribe:', err)
      dismissAll()
    }
    setPushLoading(false)
  }

  const dismissAll = () => {
    setStep('hidden')
    sessionStorage.setItem('edutrack_prompts_dismissed', 'true')
  }

  if (step === 'hidden') return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md bg-slate-900 border border-blue-500/30 rounded-2xl shadow-2xl p-4 z-50 animate-in slide-in-from-top-5 fade-in duration-300">
      <button onClick={dismissAll} className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white transition-colors">
        <X className="w-4 h-4" />
      </button>
      
      {step === 'install' && (
        <div className="flex gap-3 items-start">
          <div className="bg-blue-500/20 p-2 rounded-xl text-blue-400 shrink-0 mt-1">
            <Download className="w-6 h-6" />
          </div>
          <div className="flex-1 pr-4">
            <h3 className="text-sm font-bold text-white">Install EduTrack App</h3>
            
            {isIOS ? (
              <div className="mt-2 text-xs text-slate-300 leading-relaxed bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
                To install on iOS: tap the <Share className="w-3 h-3 inline mx-1" /> <strong>Share</strong> button below, then select <PlusSquare className="w-3 h-3 inline mx-1" /> <strong>Add to Home Screen</strong>.
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Install EduTrack to your home screen for a faster, full-screen native experience.
              </p>
            )}

            <div className="mt-3 flex gap-2">
              {!isIOS && (
                <button 
                  onClick={handleInstallClick} 
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 px-4 rounded-lg transition-colors"
                >
                  Install Now
                </button>
              )}
              <button 
                onClick={handleInstallDismiss}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-1.5 px-4 rounded-lg transition-colors"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'notification' && (
        <div className="flex gap-3 items-start">
          <div className="bg-blue-500/20 p-2 rounded-xl text-blue-400 shrink-0 mt-1">
            <Bell className="w-6 h-6" />
          </div>
          <div className="flex-1 pr-4">
            <h3 className="text-sm font-bold text-white">Enable Notifications</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Get instant alerts for important messages, fee payments, and school announcements.
            </p>
            <div className="mt-3 flex gap-2">
              <button 
                onClick={handleEnablePush} 
                disabled={pushLoading}
                className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-1.5 px-4 rounded-lg transition-colors"
              >
                {pushLoading ? 'Enabling...' : 'Enable Now'}
              </button>
              <button 
                onClick={dismissAll}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-1.5 px-4 rounded-lg transition-colors"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
