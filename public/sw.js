// Service Worker for Web Push Notifications (VAPID)
// This replaces the Firebase service worker

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push received:', event)

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
      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.body || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        data: payload.data || notificationData.data,
      }
    } catch (e) {
      console.error('[Service Worker] Failed to parse push data:', e)
      notificationData.body = event.data.text() || notificationData.body
    }
  }

  const options = {
    title: notificationData.title,
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    data: notificationData.data,
    requireInteraction: false,
    tag: notificationData.data?.debateId || 'default',
    renotify: true,
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
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
