'use client'

import { useState, useEffect, useRef } from 'react'
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
}

export function NotificationTicker() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isPaused, setIsPaused] = useState(false)
  const tickerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) return

    fetchNotifications()
    const interval = setInterval(() => {
      fetchNotifications()
    }, 30000)

    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    if (!contentRef.current || notifications.length === 0) return

    const visibleNotifications = notifications.filter(
      n => !n.read || new Date(n.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).slice(0, 10)

    if (visibleNotifications.length === 0) return

    const content = contentRef.current
    let animationId: number
    let position = 0
    const speed = 1 // pixels per frame - consistent speed

    const animate = () => {
      if (!isPaused && content) {
        position += speed
        
        // Calculate width of one set of notifications
        const gap = 16 // gap-4 = 16px
        let singleSetWidth = 0
        for (let i = 0; i < visibleNotifications.length; i++) {
          const child = content.children[i] as HTMLElement
          if (child) {
            singleSetWidth += child.getBoundingClientRect().width + gap
          }
        }
        
        // Reset when we've scrolled one full set
        if (position >= singleSetWidth) {
          position = 0
        }
        
        content.style.transform = `translateX(-${position}px)`
      }
      
      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [notifications, isPaused])

  const fetchNotifications = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/notifications?limit=20')
      if (response.ok) {
        const data = await response.json()
        const fetchedNotifications = Array.isArray(data) ? data : (data.notifications || [])
        setNotifications(fetchedNotifications)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  const getNotificationColor = (notification: Notification): string => {
    const isWin = notification.title.toLowerCase().includes('won') || 
                  notification.message.toLowerCase().includes('won')
    const isLoss = notification.title.toLowerCase().includes('lost') || 
                   notification.message.toLowerCase().includes('lost')
    
    if (!notification.read) {
      if (isWin) {
        return 'text-cyber-green'
      }
      if (isLoss) {
        return 'text-red-400'
      }
      
      switch (notification.type) {
        case 'YOUR_TURN':
        case 'DEBATE_TURN':
          return 'text-neon-orange'
        case 'VERDICT_READY':
        case 'DEBATE_COMPLETE':
          return 'text-cyber-green'
        case 'APPEAL_SUBMITTED':
        case 'APPEAL_RESOLVED':
          return 'text-yellow-400'
        case 'REMATCH_REQUESTED':
          return 'text-purple-400'
        case 'DEBATE_ACCEPTED':
        case 'NEW_CHALLENGE':
          return 'text-electric-blue'
        default:
          return 'text-electric-blue'
      }
    } else {
      return 'text-text-secondary'
    }
  }

  const getNotificationUrl = (notification: Notification): string => {
    if (notification.debateId) {
      return `/debate/${notification.debateId}`
    }
    return '/dashboard'
  }

  if (!user || notifications.length === 0) {
    return null
  }

  const visibleNotifications = notifications.filter(
    n => !n.read || new Date(n.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  ).slice(0, 10)

  if (visibleNotifications.length === 0) {
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

        {/* Scrolling notifications */}
        <div
          ref={tickerRef}
          className="flex-1 overflow-hidden ml-14"
        >
          <div
            ref={contentRef}
            className="ticker-content flex items-center gap-4 h-full"
            style={{ width: 'max-content' }}
          >
            {/* Original notifications */}
            {visibleNotifications.map((notification) => (
              <Link
                key={notification.id}
                href={getNotificationUrl(notification)}
                className={`flex items-center gap-2 px-3 py-1 transition-colors hover:opacity-80 whitespace-nowrap ${getNotificationColor(notification)}`}
                onClick={async () => {
                  if (!notification.read) {
                    try {
                      await fetch(`/api/notifications/${notification.id}/read`, {
                        method: 'POST',
                      })
                      fetchNotifications()
                    } catch (error) {
                      console.error('Failed to mark notification as read:', error)
                    }
                  }
                }}
              >
                <span className="text-xs font-semibold">
                  {notification.title}
                </span>
                <span className="text-[10px] opacity-70">
                  {notification.message}
                </span>
                {!notification.read && (
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0 bg-current" />
                )}
              </Link>
            ))}
            
            {/* Duplicate for seamless loop */}
            {visibleNotifications.map((notification) => (
              <Link
                key={`${notification.id}-duplicate`}
                href={getNotificationUrl(notification)}
                className={`flex items-center gap-2 px-3 py-1 transition-colors hover:opacity-80 whitespace-nowrap ${getNotificationColor(notification)}`}
              >
                <span className="text-xs font-semibold">
                  {notification.title}
                </span>
                <span className="text-[10px] opacity-70">
                  {notification.message}
                </span>
                {!notification.read && (
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0 bg-current" />
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
