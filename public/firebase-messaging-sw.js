// Firebase Cloud Messaging Service Worker
// This file must be in the public directory and accessible at /firebase-messaging-sw.js

// Import Firebase scripts (using compat version for service worker compatibility)
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

// Initialize Firebase with config from environment
// The config will be passed from the main app via the messaging instance
// For now, we'll use a minimal initialization - Firebase will handle the rest
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Fetch Firebase config and initialize
fetch('/api/firebase/config')
  .then((response) => {
    if (!response.ok) {
      throw new Error('Failed to fetch Firebase config')
    }
    return response.json()
  })
  .then((config) => {
    if (config && config.apiKey) {
      firebase.initializeApp({
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId,
      })

      // Retrieve an instance of Firebase Messaging
      const messaging = firebase.messaging()

      // Handle background messages
      messaging.onBackgroundMessage((payload) => {
        console.log('[firebase-messaging-sw.js] Received background message ', payload)

        const notificationTitle = payload.notification?.title || 'New Notification'
        const notificationOptions = {
          body: payload.notification?.body || '',
          icon: payload.notification?.icon || '/favicon.ico',
          badge: '/favicon.ico',
          data: payload.data || {},
        }

        return self.registration.showNotification(notificationTitle, notificationOptions)
      })
    }
  })
  .catch((error) => {
    console.error('[firebase-messaging-sw.js] Failed to initialize Firebase:', error)
  })

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.')

  event.notification.close()

  // Open the app to the URL specified in the notification data
  const urlToOpen = event.notification.data?.url || '/'

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
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

