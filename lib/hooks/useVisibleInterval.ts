'use client'

import { useEffect, useRef } from 'react'

/**
 * Like setInterval, but only fires when the tab is visible.
 * Also triggers an immediate callback when the tab regains focus.
 */
export function useVisibleInterval(callback: () => void, ms: number) {
  const savedCallback = useRef(callback)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') {
        savedCallback.current()
      }
    }

    const onFocus = () => {
      savedCallback.current()
    }

    const id = setInterval(tick, ms)
    window.addEventListener('focus', onFocus)

    return () => {
      clearInterval(id)
      window.removeEventListener('focus', onFocus)
    }
  }, [ms])
}
