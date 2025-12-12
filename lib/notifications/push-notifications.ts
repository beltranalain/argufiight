/**
 * Push Notification Helpers
 * Integrates FCM push notifications with existing notification system
 */

import { prisma } from '@/lib/db/prisma'
import { sendPushNotifications } from '@/lib/firebase/fcm-client'
import { isNotificationTypeEnabled } from './notification-preferences'

/**
 * Send push notification when it's a user's turn in a debate
 */
export async function sendYourTurnPushNotification(
  userId: string,
  debateId: string,
  debateTopic: string
): Promise<void> {
  try {
    // Check if DEBATE_TURN notifications are enabled
    const isEnabled = await isNotificationTypeEnabled('DEBATE_TURN')
    if (!isEnabled) {
      console.log(`[Push Notification] DEBATE_TURN notifications are disabled, skipping`)
      return
    }

    // Get user's FCM tokens
    const tokens = await prisma.fCMToken.findMany({
      where: { userId },
      select: { token: true },
    })

    if (tokens.length === 0) {
      // User hasn't enabled push notifications, that's fine
      return
    }

    // Send push notification
    await sendPushNotifications(
      tokens.map((t) => t.token),
      {
        title: "It's Your Turn!",
        body: `Your opponent submitted their argument in "${debateTopic}"`,
        icon: '/favicon.ico',
        data: {
          type: 'DEBATE_TURN',
          debateId,
          url: `/debate/${debateId}`,
        },
      }
    )

    console.log(`[Push Notification] Sent "Your Turn" notification to user ${userId}`)
  } catch (error: any) {
    // Don't throw - push notifications are optional
    console.error(`[Push Notification] Failed to send to user ${userId}:`, error)
  }
}

/**
 * Send push notification for any notification type
 */
export async function sendPushNotificationForNotification(
  userId: string,
  notificationType: string,
  title: string,
  message: string,
  debateId?: string
): Promise<void> {
  try {
    // Check if this notification type is enabled
    const isEnabled = await isNotificationTypeEnabled(notificationType)
    if (!isEnabled) {
      console.log(`[Push Notification] ${notificationType} notifications are disabled, skipping`)
      return
    }

    // Get user's FCM tokens
    const tokens = await prisma.fCMToken.findMany({
      where: { userId },
      select: { token: true },
    })

    if (tokens.length === 0) {
      return
    }

    // Build URL based on notification type
    let url = '/'
    if (debateId) {
      url = `/debate/${debateId}`
    } else if (notificationType === 'NEW_CHALLENGE') {
      url = '/debates'
    }

    // Send push notification
    await sendPushNotifications(
      tokens.map((t) => t.token),
      {
        title,
        body: message,
        icon: '/favicon.ico',
        data: {
          type: notificationType,
          debateId: debateId || undefined,
          url,
        },
      }
    )

    console.log(`[Push Notification] Sent ${notificationType} to user ${userId}`)
  } catch (error: any) {
    console.error(`[Push Notification] Failed to send to user ${userId}:`, error)
  }
}

/**
 * Clean up invalid FCM tokens (called when push fails with invalid token error)
 */
export async function removeInvalidFCMToken(token: string): Promise<void> {
  try {
    await prisma.fCMToken.deleteMany({
      where: { token },
    })
    console.log(`[Push Notification] Removed invalid token`)
  } catch (error) {
    console.error('Failed to remove invalid FCM token:', error)
  }
}

