'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'

interface Session {
  id: string
  token: string
  createdAt: string
  expiresAt: string
  user: {
    id: string
    email: string
    username: string
    avatarUrl: string | null
    isAdmin: boolean
  }
}

export function AccountSwitcher() {
  const { user, refetch } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (user) {
      fetchSessions()
    }
  }, [user])

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/auth/sessions')
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    }
  }

  const switchAccount = async (sessionToken: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/switch-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken }),
      })

      if (response.ok) {
        // Refresh user data
        await refetch()
        setIsOpen(false)
        // Reload page to ensure all components update
        window.location.reload()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to switch account')
      }
    } catch (error) {
      console.error('Failed to switch account:', error)
      alert('Failed to switch account')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user || sessions.length <= 1) {
    // Don't show switcher if user has only one session
    return null
  }

  return (
    <div className="relative">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <Avatar src={user.avatarUrl} alt={user.username} size="sm" />
        <span className="text-xs">{sessions.length} accounts</span>
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 bg-bg-secondary border border-bg-tertiary rounded-lg shadow-lg z-50">
            <div className="p-3 border-b border-bg-tertiary">
              <p className="text-sm font-semibold text-text-primary">Switch Account</p>
              <p className="text-xs text-text-secondary mt-1">
                {sessions.length} active session{sessions.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {sessions.map((session) => {
                const isCurrent = session.user.id === user.id
                return (
                  <button
                    key={session.id}
                    onClick={() => {
                      if (!isCurrent) {
                        switchAccount(session.token)
                      }
                    }}
                    disabled={isCurrent || isLoading}
                    className={`w-full p-3 flex items-center gap-3 hover:bg-bg-tertiary transition-colors ${
                      isCurrent ? 'bg-electric-blue/10' : ''
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Avatar
                      src={session.user.avatarUrl}
                      alt={session.user.username}
                      size="sm"
                    />
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {session.user.username}
                      </p>
                      <p className="text-xs text-text-secondary truncate">
                        {session.user.email}
                      </p>
                    </div>
                    {isCurrent && (
                      <span className="text-xs text-electric-blue">Current</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

