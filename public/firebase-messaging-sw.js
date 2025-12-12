// Firebase Cloud Messaging Service Worker
// This file must be in the public directory and accessible at /firebase-messaging-sw.js

// Import Firebase scripts (using compat version for service worker compatibility)
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

// Service worker lifecycle events
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Initialize Firebase with config from main app
// The main app will send the config via postMessage
let firebaseConfig = null
let messaging = null

// Listen for config from main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    firebaseConfig = event.data.config
    initializeFirebase()
  }
})

// Also try to fetch config on service worker startup
fetch('/api/firebase/config')
  .then((response) => response.json())
  .then((config) => {
    if (config && config.apiKey) {
      firebaseConfig = config
      initializeFirebase()
    }
  })
  .catch((error) => {
    console.error('[firebase-messaging-sw.js] Failed to fetch config:', error)
  })

// Initialize Firebase and register messaging handlers
function initializeFirebase() {
  if (!firebaseConfig || messaging) {
    return
  }

  try {
    // Initialize Firebase if not already initialized
    if (!firebase.apps || firebase.apps.length === 0) {
      firebase.initializeApp({
        apiKey: firebaseConfig.apiKey,
        authDomain: firebaseConfig.authDomain,
        projectId: firebaseConfig.projectId,
        storageBucket: firebaseConfig.storageBucket,
        messagingSenderId: firebaseConfig.messagingSenderId,
        appId: firebaseConfig.appId,
      })
    }

    // Retrieve an instance of Firebase Messaging
    messaging = firebase.messaging()

    // Handle background messages - MUST be registered synchronously
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

    console.log('[firebase-messaging-sw.js] Firebase initialized successfully')
  } catch (error) {
    console.error('[firebase-messaging-sw.js] Failed to initialize Firebase:', error)
  }
}

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

