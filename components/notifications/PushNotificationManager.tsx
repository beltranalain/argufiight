'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { getFirebaseConfig } from '@/lib/firebase/client'

/**
 * Manages Firebase Cloud Messaging push notifications
 * Requests permission, gets token, and registers it with the server
 */
export function PushNotificationManager() {
  const { user } = useAuth()
  const [isSupported, setIsSupported] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    // Check if browser supports notifications
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsSupported(true)
      setPermission(Notification.permission)
    }
  }, [])

  useEffect(() => {
    if (!user || !isSupported || permission !== 'granted') {
      return
    }

    // Initialize Firebase and register token
    const initializePushNotifications = async () => {
      try {
        const config = await getFirebaseConfig()
        if (!config) {
          console.log('[Push Notifications] Firebase not configured')
          return
        }

        if (!config.vapidKey) {
          console.error('[Push Notifications] VAPID key is missing. Please add it in Admin Settings → Firebase Push Notifications')
          return
        }

        // Initialize Firebase
        const { initializeApp, getApps } = await import('firebase/app')
        const { getMessaging, getToken, onMessage } = await import('firebase/messaging')

        let app
        const apps = getApps()
        if (apps.length === 0) {
          app = initializeApp(config)
        } else {
          app = apps[0]
        }

        // Register service worker first
        let serviceWorkerRegistration = null
        if ('serviceWorker' in navigator) {
          try {
            serviceWorkerRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
              scope: '/firebase-cloud-messaging-push-scope',
            })
            console.log('[Push Notifications] Service worker registered')
            
            // Wait for service worker to be ready
            await serviceWorkerRegistration.update()
          } catch (error) {
            console.error('[Push Notifications] Service worker registration failed:', error)
            return
          }
        } else {
          console.error('[Push Notifications] Service workers not supported')
          return
        }

        const messaging = getMessaging(app)

        // Get FCM token - VAPID key is required
        const token = await getToken(messaging, {
          vapidKey: config.vapidKey,
          serviceWorkerRegistration: serviceWorkerRegistration,
        })

        if (token) {
          // Register token with server
          const device = navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'
          const response = await fetch('/api/fcm/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token,
              device,
              userAgent: navigator.userAgent,
            }),
          })

          if (response.ok) {
            setIsRegistered(true)
            console.log('[Push Notifications] Token registered successfully')
          } else {
            console.error('[Push Notifications] Failed to register token')
          }
        }

        // Handle foreground messages (when user is on the site)
        onMessage(messaging, (payload) => {
          console.log('[Push Notifications] Message received:', payload)
          // You can show a custom notification or update UI
          if (payload.notification) {
            // Optionally show a toast or update notification count
          }
        })
      } catch (error: any) {
        console.error('[Push Notifications] Initialization error:', error)
        
        // Provide helpful error messages
        if (error.code === 'messaging/unsupported-browser') {
          console.log('[Push Notifications] Browser does not support FCM')
        } else if (error.code === 'messaging/token-subscribe-failed') {
          console.error('[Push Notifications] Failed to subscribe to FCM. This usually means:')
          console.error('1. VAPID key is missing or invalid - check Admin Settings → Firebase Push Notifications')
          console.error('2. Cloud Messaging API is not enabled in Firebase Console')
          console.error('3. Firebase project configuration is incorrect')
        } else if (error.message?.includes('authentication credential')) {
          console.error('[Push Notifications] Authentication error. Please check:')
          console.error('1. VAPID key is correctly set in Admin Settings')
          console.error('2. Cloud Messaging API is enabled in Firebase Console')
          console.error('3. Firebase project ID matches in all settings')
        }
      }
    }

    initializePushNotifications()
  }, [user, isSupported, permission])

  // Request notification permission
  const requestPermission = async () => {
    if (!isSupported) {
      return
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)

      if (result === 'granted') {
        // Permission granted, token registration will happen in useEffect
        console.log('[Push Notifications] Permission granted')
      } else {
        console.log('[Push Notifications] Permission denied')
      }
    } catch (error) {
      console.error('[Push Notifications] Error requesting permission:', error)
    }
  }

  // Don't render anything - this is a background service
  return null
}

/**
 * Hook to request push notification permission
 * Call this from a button or on page load
 */
export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsSupported(true)
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    if (!isSupported) {
      return false
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result === 'granted'
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }

  return {
    permission,
    isSupported,
    isGranted: permission === 'granted',
    requestPermission,
  }
}

