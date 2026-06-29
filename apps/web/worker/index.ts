/// <reference lib="webworker" />



const sw = self as any;

sw.__WB_DISABLE_DEV_LOGS = true;

self.addEventListener('push', (event: unknown) => {
  const ev = event as PushEvent
  const data = JSON.parse(ev?.data?.text() || '{}')
  
  const title = data.title || 'EstateTrack Notification'
  const options = {
    body: data.body || 'You have a new message.',
    icon: '/logo.png',
    badge: '/logo.png',
    data: data.data || { url: '/' }
  }

  ev.waitUntil(sw.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event: unknown) => {
  const ev = event as NotificationEvent
  ev.notification.close()

  const urlToOpen = ev.notification.data.url || '/'
  
  ev.waitUntil(
    (self as unknown as ServiceWorkerGlobalScope).clients.matchAll({ type: 'window' }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i]
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      if (sw.clients.openWindow) {
        return sw.clients.openWindow(urlToOpen)
      }
    })
  )
})
