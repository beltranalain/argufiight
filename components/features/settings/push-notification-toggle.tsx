'use client'

import { usePushNotifications } from '@/lib/hooks/use-push-notifications'
import { useToast } from '@/components/ui/toast'
import { BellOff, Loader2 } from 'lucide-react'

export function PushNotificationToggle() {
  const { isSupported, permission, state, error, subscribe, unsubscribe } =
    usePushNotifications()
  const toast = useToast()

  if (!isSupported) {
    return (
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-[450] text-text">Push notifications</p>
          <p className="text-[13px] text-text-3 mt-0.5">
            Not supported in this browser
          </p>
        </div>
        <BellOff size={14} className="text-text-3 flex-shrink-0" />
      </div>
    )
  }

  if (permission === 'denied') {
    return (
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-[450] text-text">Push notifications</p>
          <p className="text-[13px] text-text-3 mt-0.5">
            Blocked by browser. Enable in your browser&apos;s site settings.
          </p>
        </div>
        <BellOff size={14} className="text-text-3 flex-shrink-0" />
      </div>
    )
  }

  const isSubscribed = state === 'subscribed'
  const isLoading = state === 'loading'

  async function handleToggle() {
    if (isLoading) return
    if (isSubscribed) {
      const ok = await unsubscribe()
      if (ok) toast.success('Push notifications disabled')
      else toast.error('Failed to disable notifications')
    } else {
      const ok = await subscribe()
      if (ok) toast.success('Push notifications enabled')
      else if (permission !== 'denied') {
        toast.error(error || 'Failed to enable notifications')
      }
    }
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-[450] text-text">Push notifications</p>
        <p className="text-[13px] text-text-3 mt-0.5">
          {isSubscribed
            ? 'Receive alerts for debate turns, verdicts, and challenges'
            : 'Get notified about your debates even when the tab is closed'}
        </p>
      </div>
      <button
        role="switch"
        aria-checked={isSubscribed}
        onClick={handleToggle}
        disabled={isLoading}
        className={[
          'relative flex-shrink-0 h-5 w-9 rounded-full transition-colors duration-200 cursor-pointer disabled:opacity-40 overflow-hidden',
          isSubscribed ? 'bg-accent' : 'bg-surface-3',
        ].join(' ')}
      >
        {isLoading ? (
          <span className="absolute top-[2px] left-[10px]">
            <Loader2 size={12} className="animate-spin text-text-3" />
          </span>
        ) : (
          <span
            className={[
              'absolute top-[2px] h-4 w-4 rounded-full bg-bg shadow-sm transition-transform duration-200',
              isSubscribed ? 'translate-x-[18px]' : 'translate-x-[2px]',
            ].join(' ')}
          />
        )}
      </button>
    </div>
  )
}
