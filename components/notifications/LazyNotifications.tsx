'use client'

import dynamic from 'next/dynamic'
import { useAuth } from '@/lib/hooks/useAuth'

const NotificationTicker = dynamic(
  () => import('./NotificationTicker').then(mod => ({ default: mod.NotificationTicker })),
  { ssr: false }
)

const PushNotificationManager = dynamic(
  () => import('./PushNotificationManager').then(mod => ({ default: mod.PushNotificationManager })),
  { ssr: false }
)

export function LazyNotifications() {
  const { user, isLoading } = useAuth()

  // Don't render until we know if user is logged in
  // Components handle their own auth checks internally
  if (isLoading || !user) return null

  return (
    <>
      <NotificationTicker />
      <PushNotificationManager />
    </>
  )
}
