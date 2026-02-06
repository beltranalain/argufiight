'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const NotificationTicker = dynamic(
  () => import('./NotificationTicker').then(mod => ({ default: mod.NotificationTicker })),
  { ssr: false }
)

const PushNotificationManager = dynamic(
  () => import('./PushNotificationManager').then(mod => ({ default: mod.PushNotificationManager })),
  { ssr: false }
)

export function LazyNotifications() {
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    const hasCookie = document.cookie.includes('session=')
    setHasSession(hasCookie)
  }, [])

  if (!hasSession) return null

  return (
    <>
      <NotificationTicker />
      <PushNotificationManager />
    </>
  )
}
