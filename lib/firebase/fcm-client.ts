/**
 * Firebase Cloud Messaging Client
 * Handles sending push notifications via FCM
 */

import { getFirebaseServerKey } from './config'

export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: {
    debateId?: string
    type?: string
    url?: string
    [key: string]: any
  }
}

/**
 * Send push notification to a single FCM token
 */
export async function sendPushNotification(
  token: string,
  payload: PushNotificationPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const serverKey = await getFirebaseServerKey()

    if (!serverKey) {
      console.error('Firebase server key not configured')
      return { success: false, error: 'Firebase server key not configured' }
    }

    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${serverKey}`,
      },
      body: JSON.stringify({
        to: token,
        notification: {
          title: payload.title,
          body: payload.body,
          icon: payload.icon || '/favicon.ico',
          badge: payload.badge || '/favicon.ico',
        },
        data: {
          ...payload.data,
          click_action: payload.data?.url || 'FLUTTER_NOTIFICATION_CLICK',
        },
        webpush: {
          fcm_options: {
            link: payload.data?.url || '/',
          },
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('FCM send error:', errorData)
      return {
        success: false,
        error: errorData.error?.message || `HTTP ${response.status}`,
      }
    }

    const result = await response.json()
    
    // Check if token is invalid and should be removed
    if (result.failure === 1 && result.results?.[0]?.error) {
      const error = result.results[0].error
      if (
        error === 'InvalidRegistration' ||
        error === 'NotRegistered' ||
        error === 'MismatchSenderId'
      ) {
        return {
          success: false,
          error: 'INVALID_TOKEN', // Special error code to indicate token should be removed
        }
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Failed to send push notification:', error)
    return { success: false, error: error.message || 'Unknown error' }
  }
}

/**
 * Send push notification to multiple FCM tokens
 */
export async function sendPushNotifications(
  tokens: string[],
  payload: PushNotificationPayload
): Promise<{ success: number; failed: number; errors: string[] }> {
  if (tokens.length === 0) {
    return { success: 0, failed: 0, errors: [] }
  }

  // FCM allows up to 1000 tokens per batch
  const batchSize = 1000
  let success = 0
  let failed = 0
  const errors: string[] = []

  for (let i = 0; i < tokens.length; i += batchSize) {
    const batch = tokens.slice(i, i + batchSize)
    
    // For multiple tokens, use multicast
    const serverKey = await getFirebaseServerKey()
    if (!serverKey) {
      failed += batch.length
      errors.push('Firebase server key not configured')
      continue
    }

    try {
      const response = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `key=${serverKey}`,
        },
        body: JSON.stringify({
          registration_ids: batch,
          notification: {
            title: payload.title,
            body: payload.body,
            icon: payload.icon || '/favicon.ico',
            badge: payload.badge || '/favicon.ico',
          },
          data: {
            ...payload.data,
            click_action: payload.data?.url || 'FLUTTER_NOTIFICATION_CLICK',
          },
          webpush: {
            fcm_options: {
              link: payload.data?.url || '/',
            },
          },
        }),
      })

      if (!response.ok) {
        failed += batch.length
        const errorData = await response.json().catch(() => ({}))
        errors.push(errorData.error?.message || `HTTP ${response.status}`)
        continue
      }

      const result = await response.json()
      
      // Count successes and failures
      if (result.results) {
        result.results.forEach((r: any, index: number) => {
          if (r.error) {
            failed++
            errors.push(`Token ${batch[index]}: ${r.error}`)
          } else {
            success++
          }
        })
      } else {
        success += batch.length
      }
    } catch (error: any) {
      failed += batch.length
      errors.push(error.message || 'Unknown error')
    }
  }

  return { success, failed, errors }
}

