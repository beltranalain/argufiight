'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'

/**
 * Manages Web Push API push notifications (VAPID)
 * Requests permission, gets subscription, and registers it with the server
 */
export function PushNotificationManager() {
  const { user } = useAuth()
  const [isSupported, setIsSupported] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    // Check if browser supports notifications and service workers
    if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      setPermission(Notification.permission)
    }
  }, [])

  useEffect(() => {
    if (!user || !isSupported || permission !== 'granted') {
      return
    }

    // Initialize Web Push API and register subscription
    const initializePushNotifications = async () => {
      try {
        // Get VAPID public key from server
        const configResponse = await fetch('/api/firebase/config')
        if (!configResponse.ok) {
          console.log('[Push Notifications] Failed to get VAPID config')
          return
        }

        const config = await configResponse.json()
        if (!config.vapidKey) {
          console.error('[Push Notifications] VAPID public key is missing. Please add it in Admin Settings → Push Notifications')
          return
        }

        // Register service worker (reuse existing if possible)
        let serviceWorkerRegistration: ServiceWorkerRegistration | null = null
        try {
          serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: 'none',
          })
          console.log('[Push Notifications] Service worker registered:', serviceWorkerRegistration.scope)

          // Wait for service worker to activate
          if (serviceWorkerRegistration.installing) {
            await new Promise<void>((resolve) => {
              serviceWorkerRegistration!.installing!.addEventListener('statechange', function() {
                if (this.state === 'activated') resolve()
              })
            })
          } else if (serviceWorkerRegistration.waiting) {
            serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' })
            await new Promise(resolve => setTimeout(resolve, 500))
          }

          await serviceWorkerRegistration.update()
        } catch (error) {
          console.error('[Push Notifications] Service worker registration failed:', error)
          return
        }

        // Check existing subscription — only re-subscribe if VAPID key changed
        let subscription = await serviceWorkerRegistration.pushManager.getSubscription()
        const vapidKeyArray = urlBase64ToUint8Array(config.vapidKey)

        let needsNewSubscription = false
        if (subscription) {
          const existingKey = subscription.options?.applicationServerKey
          if (existingKey) {
            const existingKeyArray = new Uint8Array(existingKey)
            const keysMatch = existingKeyArray.length === vapidKeyArray.length &&
              existingKeyArray.every((val, i) => val === vapidKeyArray[i])

            if (!keysMatch) {
              console.log('[Push Notifications] VAPID key changed, re-subscribing...')
              try { await subscription.unsubscribe() } catch { /* ok */ }
              subscription = null
              needsNewSubscription = true
            } else {
              console.log('[Push Notifications] Existing subscription matches VAPID key, re-registering with server')
            }
          } else {
            // Can't verify key, re-create
            try { await subscription.unsubscribe() } catch { /* ok */ }
            subscription = null
            needsNewSubscription = true
          }
        } else {
          needsNewSubscription = true
        }

        if (needsNewSubscription) {
          console.log('[Push Notifications] Creating new Web Push subscription...')
          try {
            subscription = await serviceWorkerRegistration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: vapidKeyArray.buffer as ArrayBuffer,
            })
            console.log('[Push Notifications] Subscription created:', subscription.endpoint.substring(0, 50) + '...')
          } catch (error: any) {
            console.error('[Push Notifications] Failed to create subscription:', error)
            throw error
          }
        }

        if (subscription) {
          // Register subscription with server
          const device = navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'
          const subscriptionJSON = subscription.toJSON()
          console.log('[Push Notifications] Registering subscription with server...', {
            endpoint: subscriptionJSON.endpoint?.substring(0, 50) + '...',
            hasKeys: !!subscriptionJSON.keys,
          })
          
          const response = await fetch('/api/fcm/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subscription: subscriptionJSON,
              device,
              userAgent: navigator.userAgent,
            }),
          })

          if (response.ok) {
            setIsRegistered(true)
            console.log('[Push Notifications] Subscription registered successfully')
          } else {
            const errorText = await response.text()
            console.error('[Push Notifications] Failed to register subscription:', response.status, errorText)
          }
        }
      } catch (error: any) {
        console.error('[Push Notifications] Initialization error:', error)
        
        // Provide helpful error messages
        if (error.name === 'NotAllowedError') {
          console.error('[Push Notifications] Permission denied. User needs to grant notification permission.')
        } else if (error.name === 'NotSupportedError') {
          console.error('[Push Notifications] Browser does not support Web Push API')
        } else if (error.message?.includes('VAPID')) {
          console.error('[Push Notifications] VAPID key error. Please check Admin Settings → Push Notifications')
        }
      }
    }

    initializePushNotifications()
  }, [user, isSupported, permission])

  // Helper function to convert VAPID key
  function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray as Uint8Array
  }

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

