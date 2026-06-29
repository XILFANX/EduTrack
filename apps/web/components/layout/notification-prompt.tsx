'use client'

import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'

export function NotificationPrompt() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setDismissed(true)
      return
    }
    
    setPermission(Notification.permission)
    
    if (localStorage.getItem('estate_push_dismissed') === 'true') {
      setDismissed(true)
    }

    checkSubscription()
  }, [])

  const checkSubscription = async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      if (!reg) return
      const sub = await reg.pushManager.getSubscription()
      if (sub) setSubscribed(true)
    } catch (e) {}
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

  const subscribeToPush = async () => {
    setLoading(true)
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)

      if (perm !== 'granted') {
        setLoading(false)
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

      setSubscribed(true)
      dismiss()
    } catch (err) {
      console.error('Failed to subscribe:', err)
      dismiss()
    }
    setLoading(false)
  }

  const dismiss = () => {
    setDismissed(true)
    localStorage.setItem('estate_push_dismissed', 'true')
  }

  if (dismissed || subscribed || permission === 'denied') return null

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-slate-900 border border-violet-500/30 rounded-2xl shadow-2xl p-4 z-50 animate-in slide-in-from-bottom-5">
      <button onClick={dismiss} className="absolute top-2 right-2 text-slate-400 hover:text-white transition-colors">
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex gap-3 items-start">
        <div className="bg-violet-500/20 p-2 rounded-full text-violet-400 shrink-0">
          <Bell className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Enable Notifications</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Get instant alerts for maintenance requests, payments, and lease updates.
          </p>
          <div className="mt-3 flex gap-2">
            <button 
              onClick={subscribeToPush} 
              disabled={loading}
              className="text-xs bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold py-1.5 px-3 rounded-lg transition-colors"
            >
              {loading ? 'Enabling...' : 'Enable Now'}
            </button>
            <button 
              onClick={dismiss}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-1.5 px-3 rounded-lg transition-colors"
            >
              Not Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
