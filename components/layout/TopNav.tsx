'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/lib/hooks/useAuth'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { NotificationsModal } from '@/components/notifications/NotificationsModal'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { AccountSwitcher } from '@/components/auth/AccountSwitcher'
import { AnimatePresence } from 'framer-motion'

interface TopNavProps {
  currentPanel: string
}

export function TopNav({ currentPanel }: TopNavProps) {
  const { user, logout } = useAuth()
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isAccountSwitcherOpen, setIsAccountSwitcherOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [userTier, setUserTier] = useState<'FREE' | 'PRO' | null>(null)
  const [isAdvertiser, setIsAdvertiser] = useState(false)
  const [accountCount, setAccountCount] = useState(0)

  useEffect(() => {
    if (user) {
      fetchUnreadCount()
      fetchUserTier()
      checkIfAdvertiser()
      fetchAccountCount()
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  const fetchAccountCount = async () => {
    try {
      if (typeof window === 'undefined') return
      const linkedAccountIds = JSON.parse(localStorage.getItem('argufight_linked_accounts') || '[]')
      const response = await fetch('/api/auth/sessions', {
        headers: {
          'x-linked-accounts': JSON.stringify(linkedAccountIds),
        },
      })
      if (response.ok) {
        const data = await response.json()
        setAccountCount(data.sessions?.length || 1)
      }
    } catch (error) {
      console.error('Failed to fetch account count:', error)
      setAccountCount(1)
    }
  }
  
  const checkIfAdvertiser = async () => {
    try {
      const response = await fetch('/api/advertiser/me')
      if (response.ok) {
        setIsAdvertiser(true)
      } else if (response.status === 404) {
        // 404 is expected if user is not an advertiser - not an error
        setIsAdvertiser(false)
      } else {
        // Other errors (401, 403, 500, etc.) - user is not an advertiser
        setIsAdvertiser(false)
      }
    } catch (error) {
      // Network error - assume not an advertiser
      // Silently fail - don't log 404s as errors
      setIsAdvertiser(false)
    }
  }

  const fetchUserTier = async () => {
    try {
      const response = await fetch('/api/subscriptions')
      if (response.ok) {
        const data = await response.json()
        setUserTier(data.subscription?.tier || 'FREE')
      }
    } catch (error) {
      console.error('Failed to fetch user tier:', error)
      setUserTier('FREE') // Default to FREE
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications?unreadOnly=true')
      if (response.ok) {
        const notifications = await response.json()
        setUnreadCount(notifications.length)
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  }

  const menuItems = isAdvertiser ? [
    {
      label: 'Profile',
      onClick: () => window.location.href = '/advertiser/dashboard',
    },
    {
      label: 'Settings',
      onClick: () => window.location.href = '/advertiser/settings',
    },
    {
      label: `Log out @${user?.username || ''}`,
      variant: 'danger' as const,
      onClick: logout,
    },
  ] : [
    {
      label: 'Profile',
      onClick: () => window.location.href = '/profile',
    },
    {
      label: 'Saved Debates',
      onClick: () => window.location.href = '/debates/saved',
    },
    {
      label: 'Direct Messages',
      onClick: () => window.location.href = '/messages',
    },
    {
      label: 'Support',
      onClick: () => window.location.href = '/support',
    },
    {
      label: 'Creator Dashboard',
      onClick: () => window.location.href = '/creator/dashboard',
      variant: 'default' as const,
    },
    ...(userTier === 'FREE' ? [{
      label: 'Upgrade to Pro',
      onClick: () => window.location.href = '/upgrade',
      variant: 'default' as const,
    }] : []),
    {
      label: 'Settings',
      onClick: () => window.location.href = '/settings',
    },
    {
      label: `Log out @${user?.username || ''}`,
      variant: 'danger' as const,
      onClick: logout,
    },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 md:h-20 bg-bg-primary/80 backdrop-blur-sm border-b border-bg-tertiary z-50">
      <div className="h-full px-4 md:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <span className="text-lg md:text-xl font-bold text-electric-blue">
            ARGU FIGHT
          </span>
        </Link>

        {/* Panel Title */}
        <h2 className="absolute left-1/2 -translate-x-1/2 text-lg md:text-2xl font-bold text-text-primary hidden md:block">
          {currentPanel}
        </h2>

        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Admin Link (only for admins) */}
          {user?.isAdmin && (
            <Link 
              href="/admin" 
              className="px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm font-medium text-electric-blue hover:text-neon-orange transition-colors border border-electric-blue/30 rounded-lg hover:bg-electric-blue/10"
            >
              <span className="hidden sm:inline">Admin</span>
              <span className="sm:hidden">A</span>
            </Link>
          )}

          {/* Notifications */}
          {user && (
            <button 
              onClick={() => setIsNotificationsOpen(true)}
              className="relative p-1.5 md:p-2 hover:bg-bg-tertiary rounded-lg transition-colors touch-manipulation"
              aria-label="Notifications"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 md:top-1 md:right-1 min-w-[16px] h-[16px] md:min-w-[18px] md:h-[18px] px-1 md:px-1.5 bg-neon-orange text-black text-[10px] md:text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          )}

          {/* Switch Account Box */}
          {user && (
            <button
              onClick={() => setIsAccountSwitcherOpen(true)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-bg-tertiary rounded-lg transition-colors border border-electric-blue/30 hover:border-electric-blue bg-bg-tertiary/50"
              title="Switch Account"
            >
              <svg className="w-4 h-4 text-electric-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span className="text-sm font-medium text-electric-blue">
                {accountCount > 1 ? `${accountCount} accounts` : 'Switch'}
              </span>
            </button>
          )}

          {/* Profile */}
          {user ? (
            <DropdownMenu
              trigger={
                <div className="flex items-center gap-3 hover:bg-bg-tertiary rounded-lg p-2 transition-colors cursor-pointer">
                  <Avatar 
                    src={user.avatarUrl} 
                    username={user.username}
                    size="sm"
                  />
                  <span className="font-semibold text-text-primary hidden sm:block">
                    {user.username}
                  </span>
                </div>
              }
              items={menuItems}
            />
          ) : (
            <Link href="/login">
              <button className="px-4 py-2 bg-electric-blue text-black font-semibold rounded-lg hover:bg-[#00B8E6] transition-colors">
                Sign In
              </button>
            </Link>
          )}
        </div>
      </div>
      
      {/* Notifications Modal */}
      {user && (
        <NotificationsModal
          isOpen={isNotificationsOpen}
          onClose={() => {
            setIsNotificationsOpen(false)
            fetchUnreadCount() // Refresh count when closing
          }}
        />
      )}

      {/* Account Switcher Modal */}
      <AnimatePresence>
        {isAccountSwitcherOpen && user && (
          <AccountSwitcher
            onClose={() => {
              setIsAccountSwitcherOpen(false)
              fetchAccountCount() // Refresh account count when switcher closes
            }}
          />
        )}
      </AnimatePresence>
    </nav>
  )
}

