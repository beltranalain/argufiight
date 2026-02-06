'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  debateId: string | null
  read: boolean
  createdAt: string
  priority?: 'high' | 'medium' | 'low'
}

interface TickerUpdate {
  id: string
  type: 'BIG_BATTLE' | 'HIGH_VIEWS' | 'MAJOR_UPSET' | 'NEW_VERDICT' | 'STREAK' | 'MILESTONE' | 'SPONSORED' | 'ADVERTISER'
  title: string
  message: string
  debateId: string | null
  priority: 'high' | 'medium' | 'low'
  createdAt: string
  destinationUrl?: string
  adId?: string
  imageUrl?: string
}

export function NotificationTicker() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [tickerUpdates, setTickerUpdates] = useState<TickerUpdate[]>([])
  const [yourTurnUpdate, setYourTurnUpdate] = useState<TickerUpdate | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [itemsToShow, setItemsToShow] = useState<(Notification | TickerUpdate)[]>([])

  // Fetch ticker updates from API
  const fetchTickerUpdates = async () => {
    try {
      const response = await fetch('/api/ticker', {
        cache: 'no-store',
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        const updates = data.updates || []
        setTickerUpdates(updates as TickerUpdate[])
      } else {
        console.error('[Ticker] Failed to fetch - status:', response.status)
      }
    } catch (error) {
      console.error('[Ticker] Failed to fetch updates:', error)
    }
  }

  // Fetch user notifications (include for admin, skip for advertiser)
  const fetchNotifications = async () => {
    if (!user) return
    const path = typeof window !== 'undefined' ? window.location.pathname : ''
    // Skip notifications for advertiser dashboard, but include for admin
    if (path.startsWith('/advertiser')) return

    try {
      const response = await fetch('/api/notifications?unreadOnly=true', {
        cache: 'no-store',
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setNotifications(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('[Ticker] Failed to fetch notifications:', error)
    }
  }

  // Check if it's user's turn (skip for advertiser/admin)
  const checkYourTurn = async () => {
    if (!user) return
    const path = typeof window !== 'undefined' ? window.location.pathname : ''
    if (path.startsWith('/advertiser') || path.startsWith('/admin')) return

    try {
      const response = await fetch('/api/debates/your-turn', {
        cache: 'no-store',
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        if (data.hasTurn) {
          setYourTurnUpdate({
            id: `your-turn-${data.debateId}`,
            type: 'BIG_BATTLE',
            title: 'YOUR TURN',
            message: `It's your turn in "${data.debateTitle}"`,
            debateId: data.debateId,
            priority: 'high',
            createdAt: new Date().toISOString(),
          })
        } else {
          setYourTurnUpdate(null)
        }
      } else {
        setYourTurnUpdate(null)
      }
    } catch {
      setYourTurnUpdate(null)
    }
  }

  // Check if on advertiser dashboard for faster ticker
  const [isAdvertiserPage, setIsAdvertiserPage] = useState(false)

  useEffect(() => {
    const path = typeof window !== 'undefined' ? window.location.pathname : ''
    setIsAdvertiserPage(path.startsWith('/advertiser'))
  }, [])

  // Combine and filter items
  useEffect(() => {
    const path = typeof window !== 'undefined' ? window.location.pathname : ''
    const isAdvertiser = path.startsWith('/advertiser')
    const isAdmin = path.startsWith('/admin')

    const combined: (Notification | TickerUpdate)[] = []

    if (isAdvertiser) {
      const advertiserUpdates = tickerUpdates.filter(t => t.type === 'ADVERTISER')
      const sponsoredAds = tickerUpdates.filter(t => t.type === 'SPONSORED')
      combined.push(...advertiserUpdates)
      combined.push(...sponsoredAds)
    } else if (isAdmin) {
      const adminUpdates = tickerUpdates.filter(t => t.type === 'ADVERTISER')
      const sponsoredAds = tickerUpdates.filter(t => t.type === 'SPONSORED')
      const unreadNotifications = notifications.filter(n => !n.read)
      combined.push(...adminUpdates)
      combined.push(...sponsoredAds)
      combined.push(...unreadNotifications)
    } else {
      if (yourTurnUpdate) combined.push(yourTurnUpdate)
      combined.push(...notifications.filter(n => !n.read))
      combined.push(...tickerUpdates.filter(t => t.type !== 'ADVERTISER'))
      combined.push(...notifications.filter(n => n.read))
    }

    // Filter: always show sponsored ads and advertiser updates, others must be recent
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const filtered = combined.filter(item => {
      if ('type' in item && (item.type === 'SPONSORED' || item.type === 'ADVERTISER')) {
        return true // Always show ads
      }
      const itemDate = new Date(item.createdAt)
      return itemDate > oneDayAgo || ('read' in item && !item.read)
    })

    setItemsToShow(filtered.slice(0, 20))
  }, [notifications, tickerUpdates, yourTurnUpdate])

  // Fetch data on mount with visibility-based polling
  useEffect(() => {
    const path = typeof window !== 'undefined' ? window.location.pathname : ''
    const isAdvertiserPage = path.startsWith('/advertiser')
    const isAdminPage = path.startsWith('/admin')

    let tickerInterval: NodeJS.Timeout
    let notificationInterval: NodeJS.Timeout | undefined
    let yourTurnInterval: NodeJS.Timeout | undefined

    const startPolling = () => {
      fetchTickerUpdates()
      tickerInterval = setInterval(fetchTickerUpdates, 120000) // 2 minutes

      if (user) {
        if (isAdminPage) {
          fetchNotifications()
          notificationInterval = setInterval(fetchNotifications, 120000) // 2 minutes
        } else if (!isAdvertiserPage) {
          fetchNotifications()
          checkYourTurn()
          notificationInterval = setInterval(fetchNotifications, 120000) // 2 minutes
          yourTurnInterval = setInterval(checkYourTurn, 60000) // 1 minute
        }
      }
    }

    const stopPolling = () => {
      clearInterval(tickerInterval)
      if (notificationInterval) clearInterval(notificationInterval)
      if (yourTurnInterval) clearInterval(yourTurnInterval)
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling()
      } else {
        startPolling()
      }
    }

    startPolling()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      stopPolling()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user])

  // Track ad clicks
  const handleAdClick = async (item: TickerUpdate) => {
    if (item.adId && item.destinationUrl) {
      try {
        await fetch('/api/ads/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'CLICK', adId: item.adId }),
        })
        window.open(item.destinationUrl, '_blank', 'noopener,noreferrer')
      } catch (error) {
        console.error('Failed to track ad click:', error)
      }
    }
  }

  // Track impressions
  useEffect(() => {
    const sponsoredItems = itemsToShow.filter(
      (item): item is TickerUpdate => 'type' in item && item.type === 'SPONSORED' && !!(item as TickerUpdate).adId
    )
    
    if (sponsoredItems.length > 0) {
      const uniqueAdIds = new Set(sponsoredItems.map(item => item.adId).filter(Boolean))
      uniqueAdIds.forEach(async (adId) => {
        try {
          await fetch('/api/ads/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'IMPRESSION', adId }),
          })
        } catch (error) {
          console.error('Failed to track ad impression:', error)
        }
      })
    }
  }, [itemsToShow])

  // Get item URL
  const getItemUrl = (item: Notification | TickerUpdate): string => {
    if ('debateId' in item && item.debateId) {
      return `/debate/${item.debateId}`
    }
    return '/'
  }

  // Get item color
  const getItemColor = (item: Notification | TickerUpdate): string => {
    if ('priority' in item && !('read' in item)) {
      const tickerUpdate = item as TickerUpdate
      switch (tickerUpdate.type) {
        case 'BIG_BATTLE':
          return tickerUpdate.title === 'YOUR TURN' ? 'text-neon-orange font-bold' : 'text-neon-orange'
        case 'HIGH_VIEWS':
          return 'text-electric-blue'
        case 'MAJOR_UPSET':
          return 'text-red-400'
        case 'NEW_VERDICT':
          return 'text-cyber-green'
        case 'STREAK':
          return 'text-yellow-400'
        case 'MILESTONE':
          return 'text-purple-400'
        case 'SPONSORED':
          return 'text-yellow-400 font-semibold'
        case 'ADVERTISER':
          return 'text-electric-blue font-semibold'
        default:
          return 'text-electric-blue'
      }
    }
    
    if ('read' in item) {
      return (item as Notification).read ? 'text-text-secondary' : 'text-electric-blue'
    }
    
    return 'text-text-primary'
  }

  // Don't render if no items
  if (itemsToShow.length === 0) {
    return null
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-bg-secondary border-t border-bg-tertiary"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative h-9 flex items-center overflow-hidden">
        {/* LIVE Badge */}
        <div className="absolute left-0 top-0 bottom-0 bg-electric-blue text-black px-3 flex items-center font-bold text-[10px] tracking-wider z-10 border-r border-bg-tertiary">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" />
            <span className="whitespace-nowrap uppercase">LIVE</span>
          </div>
        </div>

        {/* Scrolling container */}
        <div className="flex-1 overflow-hidden ml-14 relative">
          <div
            className={`ticker-wrapper flex items-center gap-4 h-full ticker-scroll ${isAdvertiserPage ? 'fast' : ''} ${isPaused ? 'paused' : ''}`}
          >
            {/* Render items twice for seamless loop */}
            {[...itemsToShow, ...itemsToShow].map((item, index) => (
              <Link
                key={`${item.id}-${index}`}
                href={getItemUrl(item)}
                className={`flex items-center gap-2 px-3 py-1 transition-colors hover:opacity-80 whitespace-nowrap ${getItemColor(item)} ${('priority' in item && item.priority === 'high' && item.title === 'YOUR TURN') ? 'animate-pulse' : ''} ${('type' in item && item.type === 'SPONSORED') ? 'cursor-pointer' : ''}`}
                onClick={async (e) => {
                  if ('type' in item && item.type === 'SPONSORED') {
                    e.preventDefault()
                    handleAdClick(item as TickerUpdate)
                    return
                  }
                  
                  if ('read' in item && !item.read && user) {
                    try {
                      await fetch(`/api/notifications/${item.id}/read`, { method: 'POST' })
                      fetchNotifications()
                    } catch (error) {
                      console.error('Failed to mark notification as read:', error)
                    }
                  }
                  if ('priority' in item && item.title === 'YOUR TURN') {
                    checkYourTurn()
                  }
                }}
              >
                {/* Render content */}
                {(() => {
                  const itemAny = item as any
                  
                  // Sponsored ad with image
                  if (itemAny.type === 'SPONSORED' && itemAny.imageUrl) {
                    return (
                      <div className="flex items-center gap-2">
                        <img
                          src={itemAny.imageUrl}
                          alt={itemAny.message || 'Sponsored Advertisement'}
                          className="h-7 w-auto object-contain max-w-[200px]"
                        />
                        {itemAny.destinationUrl && (
                          <span className="text-[10px] text-text-secondary opacity-70 whitespace-nowrap">
                            {itemAny.destinationUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                          </span>
                        )}
                      </div>
                    )
                  }
                  
                  // Regular text content
                  return (
                    <>
                      <span className="text-xs font-semibold">{item.title}</span>
                      <span className="text-[10px] opacity-70">{item.message}</span>
                      {('priority' in item && item.priority === 'high' && item.title === 'YOUR TURN') && (
                        <span className="w-2 h-2 bg-neon-orange rounded-full animate-pulse" />
                      )}
                    </>
                  )
                })()}
              </Link>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}








