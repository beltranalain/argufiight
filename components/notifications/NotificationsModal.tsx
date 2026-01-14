'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  readAt: string | null
  createdAt: string
  debate?: {
    id: string
    topic: string
  }
}

interface NotificationsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
      // Also refresh after a short delay to catch any new notifications
      const refreshTimer = setTimeout(() => {
        fetchNotifications()
      }, 500)
      return () => clearTimeout(refreshTimer)
    }
  }, [isOpen])

  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/notifications?t=${Date.now()}`, {
        cache: 'no-store',
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        // Ensure data is an array before using array methods
        const notifications = Array.isArray(data) ? data : []
        console.log('[NotificationsModal] Fetched notifications:', notifications.length)
        setNotifications(notifications)
        setUnreadCount(notifications.filter((n: Notification) => !n.read).length)
      } else {
        console.error('[NotificationsModal] Failed to fetch - status:', response.status)
        const errorData = await response.json().catch(() => ({}))
        console.error('[NotificationsModal] Error data:', errorData)
        setNotifications([])
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('[NotificationsModal] Failed to fetch notifications:', error)
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      })
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId
              ? { ...n, read: true, readAt: new Date().toISOString() }
              : n
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
      })
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, read: true, readAt: new Date().toISOString() }))
        )
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    if (notification.debate) {
      onClose()
      window.location.href = `/debate/${notification.debate.id}`
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'DEBATE_TURN':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'VERDICT_READY':
      case 'DEBATE_WON':
      case 'DEBATE_LOST':
      case 'DEBATE_TIED':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'DEBATE_ACCEPTED':
      case 'NEW_CHALLENGE':
      case 'REMATCH_REQUESTED':
      case 'REMATCH_ACCEPTED':
      case 'REMATCH_DECLINED':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        )
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'DEBATE_WON':
        return 'text-cyber-green'
      case 'DEBATE_LOST':
        return 'text-neon-orange'
      case 'BELT_CHALLENGE':
        return 'text-neon-orange'
      case 'VERDICT_READY':
      case 'REMATCH_REQUESTED':
      case 'REMATCH_ACCEPTED':
        return 'text-electric-blue'
      case 'REMATCH_DECLINED':
        return 'text-text-secondary'
      default:
        return 'text-text-secondary'
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-primary">Notifications</h2>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              onClick={markAllAsRead}
              className="text-xs"
            >
              Mark all as read
            </Button>
          )}
        </div>
        
        {/* Body */}
        <div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="md" />
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            }
            title="No notifications"
            description="You're all caught up! New notifications will appear here."
          />
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  notification.read
                    ? 'bg-bg-tertiary border-bg-tertiary hover:border-bg-secondary'
                    : 'bg-electric-blue/10 border-electric-blue/30 hover:border-electric-blue'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 mt-0.5 ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`font-semibold ${notification.read ? 'text-text-primary' : 'text-electric-blue'}`}>
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span className="flex-shrink-0 w-2 h-2 bg-electric-blue rounded-full" />
                      )}
                    </div>
                    <p className="text-sm text-text-secondary mt-1">
                      {notification.message}
                    </p>
                    {notification.debate && (
                      <p className="text-xs text-text-muted mt-2">
                        Debate: {notification.debate.topic}
                      </p>
                    )}
                    <p className="text-xs text-text-muted mt-2">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
        </div>
        
        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}

