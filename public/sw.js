// Service Worker for Web Push Notifications (VAPID)
// This replaces the Firebase service worker

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push received:', event)
  console.log('[Service Worker] Push data:', event.data ? 'present' : 'missing')

  let notificationData = {
    title: 'New Notification',
    body: 'You have a new notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: {},
  }

  if (event.data) {
    try {
      const payload = event.data.json()
      console.log('[Service Worker] Parsed payload:', payload)
      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.body || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        data: payload.data || notificationData.data,
      }
    } catch (e) {
      console.error('[Service Worker] Failed to parse push data as JSON:', e)
      try {
        const text = event.data.text()
        console.log('[Service Worker] Push data as text:', text)
        notificationData.body = text || notificationData.body
      } catch (e2) {
        console.error('[Service Worker] Failed to parse push data as text:', e2)
      }
    }
  } else {
    console.warn('[Service Worker] Push event has no data')
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    data: notificationData.data,
    requireInteraction: false,
    tag: notificationData.data?.debateId || 'default',
    renotify: true,
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
  }

  console.log('[Service Worker] Showing notification:', notificationData.title, options)

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options).then(() => {
      console.log('[Service Worker] Notification shown successfully')
    }).catch((error) => {
      console.error('[Service Worker] Failed to show notification:', error)
    })
  )
})

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification clicked:', event)

  event.notification.close()

  const urlToOpen = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Check if there's already a window/tab open with the target URL
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      // If not, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

self.addEventListener('notificationclose', function(event) {
  console.log('[Service Worker] Notification closed:', event)
})
