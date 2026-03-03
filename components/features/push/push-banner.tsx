'use client'

import { useState, useEffect } from 'react'
import { usePushNotifications } from '@/lib/hooks/use-push-notifications'
import { BellRing, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const DISMISS_KEY = 'argufight_push_banner_dismissed'

export function PushBanner() {
  const { isSupported, permission, state, subscribe } = usePushNotifications()
  const [dismissed, setDismissed] = useState(true) // start hidden to avoid flash

  useEffect(() => {
    const wasDismissed = localStorage.getItem(DISMISS_KEY)
    setDismissed(!!wasDismissed)
  }, [])

  // Don't show if not supported, already subscribed, denied, dismissed, or loading
  if (
    !isSupported ||
    state === 'subscribed' ||
    permission === 'denied' ||
    dismissed ||
    state === 'loading'
  ) {
    return null
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, 'true')
    setDismissed(true)
  }

  async function handleEnable() {
    const ok = await subscribe()
    if (ok) setDismissed(true)
  }

  return (
    <div className="relative mx-4 mt-3 mb-1 px-4 py-3 bg-surface border border-border rounded-[var(--radius)] flex items-center gap-3">
      <BellRing size={16} className="text-accent flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-[450] text-text">Never miss a debate turn</p>
        <p className="text-[13px] text-text-3 mt-0.5">
          Enable push notifications to get alerts when it&apos;s your turn,
          verdicts are in, or you receive a challenge.
        </p>
      </div>
      <Button
        variant="accent"
        size="sm"
        onClick={handleEnable}
        className="flex-shrink-0"
      >
        Enable
      </Button>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-surface-3 text-text-3 hover:text-text transition-colors cursor-pointer"
        aria-label="Dismiss"
      >
        <X size={12} />
      </button>
    </div>
  )
}
