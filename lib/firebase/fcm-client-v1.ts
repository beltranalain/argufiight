/**
 * Firebase Cloud Messaging Client (V1 API)
 * Uses Service Account authentication (modern approach)
 */

import { getFirebaseServiceAccount } from './config'

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
 * Get OAuth2 access token for Service Account
 */
async function getAccessToken(serviceAccount: any): Promise<string> {
  const jwt = require('jsonwebtoken')
  const now = Math.floor(Date.now() / 1000)
  
  const token = jwt.sign(
    {
      iss: serviceAccount.client_email,
      sub: serviceAccount.client_email,
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600, // 1 hour
      iat: now,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
    },
    serviceAccount.private_key,
    { algorithm: 'RS256' }
  )

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: token,
    }),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(`Failed to get access token: ${data.error || 'Unknown error'}`)
  }

  return data.access_token
}

/**
 * Send push notification using V1 API
 */
export async function sendPushNotificationV1(
  token: string,
  payload: PushNotificationPayload,
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const serviceAccount = await getFirebaseServiceAccount()
    if (!serviceAccount) {
      return { success: false, error: 'Firebase service account not configured' }
    }

    const accessToken = await getAccessToken(serviceAccount)

    const message = {
      message: {
        token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        webpush: {
          notification: {
            title: payload.title,
            body: payload.body,
            icon: payload.icon || '/favicon.ico',
            badge: payload.badge || '/favicon.ico',
          },
          fcm_options: {
            link: payload.data?.url || '/',
          },
        },
        data: {
          ...Object.fromEntries(
            Object.entries(payload.data || {}).map(([k, v]) => [k, String(v)])
          ),
        },
      },
    }

    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(message),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.error?.message || `HTTP ${response.status}`,
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Failed to send push notification (V1):', error)
    return { success: false, error: error.message || 'Unknown error' }
  }
}

